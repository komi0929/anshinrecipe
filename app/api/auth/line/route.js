import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'fallback_key_for_build';

// Vercel Hobbyプランのタイムアウトは10秒
const VERCEL_TIMEOUT = 9000; // 9秒で安全なレスポンスを返す

const supabaseAdmin = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

const LINE_CHANNEL_ID = process.env.NEXT_PUBLIC_LINE_CHANNEL_ID;
const LINE_CHANNEL_SECRET = process.env.LINE_CHANNEL_SECRET;

// Helper: Promise with timeout
const withTimeout = (promise, ms, stepName = 'unknown') => {
    const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`TIMEOUT_${stepName}_${ms}ms`)), ms)
    );
    return Promise.race([promise, timeout]);
};

// Fetch with timeout wrapper
const fetchWithTimeout = async (url, options, timeoutMs, stepName) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        return response;
    } catch (err) {
        clearTimeout(timeoutId);
        if (err.name === 'AbortError') {
            throw new Error(`FETCH_TIMEOUT_${stepName}_${timeoutMs}ms`);
        }
        throw err;
    }
};

export async function POST(request) {
    const startTime = Date.now();
    const log = (step) => console.log(`[AUTH] ${step}: ${Date.now() - startTime}ms`);
    const checkTimeout = () => {
        if (Date.now() - startTime > VERCEL_TIMEOUT) {
            throw new Error('APPROACHING_VERCEL_TIMEOUT');
        }
    };

    try {
        log('START');
        const { code, redirectUri, isProRegistration } = await request.json();
        log('BODY_PARSED');

        if (!code) {
            return Response.json({ error: 'Missing authorization code' }, { status: 400 });
        }

        if (!LINE_CHANNEL_ID || !LINE_CHANNEL_SECRET || !supabaseUrl || !supabaseServiceKey || supabaseServiceKey === 'fallback_key_for_build') {
            log('CONFIG_MISSING');
            return Response.json({ error: 'Server configuration missing' }, { status: 500 });
        }

        const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const validRedirectUri = redirectUri || `${origin}/auth/callback/line`;

        // 1. Exchange code for LINE access token (with 3s timeout)
        log('LINE_TOKEN_START');
        checkTimeout();
        const tokenResponse = await fetchWithTimeout(
            'https://api.line.me/oauth2/v2.1/token',
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    grant_type: 'authorization_code',
                    code,
                    redirect_uri: validRedirectUri,
                    client_id: LINE_CHANNEL_ID,
                    client_secret: LINE_CHANNEL_SECRET,
                }).toString(),
            },
            3000,
            'LINE_TOKEN'
        );
        log('LINE_TOKEN_RESPONSE');

        if (!tokenResponse.ok) {
            const errorText = await tokenResponse.text();
            log(`LINE_TOKEN_ERROR: ${errorText}`);
            return Response.json({ error: 'Failed to exchange code for token', details: errorText }, { status: 400 });
        }

        const { access_token } = await tokenResponse.json();
        log('LINE_TOKEN_DONE');

        // 2. Get LINE profile (with 2s timeout)
        checkTimeout();
        log('LINE_PROFILE_START');
        const profileResponse = await fetchWithTimeout(
            'https://api.line.me/v2/profile',
            { headers: { 'Authorization': `Bearer ${access_token}` } },
            2000,
            'LINE_PROFILE'
        );
        log('LINE_PROFILE_RESPONSE');

        if (!profileResponse.ok) {
            return Response.json({ error: 'Failed to get LINE profile' }, { status: 400 });
        }

        const { userId: lineUserId, displayName, pictureUrl } = await profileResponse.json();
        log('LINE_PROFILE_DONE');

        const primaryEmail = `${lineUserId}@line.anshin-recipe.app`;
        const legacyEmail = `${lineUserId}@line.user`;

        // 3. Resolve User ID - OPTIMIZED: Run DB query and email checks in parallel
        log('USER_RESOLUTION_START');
        checkTimeout();
        let userId = null;
        let resolvedEmail = primaryEmail;

        // Run all lookup methods in parallel with short timeouts
        const [dbResult, primaryEmailResult, legacyEmailResult] = await Promise.allSettled([
            // Method A: Check profiles table
            withTimeout(
                supabaseAdmin.from('profiles').select('id').eq('line_user_id', lineUserId).maybeSingle(),
                2000,
                'DB_PROFILE'
            ),
            // Method B: generateLink with primary email
            withTimeout(
                supabaseAdmin.auth.admin.generateLink({ type: 'magiclink', email: primaryEmail }),
                2000,
                'PRIMARY_EMAIL'
            ),
            // Method C: generateLink with legacy email (only if needed, but we run in parallel for speed)
            withTimeout(
                supabaseAdmin.auth.admin.generateLink({ type: 'magiclink', email: legacyEmail }),
                2000,
                'LEGACY_EMAIL'
            )
        ]);
        log('PARALLEL_LOOKUP_DONE');

        // Check results in priority order
        if (dbResult.status === 'fulfilled' && dbResult.value?.data?.id) {
            userId = dbResult.value.data.id;
            log('FOUND_VIA_DB');

            // Need to determine the correct email for this user
            // Check if primary email works, otherwise try legacy
            if (primaryEmailResult.status === 'fulfilled' && primaryEmailResult.value?.data?.user?.id === userId) {
                resolvedEmail = primaryEmail;
                log('RESOLVED_EMAIL_PRIMARY');
            } else if (legacyEmailResult.status === 'fulfilled' && legacyEmailResult.value?.data?.user?.id === userId) {
                resolvedEmail = legacyEmail;
                log('RESOLVED_EMAIL_LEGACY');
            } else {
                // If neither email lookup succeeded but we found the user via DB,
                // we need to look up the auth user directly
                try {
                    const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(userId);
                    if (authUser?.user?.email) {
                        resolvedEmail = authUser.user.email;
                        log(`RESOLVED_EMAIL_FROM_AUTH: ${resolvedEmail}`);
                    }
                } catch (e) {
                    // Fall back to primary email (will create new session)
                    log('RESOLVED_EMAIL_FALLBACK_PRIMARY');
                }
            }
        } else if (primaryEmailResult.status === 'fulfilled' && primaryEmailResult.value?.data?.user) {
            userId = primaryEmailResult.value.data.user.id;
            resolvedEmail = primaryEmail;
            log('FOUND_VIA_PRIMARY_EMAIL');
        } else if (legacyEmailResult.status === 'fulfilled' && legacyEmailResult.value?.data?.user) {
            userId = legacyEmailResult.value.data.user.id;
            resolvedEmail = legacyEmail;
            log('FOUND_VIA_LEGACY_EMAIL');
        }

        // Log any timeouts for debugging
        if (dbResult.status === 'rejected') log(`DB_LOOKUP_FAILED: ${dbResult.reason?.message}`);
        if (primaryEmailResult.status === 'rejected') log(`PRIMARY_EMAIL_FAILED: ${primaryEmailResult.reason?.message}`);
        if (legacyEmailResult.status === 'rejected') log(`LEGACY_EMAIL_FAILED: ${legacyEmailResult.reason?.message}`);

        // Method D: Create new user ONLY if we couldn't find existing
        if (!userId) {
            log('CREATING_NEW_USER');
            checkTimeout();
            const { data: authData, error: signUpError } = await withTimeout(
                supabaseAdmin.auth.admin.createUser({
                    email: primaryEmail,
                    password: generateSecurePassword(),
                    email_confirm: true,
                    user_metadata: { line_user_id: lineUserId, display_name: displayName },
                }),
                3000,
                'CREATE_USER'
            );

            if (signUpError) {
                console.error('User creation failed:', signUpError);
                return Response.json({ error: 'Failed to create user', details: signUpError.message }, { status: 500 });
            }
            userId = authData.user.id;
            resolvedEmail = primaryEmail;
            log('NEW_USER_CREATED');
        }

        log('USER_RESOLUTION_DONE');

        // 4. Update profile (run in parallel with session link generation for speed)
        log('FINAL_STEPS_START');
        checkTimeout();

        const profileData = {
            id: userId,
            line_user_id: lineUserId,
            display_name: displayName,
        };
        if (pictureUrl) {
            profileData.picture_url = pictureUrl;
            profileData.avatar_url = pictureUrl;
        }
        if (isProRegistration) {
            profileData.is_pro = true;
        }

        // Run profile update and session link generation in parallel
        // CRITICAL: Profile update MUST succeed - retry if needed
        log('PROFILE_UPSERT_START');
        let profileSuccess = false;
        let profileAttempts = 0;
        const maxAttempts = 2;

        while (!profileSuccess && profileAttempts < maxAttempts) {
            profileAttempts++;
            try {
                const { error: upsertError } = await withTimeout(
                    supabaseAdmin.from('profiles').upsert(profileData, { onConflict: 'id' }),
                    4000, // Increased timeout
                    'PROFILE_UPSERT'
                );

                if (upsertError) {
                    log(`PROFILE_UPSERT_ERROR_ATTEMPT_${profileAttempts}: ${upsertError.message}`);
                    if (profileAttempts >= maxAttempts) {
                        return Response.json({
                            error: 'プロファイル更新に失敗しました',
                            details: upsertError.message
                        }, { status: 500 });
                    }
                } else {
                    profileSuccess = true;
                    log(`PROFILE_UPSERT_SUCCESS_ATTEMPT_${profileAttempts}`);
                }
            } catch (e) {
                log(`PROFILE_UPSERT_TIMEOUT_ATTEMPT_${profileAttempts}: ${e.message}`);
                if (profileAttempts >= maxAttempts) {
                    return Response.json({
                        error: 'プロファイル更新がタイムアウトしました',
                        details: e.message
                    }, { status: 504 });
                }
            }
        }

        // Generate session link (only after profile is saved)
        log('SESSION_LINK_START');
        checkTimeout();

        let sessionData = null;
        try {
            const { data, error: sessionError } = await withTimeout(
                supabaseAdmin.auth.admin.generateLink({ type: 'magiclink', email: resolvedEmail }),
                4000,
                'SESSION_LINK'
            );

            if (sessionError) {
                log(`SESSION_LINK_ERROR: ${sessionError.message}`);
                return Response.json({ error: 'Failed to create session', details: sessionError.message }, { status: 500 });
            }
            sessionData = data;
        } catch (e) {
            log(`SESSION_LINK_TIMEOUT: ${e.message}`);
            return Response.json({ error: 'セッション作成がタイムアウトしました', details: e.message }, { status: 504 });
        }

        if (!sessionData?.properties?.action_link) {
            log('SESSION_LINK_NO_URL');
            return Response.json({ error: 'Failed to create session - no action link' }, { status: 500 });
        }
        log('SESSION_LINK_DONE');

        log('SUCCESS');
        return Response.json({
            success: true,
            userId,
            redirectUrl: sessionData.properties.action_link,
        });

    } catch (error) {
        const elapsed = Date.now() - startTime;
        console.error(`LINE auth error after ${elapsed}ms:`, error.message);

        // Return specific error message for timeout
        if (error.message?.includes('TIMEOUT') || error.message?.includes('APPROACHING_VERCEL')) {
            return Response.json({
                error: 'サーバー処理がタイムアウトしました。再度お試しください。',
                details: error.message,
                elapsed: `${elapsed}ms`
            }, { status: 504 });
        }

        return Response.json({ error: 'Internal server error', details: error.message }, { status: 500 });
    }
}

function generateSecurePassword() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}
