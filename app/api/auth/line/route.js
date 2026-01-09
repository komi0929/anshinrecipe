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
            return Response.json({ error: `LINE token exchange failed: ${error.error_description || error.error || 'unknown'}` }, { status: 400 });
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

        // ---------------------------------------------------------
        // ROBUST AUTH FLOW START
        // ---------------------------------------------------------

        // 1. Check profiles table first (single source of truth for LINE linkage)
        const { data: existingProfile } = await supabaseAdmin
            .from('profiles')
            .select('id, is_pro')
            .eq('line_user_id', lineUserId)
            .single();

        let userId = null;
        let finalEmail = null;

        if (existingProfile) {
            userId = existingProfile.id;
            console.log('Found profile for LINE ID:', lineUserId, 'UID:', userId);

            // Verify if Auth user still exists
            const { data: { user: authUser }, error: getAuthError } = await supabaseAdmin.auth.admin.getUserById(userId);

            if (getAuthError || !authUser) {
                console.warn('Auth user missing for existing profile. Re-creating auth user...');
                // Fallback: This is an inconsistent state, we need to handle it below in the "New/Broken User" path
                userId = null;
            } else {
                finalEmail = authUser.email;
            }
        }

        // 2. If no valid active userId, we need to find or create the auth user
        if (!userId) {
            const primaryEmail = `${lineUserId}@line.anshin-recipe.app`;
            const legacyEmail = `${lineUserId}@line.user`;

            // Search in ALL users (handling pagination)
            const allMatchUsers = await findAllUsersByEmails(supabaseAdmin, [primaryEmail, legacyEmail]);
            const existingAuthUser = allMatchUsers[0]; // Use the first match

            if (existingAuthUser) {
                userId = existingAuthUser.id;
                finalEmail = existingAuthUser.email;
                console.log('Found existing Auth user by email:', finalEmail);
            } else {
                // Truly a NEW user
                console.log('Creating new user for:', primaryEmail);
                const dummyPassword = generateSecurePassword();
                const { data: authData, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
                    email: primaryEmail,
                    password: dummyPassword,
                    email_confirm: true,
                    user_metadata: {
                        line_user_id: lineUserId,
                        display_name: displayName,
                    },
                });

                if (signUpError) {
                    console.error('Supabase user creation error:', signUpError);
                    return Response.json({ error: `Auth creation failed: ${signUpError.message}` }, { status: 500 });
                }

                userId = authData.user.id;
                finalEmail = primaryEmail;
            }
        }

        // 3. Sync/Create Profile
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

        if (isProRegistration) {
            updateData.is_pro = true;
        }

        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .upsert(updateData, { onConflict: 'id' });

        if (profileError) {
            console.error('Profile sync error:', profileError);
            // Non-critical, but should be logged
        }

        // 4. Generate Magic Link for Session
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || request.headers.get('origin') || 'http://localhost:3000';
        const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.admin.generateLink({
            type: 'magiclink',
            email: finalEmail,
            options: {
                redirectTo: appUrl,
            }
        });

        if (sessionError) {
            console.error('Session generation error:', sessionError);
            return Response.json({ error: `Session generation failed: ${sessionError.message}` }, { status: 500 });
        }

        return Response.json({
            success: true,
            userId: userId,
            redirectUrl: sessionData.properties.action_link,
        });

    } catch (error) {
        console.error('Critical LINE auth error:', error);
        return Response.json({ error: `Server error: ${error.message || 'Unknown error'}` }, { status: 500 });
    }
}

/**
 * Find users by multiple emails across all pages of Supabase Auth
 * Necessary because listUsers() only returns 50 users at a time.
 */
async function findAllUsersByEmails(supabase, emails) {
    console.log('Searching for users with emails:', emails);
    let allUsers = [];
    let page = 1;
    const perPage = 50;
    const MAX_PAGES = 20; // Safety break to prevent infinite loops (up to 1000 users)

    while (page <= MAX_PAGES) {
        console.log(`Fetching page ${page} of users...`);
        // Correct Supabase v2 pagination format
        const { data: { users }, error } = await supabase.auth.admin.listUsers({
            pagination: {
                page: page,
                perPage: perPage
            }
        });

        if (error) {
            console.error(`Error fetching users at page ${page}:`, error);
            break;
        }

        if (!users || users.length === 0) {
            console.log(`No more users found at page ${page}`);
            break;
        }

        const matches = users.filter(u => emails.includes(u.email));
        if (matches.length > 0) {
            console.log(`Found ${matches.length} matching users on page ${page}`);
            allUsers.push(...matches);
        }

        // If we found a match, we can stop early if we only need one, 
        // but here we keep going to be exhaustive if needed.
        if (allUsers.length > 0) break;

        if (users.length < perPage) {
            console.log('Reached last page of users');
            break;
        }

        page++;
    }

    if (page > MAX_PAGES) {
        console.warn('findAllUsersByEmails reached MAX_PAGES safety limit');
    }

    return allUsers;
}


function generateSecurePassword() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}
