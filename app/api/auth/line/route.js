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

export async function POST(request) {
    const startTime = Date.now();
    const timings = {};
    const logTime = (label) => {
        timings[label] = Date.now() - startTime;
        console.log(`[AUTH_PATH] ${label}: ${timings[label]}ms`);
    };

    try {
        const { code, redirectUri, isProRegistration } = await request.json();
        logTime('request_parsed');

        if (!code) {
            return Response.json({ error: 'Missing authorization code' }, { status: 400 });
        }

        // Environment Check
        if (!LINE_CHANNEL_ID || !LINE_CHANNEL_SECRET || !supabaseUrl || !supabaseServiceKey || supabaseServiceKey === 'fallback_key_for_build') {
            console.error('Critical: Environment variables missing');
            return Response.json({ error: 'Server environment configuration error' }, { status: 500 });
        }

        const validRedirectUri = redirectUri || `${request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/callback/line`;

        // Internal Fetch with Timeout
        const fetchWithTimeout = async (url, options, timeout = 5000) => {
            const controller = new AbortController();
            const id = setTimeout(() => controller.abort(), timeout);
            try {
                const response = await fetch(url, { ...options, signal: controller.signal });
                clearTimeout(id);
                return response;
            } catch (e) {
                clearTimeout(id);
                throw e;
            }
        };

        // 1. Exchange code for access token
        const tokenParams = new URLSearchParams({
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: validRedirectUri,
            client_id: LINE_CHANNEL_ID,
            client_secret: LINE_CHANNEL_SECRET,
        });

        const tokenResponse = await fetchWithTimeout('https://api.line.me/oauth2/v2.1/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: tokenParams.toString(),
        });
        logTime('line_token_exchanged');

        if (!tokenResponse.ok) {
            const error = await tokenResponse.json();
            return Response.json({ error: `LINE token exchange failed: ${error.error_description || error.error || 'unknown'}` }, { status: 400 });
        }

        const tokenData = await tokenResponse.json();
        const accessToken = tokenData.access_token;

        // 2. Get LINE user profile
        const profileResponse = await fetchWithTimeout('https://api.line.me/v2/profile', {
            headers: { 'Authorization': `Bearer ${accessToken}` },
        });
        logTime('line_profile_fetched');

        if (!profileResponse.ok) {
            return Response.json({ error: 'Failed to get LINE profile' }, { status: 400 });
        }

        const lineProfile = await profileResponse.json();
        const { userId: lineUserId, displayName, pictureUrl } = lineProfile;

        // 3. Search for User (Fast Path)
        logTime('starting_user_search');

        const { data: existingProfile, error: profileQueryError } = await supabaseAdmin
            .from('profiles')
            .select('id, is_pro')
            .eq('line_user_id', lineUserId)
            .maybeSingle();

        if (profileQueryError) {
            console.error('Profile query error:', profileQueryError);
        }
        logTime('db_profile_checked');

        let userId = null;
        let finalEmail = null;

        if (existingProfile) {
            userId = existingProfile.id;
            const { data: { user: authUser } } = await supabaseAdmin.auth.admin.getUserById(userId);
            if (authUser) {
                finalEmail = authUser.email;
            } else {
                userId = null;
            }
            logTime('auth_user_verified_by_id');
        }

        if (!userId) {
            const primaryEmail = `${lineUserId}@line.anshin-recipe.app`;
            const legacyEmail = `${lineUserId}@line.user`;

            const { data: primaryResult } = await supabaseAdmin.auth.admin.getUserByEmail(primaryEmail);
            let existingAuthUser = primaryResult?.user;
            logTime('auth_email_primary_checked');

            if (!existingAuthUser) {
                const { data: legacyResult } = await supabaseAdmin.auth.admin.getUserByEmail(legacyEmail);
                existingAuthUser = legacyResult?.user;
                logTime('auth_email_legacy_checked');
            }

            if (existingAuthUser) {
                userId = existingAuthUser.id;
                finalEmail = existingAuthUser.email;
            } else {
                const { data: authData, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
                    email: primaryEmail,
                    password: generateSecurePassword(),
                    email_confirm: true,
                    user_metadata: { line_user_id: lineUserId, display_name: displayName },
                });

                if (signUpError) {
                    return Response.json({ error: `Auth creation failed: ${signUpError.message}` }, { status: 500 });
                }

                userId = authData.user.id;
                finalEmail = primaryEmail;
                logTime('auth_user_created');
            }
        }

        // 4. Sync Profile
        const updateData = {
            id: userId,
            line_user_id: lineUserId,
            display_name: displayName,
            updated_at: new Date().toISOString()
        };
        if (pictureUrl) {
            updateData.picture_url = pictureUrl;
            updateData.avatar_url = pictureUrl;
        }
        if (isProRegistration) updateData.is_pro = true;

        await supabaseAdmin.from('profiles').upsert(updateData, { onConflict: 'id' });
        logTime('profile_synced');

        // 5. Generate Magic Link
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || request.headers.get('origin') || 'http://localhost:3000';
        const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.admin.generateLink({
            type: 'magiclink',
            email: finalEmail,
            options: { redirectTo: appUrl }
        });

        if (sessionError) {
            return Response.json({ error: `Session generation failed: ${sessionError.message}` }, { status: 500 });
        }
        logTime('session_link_generated');

        const totalDuration = Date.now() - startTime;
        console.log(`[AUTH_SUCCESS] Total duration: ${totalDuration}ms`);

        return Response.json({
            success: true,
            userId: userId,
            redirectUrl: sessionData.properties.action_link,
            debug: { timings, total: totalDuration }
        });

    } catch (error) {
        logTime('critical_error');
        console.error('Critical LINE auth error:', error);
        return Response.json({
            error: `Server error: ${error.message || 'Unknown error'}`,
            debug: { timings, total: Date.now() - startTime }
        }, { status: 500 });
    }
}

function generateSecurePassword() {
    try {
        if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
            const array = new Uint8Array(32);
            crypto.getRandomValues(array);
            return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
        }
    } catch (e) { }
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

