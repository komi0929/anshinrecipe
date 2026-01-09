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
    const log = (step) => console.log(`[AUTH] ${step}: ${Date.now() - startTime}ms`);

    try {
        log('START');
        const { code, redirectUri, isProRegistration } = await request.json();
        log('PARSED_REQUEST');

        if (!code) {
            return Response.json({ error: 'Missing authorization code' }, { status: 400 });
        }

        // Environment check
        if (!LINE_CHANNEL_ID || !LINE_CHANNEL_SECRET || !supabaseUrl || !supabaseServiceKey || supabaseServiceKey === 'fallback_key_for_build') {
            return Response.json({ error: 'Server configuration missing' }, { status: 500 });
        }

        const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const validRedirectUri = redirectUri || `${origin}/auth/callback/line`;

        // Exchange code for access token
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
        log('LINE_TOKEN_DONE');

        if (!tokenResponse.ok) {
            const error = await tokenResponse.json();
            console.error('LINE token exchange error:', error);
            return Response.json({ error: 'Failed to exchange code for token' }, { status: 400 });
        }

        const tokenData = await tokenResponse.json();
        const accessToken = tokenData.access_token;

        // Get LINE user profile
        log('LINE_PROFILE_START');
        const profileResponse = await fetch('https://api.line.me/v2/profile', {
            headers: { 'Authorization': `Bearer ${accessToken}` },
        });
        log('LINE_PROFILE_DONE');

        if (!profileResponse.ok) {
            console.error('LINE profile fetch error');
            return Response.json({ error: 'Failed to get LINE profile' }, { status: 400 });
        }

        const lineProfile = await profileResponse.json();
        const { userId: lineUserId, displayName, pictureUrl } = lineProfile;
        console.log('LINE Profile:', { lineUserId, displayName, pictureUrl: pictureUrl || 'NOT PROVIDED' });

        // Check if user already exists
        log('DB_PROFILE_CHECK_START');
        const { data: existingProfile } = await supabaseAdmin
            .from('profiles')
            .select('id, picture_url, avatar_url')
            .eq('line_user_id', lineUserId)
            .single();
        log('DB_PROFILE_CHECK_DONE');

        let userId;
        const dummyEmail = `${lineUserId}@line.anshin-recipe.app`;

        if (existingProfile) {
            // ============================================
            // EXISTING USER - UPDATE (not upsert)
            // ============================================
            log('EXISTING_USER_UPDATE_START');
            userId = existingProfile.id;

            const updateData = { display_name: displayName };
            if (pictureUrl) {
                updateData.picture_url = pictureUrl;
                updateData.avatar_url = pictureUrl;
            }
            if (isProRegistration) {
                updateData.is_pro = true;
            }

            await supabaseAdmin.from('profiles').update(updateData).eq('id', userId);
            log('EXISTING_USER_UPDATE_DONE');

        } else {
            // ============================================
            // NEW USER - CREATE AUTH + UPSERT PROFILE
            // ============================================
            log('NEW_USER_CREATE_START');
            const dummyPassword = generateSecurePassword();
            const { data: authData, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
                email: dummyEmail,
                password: dummyPassword,
                email_confirm: true,
                user_metadata: { line_user_id: lineUserId, display_name: displayName },
            });
            log('NEW_USER_CREATE_DONE');

            if (signUpError) {
                if (signUpError.code === 'email_exists' || signUpError.message?.includes('User already registered')) {
                    log('USER_EXISTS_RECOVERY_START');
                    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
                        type: 'magiclink',
                        email: dummyEmail,
                    });
                    log('USER_EXISTS_RECOVERY_DONE');

                    if (linkError || !linkData?.user) {
                        console.error('Could not recover existing user:', linkError);
                        return Response.json({ error: 'Failed to find user' }, { status: 500 });
                    }
                    userId = linkData.user.id;
                } else {
                    console.error('Supabase user creation error:', signUpError);
                    return Response.json({ error: 'Failed to create user' }, { status: 500 });
                }
            } else {
                userId = authData.user.id;
            }

            // Create profile
            log('PROFILE_UPSERT_START');
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
            log('PROFILE_UPSERT_DONE');

            if (profileError) {
                console.error('Profile creation error:', profileError);
                return Response.json({ error: 'Failed to create profile' }, { status: 500 });
            }
        }

        // Generate session token for the user
        log('SESSION_LINK_START');
        const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.admin.generateLink({
            type: 'magiclink',
            email: dummyEmail,
        });
        log('SESSION_LINK_DONE');

        if (sessionError) {
            console.error('Session generation error:', sessionError);
            return Response.json({ error: 'Failed to create session' }, { status: 500 });
        }

        log('SUCCESS');
        return Response.json({
            success: true,
            userId: userId,
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
