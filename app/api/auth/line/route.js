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
const withTimeout = (promise, ms) => {
    const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('TIMEOUT')), ms)
    );
    return Promise.race([promise, timeout]);
};

export async function POST(request) {
    const startTime = Date.now();
    const log = (step) => console.log(`[AUTH] ${step}: ${Date.now() - startTime}ms`);

    try {
        log('START');
        const { code, redirectUri, isProRegistration } = await request.json();

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
        const tokenResponse = await fetch('https://api.line.me/oauth2/v2.1/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                code,
                redirect_uri: validRedirectUri,
                client_id: LINE_CHANNEL_ID,
                client_secret: LINE_CHANNEL_SECRET,
            }).toString(),
        });
        log('LINE_TOKEN_DONE');

        if (!tokenResponse.ok) {
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
        const primaryEmail = `${lineUserId}@line.anshin-recipe.app`;
        const legacyEmail = `${lineUserId}@line.user`;

        // 3. Resolve User ID - MUST find existing user, NOT create new one blindly
        log('USER_RESOLUTION_START');
        let userId = null;
        let resolvedEmail = primaryEmail;

        // STRATEGY: Try multiple methods to find existing user
        // Method A: Check profiles table (with timeout)
        try {
            const profileQuery = supabaseAdmin
                .from('profiles')
                .select('id')
                .eq('line_user_id', lineUserId)
                .maybeSingle();

            const { data: existingProfile } = await withTimeout(profileQuery, 5000);
            if (existingProfile) {
                userId = existingProfile.id;
                log('FOUND_VIA_DB');
            }
        } catch (e) {
            log('DB_TIMEOUT');
        }

        // Method B: Try generateLink with primary email (finds existing Auth user)
        if (!userId) {
            try {
                const { data: linkData } = await supabaseAdmin.auth.admin.generateLink({
                    type: 'magiclink',
                    email: primaryEmail,
                });
                if (linkData?.user) {
                    userId = linkData.user.id;
                    resolvedEmail = primaryEmail;
                    log('FOUND_VIA_PRIMARY_EMAIL');
                }
            } catch (e) {
                // User might not exist with this email
            }
        }

        // Method C: Try generateLink with legacy email
        if (!userId) {
            try {
                const { data: linkData } = await supabaseAdmin.auth.admin.generateLink({
                    type: 'magiclink',
                    email: legacyEmail,
                });
                if (linkData?.user) {
                    userId = linkData.user.id;
                    resolvedEmail = legacyEmail;
                    log('FOUND_VIA_LEGACY_EMAIL');
                }
            } catch (e) {
                // User might not exist with this email either
            }
        }

        // Method D: Create new user ONLY if we couldn't find existing
        if (!userId) {
            log('CREATING_NEW_USER');
            const { data: authData, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
                email: primaryEmail,
                password: generateSecurePassword(),
                email_confirm: true,
                user_metadata: { line_user_id: lineUserId, display_name: displayName },
            });

            if (signUpError) {
                console.error('User creation failed:', signUpError);
                return Response.json({ error: 'Failed to create user' }, { status: 500 });
            }
            userId = authData.user.id;
            resolvedEmail = primaryEmail;
            log('NEW_USER_CREATED');
        }

        log('USER_RESOLUTION_DONE');

        // 4. Update profile (BLOCKING - must complete to ensure data consistency)
        log('PROFILE_UPDATE_START');
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

        // Use upsert with onConflict to handle both new and existing profiles
        await supabaseAdmin.from('profiles').upsert(profileData, { onConflict: 'id' });
        log('PROFILE_UPDATE_DONE');

        // 5. Generate session link
        log('SESSION_LINK_START');
        const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.admin.generateLink({
            type: 'magiclink',
            email: resolvedEmail,
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
