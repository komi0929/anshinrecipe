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
        console.log(`[AUTH_PROBE] ${label}: ${timings[label]}ms`);
    };

    /**
     * Extreme Resilience Wrapper:
     * Promise.race to ensure we ALWAYS respond before Vercel's 10s timeout kills us.
     */
    const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('API_GATEWAY_TIMEOUT_SIMULATED')), 8500);
    });

    try {
        const result = await Promise.race([
            handleAuth(request, logTime, timings),
            timeoutPromise
        ]);

        console.log(`[AUTH_DONE] Total: ${Date.now() - startTime}ms`);
        return Response.json(result);

    } catch (error) {
        const total = Date.now() - startTime;
        console.error(`[AUTH_CRITICAL] ${error.message} at ${total}ms`);

        let status = 500;
        let message = error.message;

        if (message === 'API_GATEWAY_TIMEOUT_SIMULATED') {
            status = 504;
            message = 'サーバーの内部処理が制限時間(8.5s)を超えました。外部API(LINE)の応答遅延の可能性があります。';
        }

        return Response.json({
            error: message,
            debug: { timings, total, hint: "Check probe logs to see where it got stuck" }
        }, { status });
    }
}

async function handleAuth(request, logTime, timings) {
    const { code, redirectUri, isProRegistration } = await request.json();
    logTime('request_parsed');

    if (!code) throw new Error('Missing authorization code');

    // Env check
    if (!LINE_CHANNEL_ID || !LINE_CHANNEL_SECRET || !supabaseUrl || !supabaseServiceKey || supabaseServiceKey === 'fallback_key_for_build') {
        throw new Error('Server environment configuration missing');
    }

    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const validRedirectUri = redirectUri || `${origin}/auth/callback/line`;

    // 1. Get LINE Token
    const tokenParams = new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: validRedirectUri,
        client_id: LINE_CHANNEL_ID,
        client_secret: LINE_CHANNEL_SECRET,
    });

    const tokenRes = await fetch('https://api.line.me/oauth2/v2.1/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: tokenParams.toString(),
    });
    logTime('line_token_received');

    if (!tokenRes.ok) {
        const err = await tokenRes.json();
        throw new Error(`LINE Token Error: ${err.error_description || err.error}`);
    }
    const { access_token } = await tokenRes.json();

    // 2. Get LINE Profile (Standard API Call)
    const profileRes = await fetch('https://api.line.me/v2/profile', {
        headers: { 'Authorization': `Bearer ${access_token}` },
    });
    logTime('line_profile_received');

    if (!profileRes.ok) throw new Error('Failed to fetch LINE profile');
    const { userId: lineUserId, displayName, pictureUrl } = await profileRes.json();

    // 3. Resolve User ID (Standard Flow: DB -> Auth)
    logTime('resolution_start');
    const primaryEmail = `${lineUserId}@line.anshin-recipe.app`;
    let userId = null;
    let finalEmail = primaryEmail;

    // A. Check Profiles Table (Fastest & Most Reliable for existing users)
    const { data: existingProfile } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('line_user_id', lineUserId)
        .maybeSingle();
    logTime('db_profile_checked');

    // Make an educated guess about the user ID
    if (existingProfile) {
        userId = existingProfile.id;
    }

    // B. Create User if not found (Only if DB check failed)
    if (!userId) {
        try {
            const { data: authData, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
                email: primaryEmail,
                password: generateSecurePassword(),
                email_confirm: true,
                user_metadata: { line_user_id: lineUserId, display_name: displayName },
            });

            if (!signUpError && authData.user) {
                userId = authData.user.id;
                logTime('user_created');
            } else if (signUpError?.message?.includes('already registered') || signUpError?.status === 422) {
                // Fallback: If create failed, try to recover ID via Link Generation (Safe fallback)
                // We skip complex checks to save time.
                logTime('user_exists_recovering_via_link');
            }
        } catch (e) {
            // Ignore errors here, we will rely on generateLink to resolve ID if possible
        }
    }

    // 4. Parallel Execution: Upsert Profile & Generate Link
    // We run these in parallel to save precious milliseconds.

    // a) Prepare Upsert Promise
    const updateData = {
        id: userId, // this might be null, but upsert needs ID usually. Wait, if null, we can't upsert yet.
        line_user_id: lineUserId,
        display_name: displayName,
        updated_at: new Date().toISOString()
    };
    if (pictureUrl) {
        updateData.picture_url = pictureUrl;
        updateData.avatar_url = pictureUrl;
    }
    if (isProRegistration) updateData.is_pro = true;

    // We can only upsert if we HAVE a userId. 
    // If we don't have it (skipped create), we need to get it from the link first.
    // So parallelization is possible only if we have userId.

    let sessionData = null;
    let finalLinkUserId = userId; // Local var to hold resolved ID

    if (userId) {
        // CASE 1: We know the ID. Run Upsert and GenLink in Parallel.
        logTime('parallel_exec_start');

        const upsertPromise = supabaseAdmin.from('profiles').upsert(updateData, { onConflict: 'id' });

        const linkPromise = supabaseAdmin.auth.admin.generateLink({
            type: 'magiclink',
            email: primaryEmail, // Use primaryEmail for link generation
            options: { redirectTo: process.env.NEXT_PUBLIC_APP_URL || origin }
        });

        const [upsertRes, linkRes] = await Promise.all([upsertPromise, linkPromise]);
        logTime('parallel_exec_done');

        if (linkRes.error) throw new Error(`Link Gen Failed: ${linkRes.error.message}`);
        sessionData = linkRes.data;

    } else {
        // CASE 2: We don't know ID yet (Zombie User). Must GenLink FIRST to get ID, then Upsert.
        // This is the slower path but handles the conflict case.
        logTime('recovery_exec_start');

        const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
            type: 'magiclink',
            email: primaryEmail,
            options: { redirectTo: origin }
        });

        // Try Legacy if primary failed
        if (linkError) {
            const legacyEmail = `${lineUserId}@line.user`;
            const { data: legacyLink, error: legacyError } = await supabaseAdmin.auth.admin.generateLink({
                type: 'magiclink',
                email: legacyEmail,
                options: { redirectTo: origin }
            });

            if (legacyError) throw new Error(`Recovery Failed: ${linkError.message}`);
            sessionData = legacyLink;
            finalLinkUserId = legacyLink.user.id;
        } else {
            sessionData = linkData;
            finalLinkUserId = linkData.user.id;
        }

        // Now we can upsert
        updateData.id = finalLinkUserId;
        await supabaseAdmin.from('profiles').upsert(updateData, { onConflict: 'id' });
        logTime('recovery_exec_done');
    }

    if (!sessionData?.properties?.action_link) {
        throw new Error('Failed to generate redirect link');
    }

    return {
        success: true,
        userId: finalLinkUserId,
        redirectUrl: sessionData.properties.action_link,
        debug: { timings, total: Date.now() - startTime }
    };
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
