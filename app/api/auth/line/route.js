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

// Helper: Promise with timeout
const withTimeout = (promise, ms, fallbackValue = null) => {
    const timeout = new Promise((resolve) =>
        setTimeout(() => resolve({ data: fallbackValue, timedOut: true }), ms)
    );
    return Promise.race([
        promise.then(result => ({ ...result, timedOut: false })),
        timeout
    ]);
};

export async function POST(request) {
    const startTime = Date.now();
    const log = (step) => console.log(`[AUTH] ${step}: ${Date.now() - startTime}ms`);

    try {
        log('START');
        const { code, redirectUri, isProRegistration } = await request.json();
        log('PARSED_REQUEST');

        if (!code) {
            return Response.json({ error: 'Missing authorization code' }, { status: 400 });
        }

        if (!LINE_CHANNEL_ID || !LINE_CHANNEL_SECRET || !supabaseUrl || !supabaseServiceKey || supabaseServiceKey === 'fallback_key_for_build') {
            return Response.json({ error: 'Server configuration missing' }, { status: 500 });
        }

        const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const validRedirectUri = redirectUri || `${origin}/auth/callback/line`;

        // 1. Exchange code for LINE access token
        log('LINE_TOKEN_START');
        const tokenParams = new URLSearchParams({
            grant_type: 'authorization_code',
            code,
            redirect_uri: validRedirectUri,
            client_id: LINE_CHANNEL_ID,
            client_secret: LINE_CHANNEL_SECRET,
        });

        const tokenResponse = await fetch('https://api.line.me/oauth2/v2.1/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: tokenParams.toString(),
        });
        log('LINE_TOKEN_DONE');

        if (!tokenResponse.ok) {
            const error = await tokenResponse.json();
            return Response.json({ error: 'Failed to exchange code for token' }, { status: 400 });
        }

        const { access_token } = await tokenResponse.json();

        // 2. Get LINE profile
        log('LINE_PROFILE_START');
        const profileResponse = await fetch('https://api.line.me/v2/profile', {
            headers: { 'Authorization': `Bearer ${access_token}` },
        });
        log('LINE_PROFILE_DONE');

        if (!profileResponse.ok) {
            return Response.json({ error: 'Failed to get LINE profile' }, { status: 400 });
        }

        const { userId: lineUserId, displayName, pictureUrl } = await profileResponse.json();
        const dummyEmail = `${lineUserId}@line.anshin-recipe.app`;

        // 3. Check if user exists in profiles (WITH 5 SECOND TIMEOUT)
        log('DB_PROFILE_CHECK_START');
        const profileQuery = supabaseAdmin
            .from('profiles')
            .select('id')
            .eq('line_user_id', lineUserId)
            .maybeSingle();

        const { data: existingProfile, timedOut: dbTimedOut } = await withTimeout(profileQuery, 5000, null);
        log(dbTimedOut ? 'DB_PROFILE_CHECK_TIMEOUT' : 'DB_PROFILE_CHECK_DONE');

        let userId = existingProfile?.id || null;

        // 4. If DB timed out or user not found, try Auth-based resolution
        if (!userId) {
            log('AUTH_RESOLUTION_START');

            // Try to create user first (fast path for new users)
            const { data: authData, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
                email: dummyEmail,
                password: generateSecurePassword(),
                email_confirm: true,
                user_metadata: { line_user_id: lineUserId, display_name: displayName },
            });
            log('AUTH_CREATE_DONE');

            if (!signUpError && authData?.user) {
                userId = authData.user.id;
                log('NEW_USER_CREATED');
            } else if (signUpError?.message?.includes('already registered') || signUpError?.code === 'email_exists') {
                // User exists in Auth - get their ID via generateLink
                log('USER_EXISTS_RECOVERY_START');
                const { data: linkData } = await supabaseAdmin.auth.admin.generateLink({
                    type: 'magiclink',
                    email: dummyEmail,
                });
                log('USER_EXISTS_RECOVERY_DONE');

                if (linkData?.user) {
                    userId = linkData.user.id;
                } else {
                    return Response.json({ error: 'Failed to recover user' }, { status: 500 });
                }
            } else {
                console.error('User creation error:', signUpError);
                return Response.json({ error: 'Failed to create user' }, { status: 500 });
            }
        }

        // 5. Update/Create profile (non-blocking if DB is slow)
        if (userId) {
            log('PROFILE_SYNC_START');
            const profileData = {
                id: userId,
                line_user_id: lineUserId,
                display_name: displayName,
                picture_url: pictureUrl,
                avatar_url: pictureUrl,
            };
            if (isProRegistration) profileData.is_pro = true;

            // Fire and forget - don't wait for this to complete
            supabaseAdmin.from('profiles').upsert(profileData, { onConflict: 'id' })
                .then(() => console.log('[AUTH] PROFILE_SYNC_DONE'))
                .catch(e => console.error('[AUTH] PROFILE_SYNC_ERROR:', e));

            log('PROFILE_SYNC_INITIATED');
        }

        // 6. Generate session link
        log('SESSION_LINK_START');
        const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.admin.generateLink({
            type: 'magiclink',
            email: dummyEmail,
        });
        log('SESSION_LINK_DONE');

        if (sessionError || !sessionData?.properties?.action_link) {
            console.error('Session error:', sessionError);
            return Response.json({ error: 'Failed to create session' }, { status: 500 });
        }

        log('SUCCESS');
        return Response.json({
            success: true,
            userId,
            redirectUrl: sessionData.properties.action_link,
        });

    } catch (error) {
        console.error('LINE auth error:', error);
        return Response.json({ error: 'Internal server error' }, { status: 500 });
    }
}

function generateSecurePassword() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}
