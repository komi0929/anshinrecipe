import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'fallback_key_for_build';

const supabaseAdmin = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

const LINE_CHANNEL_ID = process.env.NEXT_PUBLIC_LINE_CHANNEL_ID;
const LINE_CHANNEL_SECRET = process.env.LINE_CHANNEL_SECRET;

const EMAIL_DOMAINS = ['@line.anshin-recipe.app', '@line.user'];

// タイムアウト付きPromise
const withTimeout = (promise, ms, operation) => {
    const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`TIMEOUT: ${operation} (${ms}ms)`)), ms)
    );
    return Promise.race([promise, timeout]);
};

export async function POST(request) {
    const startTime = Date.now();
    const log = (msg) => console.log(`[AUTH ${Date.now() - startTime}ms] ${msg}`);

    try {
        log('START');
        const body = await request.json();
        const { code, redirectUri, isProRegistration } = body;

        if (!code) {
            return Response.json({ error: 'Missing authorization code' }, { status: 400 });
        }

        const validRedirectUri = redirectUri || `${request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/callback/line`;

        // 1. Exchange code for access token (5秒タイムアウト)
        log('LINE_TOKEN_START');
        const tokenParams = new URLSearchParams({
            grant_type: 'authorization_code',
            code,
            redirect_uri: validRedirectUri,
            client_id: LINE_CHANNEL_ID,
            client_secret: LINE_CHANNEL_SECRET,
        });

        const tokenResponse = await withTimeout(
            fetch('https://api.line.me/oauth2/v2.1/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: tokenParams.toString(),
            }),
            5000,
            'LINE_TOKEN'
        );

        if (!tokenResponse.ok) {
            const error = await tokenResponse.json();
            log(`LINE_TOKEN_ERROR: ${JSON.stringify(error)}`);
            return Response.json({ error: 'Failed to exchange code for token' }, { status: 400 });
        }

        const tokenData = await tokenResponse.json();
        log('LINE_TOKEN_DONE');

        // 2. Get LINE profile (3秒タイムアウト)
        log('LINE_PROFILE_START');
        const profileResponse = await withTimeout(
            fetch('https://api.line.me/v2/profile', {
                headers: { 'Authorization': `Bearer ${tokenData.access_token}` },
            }),
            3000,
            'LINE_PROFILE'
        );

        if (!profileResponse.ok) {
            log('LINE_PROFILE_ERROR');
            return Response.json({ error: 'Failed to get LINE profile' }, { status: 400 });
        }

        const { userId: lineUserId, displayName, pictureUrl } = await profileResponse.json();
        log(`LINE_PROFILE_DONE: ${lineUserId}`);

        // 3. Profile lookup (3秒タイムアウト)
        log('PROFILE_LOOKUP_START');
        let existingProfile = null;
        try {
            const result = await withTimeout(
                supabaseAdmin
                    .from('profiles')
                    .select('id, picture_url, avatar_url')
                    .eq('line_user_id', lineUserId)
                    .maybeSingle(),
                3000,
                'PROFILE_LOOKUP'
            );
            existingProfile = result.data;
            if (result.error) {
                log(`PROFILE_LOOKUP_ERROR: ${result.error.message}`);
            }
        } catch (e) {
            log(`PROFILE_LOOKUP_TIMEOUT: ${e.message}`);
            // タイムアウトでも続行
        }
        log(`PROFILE_LOOKUP_DONE: ${existingProfile ? 'FOUND' : 'NOT_FOUND'}`);

        let userId = null;
        let resolvedEmail = null;

        if (existingProfile) {
            userId = existingProfile.id;
            log('EXISTING_USER');

            // プロファイル更新 (2秒タイムアウト、失敗しても続行)
            const updateData = { display_name: displayName };
            if (pictureUrl) {
                updateData.picture_url = pictureUrl;
                updateData.avatar_url = pictureUrl;
            }
            if (isProRegistration) {
                updateData.is_pro = true;
            }

            try {
                await withTimeout(
                    supabaseAdmin.from('profiles').update(updateData).eq('id', userId),
                    2000,
                    'PROFILE_UPDATE'
                );
                log('PROFILE_UPDATE_DONE');
            } catch (e) {
                log(`PROFILE_UPDATE_SKIP: ${e.message}`);
            }

            // メールアドレス特定 (各ドメイン2秒)
            log('FIND_EMAIL_START');
            for (const domain of EMAIL_DOMAINS) {
                const testEmail = `${lineUserId}${domain}`;
                try {
                    const { data } = await withTimeout(
                        supabaseAdmin.auth.admin.generateLink({ type: 'magiclink', email: testEmail }),
                        2000,
                        `CHECK_EMAIL_${domain}`
                    );
                    if (data?.user) {
                        resolvedEmail = testEmail;
                        log(`FOUND_EMAIL: ${domain}`);
                        break;
                    }
                } catch (e) {
                    log(`EMAIL_CHECK_FAIL: ${domain}`);
                }
            }

            // フォールバック: getUserById
            if (!resolvedEmail) {
                log('FALLBACK_GET_USER');
                try {
                    const { data } = await withTimeout(
                        supabaseAdmin.auth.admin.getUserById(userId),
                        2000,
                        'GET_USER_BY_ID'
                    );
                    if (data?.user?.email) {
                        resolvedEmail = data.user.email;
                        log(`FOUND_EMAIL_BY_ID: ${resolvedEmail}`);
                    }
                } catch (e) {
                    log(`GET_USER_BY_ID_FAIL: ${e.message}`);
                }
            }

        } else {
            // プロファイルなし - Auth検索
            log('NO_PROFILE');

            for (const domain of EMAIL_DOMAINS) {
                const testEmail = `${lineUserId}${domain}`;
                try {
                    const { data } = await withTimeout(
                        supabaseAdmin.auth.admin.generateLink({ type: 'magiclink', email: testEmail }),
                        2000,
                        `FIND_AUTH_${domain}`
                    );
                    if (data?.user) {
                        userId = data.user.id;
                        resolvedEmail = testEmail;
                        log(`FOUND_AUTH: ${domain}`);
                        break;
                    }
                } catch (e) {
                    log(`AUTH_CHECK_FAIL: ${domain}`);
                }
            }

            if (userId) {
                // Profile作成
                log('CREATE_PROFILE');
                try {
                    await withTimeout(
                        supabaseAdmin.from('profiles').upsert({
                            id: userId,
                            line_user_id: lineUserId,
                            display_name: displayName,
                            picture_url: pictureUrl,
                            avatar_url: pictureUrl,
                            is_pro: isProRegistration || false,
                        }, { onConflict: 'id' }),
                        3000,
                        'CREATE_PROFILE'
                    );
                    log('CREATE_PROFILE_DONE');
                } catch (e) {
                    log(`CREATE_PROFILE_FAIL: ${e.message}`);
                }
            } else {
                // 完全新規ユーザー
                log('CREATE_NEW_USER');
                const newEmail = `${lineUserId}@line.anshin-recipe.app`;

                try {
                    const { data, error } = await withTimeout(
                        supabaseAdmin.auth.admin.createUser({
                            email: newEmail,
                            password: generateSecurePassword(),
                            email_confirm: true,
                            user_metadata: { line_user_id: lineUserId, display_name: displayName },
                        }),
                        3000,
                        'CREATE_USER'
                    );

                    if (error) {
                        log(`CREATE_USER_ERROR: ${error.message}`);
                        return Response.json({ error: 'ユーザー作成に失敗しました' }, { status: 500 });
                    }

                    userId = data.user.id;
                    resolvedEmail = newEmail;
                    log('CREATE_USER_DONE');

                    // Profile作成
                    await withTimeout(
                        supabaseAdmin.from('profiles').upsert({
                            id: userId,
                            line_user_id: lineUserId,
                            display_name: displayName,
                            picture_url: pictureUrl,
                            avatar_url: pictureUrl,
                            is_pro: isProRegistration || false,
                        }, { onConflict: 'id' }),
                        2000,
                        'NEW_PROFILE'
                    );
                } catch (e) {
                    log(`CREATE_USER_TIMEOUT: ${e.message}`);
                    return Response.json({ error: 'ユーザー作成がタイムアウトしました' }, { status: 504 });
                }
            }
        }

        // 4. セッション生成
        if (!resolvedEmail) {
            log('NO_EMAIL_FATAL');
            return Response.json({ error: 'メールアドレスを特定できませんでした' }, { status: 500 });
        }

        log(`GENERATE_SESSION: ${resolvedEmail}`);
        try {
            const { data, error } = await withTimeout(
                supabaseAdmin.auth.admin.generateLink({ type: 'magiclink', email: resolvedEmail }),
                3000,
                'SESSION_LINK'
            );

            if (error || !data?.properties?.action_link) {
                log(`SESSION_ERROR: ${error?.message || 'no link'}`);
                return Response.json({ error: 'セッション作成に失敗しました' }, { status: 500 });
            }

            log('SUCCESS');
            return Response.json({
                success: true,
                userId,
                redirectUrl: data.properties.action_link,
            });

        } catch (e) {
            log(`SESSION_TIMEOUT: ${e.message}`);
            return Response.json({ error: 'セッション作成がタイムアウトしました' }, { status: 504 });
        }

    } catch (error) {
        console.error('[AUTH] FATAL:', error);
        return Response.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}

function generateSecurePassword() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}
