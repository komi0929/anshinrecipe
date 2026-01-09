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
    try {
        const { code, redirectUri, isProRegistration } = await request.json();

        if (!code) {
            return Response.json({ error: 'Missing authorization code' }, { status: 400 });
        }

        const validRedirectUri = redirectUri || `${request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/callback/line`;

        // Exchange code for access token
        const tokenParams = new URLSearchParams({
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: validRedirectUri,
            client_id: LINE_CHANNEL_ID,
            client_secret: LINE_CHANNEL_SECRET,
        });

        const tokenResponse = await fetch('https://api.line.me/oauth2/v2.1/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: tokenParams.toString(),
        });

        if (!tokenResponse.ok) {
            const error = await tokenResponse.json();
            console.error('LINE token exchange error:', error);
            return Response.json({ error: 'Failed to exchange code for token' }, { status: 400 });
        }

        const tokenData = await tokenResponse.json();
        const accessToken = tokenData.access_token;

        // Get LINE user profile
        const profileResponse = await fetch('https://api.line.me/v2/profile', {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
            },
        });

        if (!profileResponse.ok) {
            console.error('LINE profile fetch error');
            return Response.json({ error: 'Failed to get LINE profile' }, { status: 400 });
        }

        const lineProfile = await profileResponse.json();
        const { userId: lineUserId, displayName, pictureUrl } = lineProfile;

        // Debug log for pictureUrl
        console.log('LINE Profile:', { lineUserId, displayName, pictureUrl: pictureUrl || 'NOT PROVIDED' });

        // Check if user already exists - fetch both picture_url and avatar_url
        const { data: existingProfile } = await supabaseAdmin
            .from('profiles')
            .select('id, picture_url, avatar_url')
            .eq('line_user_id', lineUserId)
            .single();

        let userId;

        if (existingProfile) {
            // Existing user - update profile
            userId = existingProfile.id;

            // Determine the best avatar: LINE's pictureUrl > existing avatar_url > existing picture_url
            // const bestAvatar = pictureUrl || existingProfile.avatar_url || existingProfile.picture_url;

            // Always update avatar from LINE if provided, otherwise keep existing
            const updateData = {
                display_name: displayName,
            };

            // Only update avatar fields if LINE provides a new one
            if (pictureUrl) {
                updateData.picture_url = pictureUrl;
                updateData.avatar_url = pictureUrl;
                console.log('Updating avatar with LINE pictureUrl:', pictureUrl);
            } else {
                console.log('LINE pictureUrl not provided, keeping existing avatar:', existingProfile.avatar_url);
            }

            // プロユーザー登録フローからのログインの場合、is_proをtrueに設定
            if (isProRegistration) {
                updateData.is_pro = true;
                console.log('Pro registration detected, setting is_pro to true');
            }

            await supabaseAdmin
                .from('profiles')
                .update(updateData)
                .eq('id', userId);
        } else {
            // Check if auth user exists but profile doesn't
            const dummyEmail = `${lineUserId}@line.anshin-recipe.app`;

            // Try to get existing auth user
            const { data: existingAuthUser } = await supabaseAdmin.auth.admin.listUsers();
            const authUser = existingAuthUser.users.find(u => u.email === dummyEmail);

            if (authUser) {
                // Auth user exists but profile doesn't - create profile only
                userId = authUser.id;

                const { error: profileError } = await supabaseAdmin
                    .from('profiles')
                    .upsert({
                        id: userId,
                        line_user_id: lineUserId,
                        display_name: displayName,
                        picture_url: pictureUrl,
                        avatar_url: pictureUrl,
                        is_pro: isProRegistration || false,
                    }, {
                        onConflict: 'id'
                    });

                if (profileError) {
                    console.error('Profile upsert error:', profileError);
                    return Response.json({ error: 'Failed to create profile' }, { status: 500 });
                }
            } else {
                // New user - create auth user and profile
                const dummyPassword = generateSecurePassword();

                const { data: authData, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
                    email: dummyEmail,
                    password: dummyPassword,
                    email_confirm: true,
                    user_metadata: {
                        line_user_id: lineUserId,
                        display_name: displayName,
                    },
                });

                if (signUpError) {
                    // If email already exists, try to find the user
                    if (signUpError.code === 'email_exists' || signUpError.message?.includes('User already registered')) {
                        console.log('Email exists, finding existing user...');
                        const { data: allUsers } = await supabaseAdmin.auth.admin.listUsers();
                        const existingUser = allUsers.users.find(u => u.email === dummyEmail);

                        if (existingUser) {
                            userId = existingUser.id;
                        } else {
                            console.error('Could not find existing user');
                            return Response.json({ error: 'Failed to find user' }, { status: 500 });
                        }
                    } else {
                        console.error('Supabase user creation error:', signUpError);
                        return Response.json({ error: 'Failed to create user' }, { status: 500 });
                    }
                } else {
                    userId = authData.user.id;
                }

                // Create profile using upsert to avoid conflicts
                const { error: profileError } = await supabaseAdmin
                    .from('profiles')
                    .upsert({
                        id: userId,
                        line_user_id: lineUserId,
                        display_name: displayName,
                        picture_url: pictureUrl,
                        avatar_url: pictureUrl,
                        is_pro: isProRegistration || false,
                    }, {
                        onConflict: 'id'
                    });

                if (profileError) {
                    console.error('Profile creation error:', profileError);
                    return Response.json({ error: 'Failed to create profile' }, { status: 500 });
                }
            }
        }

        // Fetch the actual user's email to ensure magic link works even if email domain changed
        const { data: { user: authUser }, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);

        if (userError || !authUser) {
            console.error('Failed to fetch auth user:', userError);
            return Response.json({ error: 'Failed to fetch user data/failed' }, { status: 500 });
        }

        // Get the app URL for redirect
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || request.headers.get('origin') || 'http://localhost:3000';

        // Generate session token for the user using their ACTUAL email
        const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.admin.generateLink({
            type: 'magiclink',
            email: authUser.email,
            options: {
                redirectTo: appUrl,
            }
        });

        if (sessionError) {
            console.error('Session generation error:', sessionError);
            return Response.json({ error: 'Failed to create session' }, { status: 500 });
        }

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
