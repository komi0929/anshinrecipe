import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'fallback_key_for_build';

// Create Supabase admin client for server-side operations
const supabaseAdmin = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

const LINE_CHANNEL_ID = process.env.NEXT_PUBLIC_LINE_CHANNEL_ID;
const LINE_CHANNEL_SECRET = process.env.LINE_CHANNEL_SECRET;

// 両方のメールドメインをサポート（新旧互換性）
const EMAIL_DOMAINS = ['@line.anshin-recipe.app', '@line.user'];

export async function POST(request) {
    const startTime = Date.now();
    const log = (msg) => console.log(`[AUTH ${Date.now() - startTime}ms] ${msg}`);

    try {
        log('START');
        const { code, redirectUri, isProRegistration } = await request.json();

        if (!code) {
            return Response.json({ error: 'Missing authorization code' }, { status: 400 });
        }

        const validRedirectUri = redirectUri || `${request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/callback/line`;

        // 1. Exchange code for access token
        log('LINE_TOKEN_START');
        const tokenParams = new URLSearchParams({
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: validRedirectUri,
            client_id: LINE_CHANNEL_ID,
            client_secret: LINE_CHANNEL_SECRET,
        });

        const tokenResponse = await fetch('https://api.line.me/oauth2/v2.1/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: tokenParams.toString(),
        });

        if (!tokenResponse.ok) {
            const error = await tokenResponse.json();
            log(`LINE_TOKEN_ERROR: ${JSON.stringify(error)}`);
            return Response.json({ error: 'Failed to exchange code for token' }, { status: 400 });
        }

        const tokenData = await tokenResponse.json();
        const accessToken = tokenData.access_token;
        log('LINE_TOKEN_DONE');

        // 2. Get LINE user profile
        log('LINE_PROFILE_START');
        const profileResponse = await fetch('https://api.line.me/v2/profile', {
            headers: { 'Authorization': `Bearer ${accessToken}` },
        });

        if (!profileResponse.ok) {
            log('LINE_PROFILE_ERROR');
            return Response.json({ error: 'Failed to get LINE profile' }, { status: 400 });
        }

        const lineProfile = await profileResponse.json();
        const { userId: lineUserId, displayName, pictureUrl } = lineProfile;
        log(`LINE_PROFILE_DONE: ${lineUserId}, ${displayName}`);

        // 3. Check if user already exists in profiles table
        log('PROFILE_LOOKUP_START');
        const { data: existingProfile, error: profileLookupError } = await supabaseAdmin
            .from('profiles')
            .select('id, picture_url, avatar_url')
            .eq('line_user_id', lineUserId)
            .maybeSingle();  // maybeSingleはnullを返し、エラーにならない

        if (profileLookupError) {
            log(`PROFILE_LOOKUP_ERROR: ${profileLookupError.message}`);
        }
        log(`PROFILE_LOOKUP_DONE: ${existingProfile ? 'FOUND' : 'NOT_FOUND'}`);

        let userId;
        let resolvedEmail = null;

        if (existingProfile) {
            // 既存ユーザー - プロファイル更新
            log('EXISTING_USER_UPDATE');
            userId = existingProfile.id;

            const updateData = { display_name: displayName };
            if (pictureUrl) {
                updateData.picture_url = pictureUrl;
                updateData.avatar_url = pictureUrl;
            }
            if (isProRegistration) {
                updateData.is_pro = true;
            }

            const { error: updateError } = await supabaseAdmin
                .from('profiles')
                .update(updateData)
                .eq('id', userId);

            if (updateError) {
                log(`PROFILE_UPDATE_ERROR: ${updateError.message}`);
            } else {
                log('PROFILE_UPDATE_DONE');
            }

            // 既存ユーザーのメールアドレスを特定（セッション生成用）
            log('FIND_USER_EMAIL');
            for (const domain of EMAIL_DOMAINS) {
                const testEmail = `${lineUserId}${domain}`;
                try {
                    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
                        type: 'magiclink',
                        email: testEmail,
                    });
                    if (!linkError && linkData?.user) {
                        resolvedEmail = testEmail;
                        log(`FOUND_EMAIL: ${testEmail}`);
                        break;
                    }
                } catch (e) {
                    // このメールでは見つからない、次を試す
                }
            }

            if (!resolvedEmail) {
                // メールが見つからない場合、Auth APIから直接取得
                log('FALLBACK_GET_USER_BY_ID');
                try {
                    const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(userId);
                    if (authUser?.user?.email) {
                        resolvedEmail = authUser.user.email;
                        log(`FOUND_EMAIL_BY_ID: ${resolvedEmail}`);
                    }
                } catch (e) {
                    log(`GET_USER_BY_ID_ERROR: ${e.message}`);
                }
            }

        } else {
            // プロファイルが見つからない - Auth userを探すか新規作成
            log('NO_PROFILE_FOUND');

            // 両方のメールドメインでAuth userを探す（generateLinkで高速検索）
            for (const domain of EMAIL_DOMAINS) {
                const testEmail = `${lineUserId}${domain}`;
                log(`TRYING_EMAIL: ${testEmail}`);
                try {
                    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
                        type: 'magiclink',
                        email: testEmail,
                    });
                    if (!linkError && linkData?.user) {
                        userId = linkData.user.id;
                        resolvedEmail = testEmail;
                        log(`FOUND_AUTH_USER: ${testEmail}`);
                        break;
                    }
                } catch (e) {
                    // このメールでは見つからない
                }
            }

            if (userId) {
                // Auth userは存在するがprofileがない - profileを作成
                log('CREATE_MISSING_PROFILE');
                const { error: profileError } = await supabaseAdmin
                    .from('profiles')
                    .upsert({
                        id: userId,
                        line_user_id: lineUserId,
                        display_name: displayName,
                        picture_url: pictureUrl,
                        avatar_url: pictureUrl,
                        is_pro: isProRegistration || false,
                    }, { onConflict: 'id' });

                if (profileError) {
                    log(`CREATE_PROFILE_ERROR: ${profileError.message}`);
                    return Response.json({ error: 'Failed to create profile' }, { status: 500 });
                }
                log('CREATE_PROFILE_DONE');

            } else {
                // 完全新規ユーザー
                log('CREATE_NEW_USER');
                const newEmail = `${lineUserId}@line.anshin-recipe.app`;  // 新規は新ドメインを使用
                const dummyPassword = generateSecurePassword();

                const { data: authData, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
                    email: newEmail,
                    password: dummyPassword,
                    email_confirm: true,
                    user_metadata: {
                        line_user_id: lineUserId,
                        display_name: displayName,
                    },
                });

                if (signUpError) {
                    log(`CREATE_USER_ERROR: ${signUpError.message}`);
                    return Response.json({ error: 'Failed to create user' }, { status: 500 });
                }

                userId = authData.user.id;
                resolvedEmail = newEmail;
                log(`NEW_USER_CREATED: ${userId}`);

                // プロファイル作成
                const { error: profileError } = await supabaseAdmin
                    .from('profiles')
                    .upsert({
                        id: userId,
                        line_user_id: lineUserId,
                        display_name: displayName,
                        picture_url: pictureUrl,
                        avatar_url: pictureUrl,
                        is_pro: isProRegistration || false,
                    }, { onConflict: 'id' });

                if (profileError) {
                    log(`CREATE_PROFILE_ERROR: ${profileError.message}`);
                }
                log('NEW_PROFILE_CREATED');
            }
        }

        // 4. Generate session link
        if (!resolvedEmail) {
            log('NO_RESOLVED_EMAIL - FATAL');
            return Response.json({ error: 'Could not resolve user email' }, { status: 500 });
        }

        log(`GENERATE_SESSION: ${resolvedEmail}`);
        const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.admin.generateLink({
            type: 'magiclink',
            email: resolvedEmail,
        });

        if (sessionError) {
            log(`SESSION_ERROR: ${sessionError.message}`);
            return Response.json({ error: 'Failed to create session' }, { status: 500 });
        }

        if (!sessionData?.properties?.action_link) {
            log('NO_ACTION_LINK');
            return Response.json({ error: 'Failed to create session link' }, { status: 500 });
        }

        log('SUCCESS');
        return Response.json({
            success: true,
            userId: userId,
            redirectUrl: sessionData.properties.action_link,
        });

    } catch (error) {
        console.error('[AUTH] Unhandled error:', error);
        return Response.json({ error: 'Internal server error' }, { status: 500 });
    }
}

function generateSecurePassword() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}
