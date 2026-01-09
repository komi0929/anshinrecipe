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

    // 1. Get LINE Token & Profile (Sequential)
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

    const profileRes = await fetch('https://api.line.me/v2/profile', {
        headers: { 'Authorization': `Bearer ${access_token}` },
    });
    logTime('line_profile_received');

    if (!profileRes.ok) throw new Error('Failed to fetch LINE profile');
    const { userId: lineUserId, displayName, pictureUrl } = await profileRes.json();

    // 2. Identity Search (Parallel Optimization)
    logTime('search_start');

    const primaryEmail = `${lineUserId}@line.anshin-recipe.app`;
    const legacyEmail = `${lineUserId}@line.user`;

    const [profileMatch, primaryAuthMatch, legacyAuthMatch] = await Promise.all([
        supabaseAdmin.from('profiles').select('id, is_pro').eq('line_user_id', lineUserId).maybeSingle(),
        supabaseAdmin.auth.admin.getUserByEmail(primaryEmail),
        supabaseAdmin.auth.admin.getUserByEmail(legacyEmail)
    ]);
    logTime('identity_searched_parallel');

    let userId = profileMatch.data?.id;
    let finalEmail = primaryEmail;

    if (userId) {
        const { data: { user } } = await supabaseAdmin.auth.admin.getUserById(userId);
        if (user) {
            finalEmail = user.email;
        } else {
            userId = primaryAuthMatch.data?.user?.id || legacyAuthMatch.data?.user?.id || null;
            if (userId) finalEmail = primaryAuthMatch.data?.user?.email || legacyAuthMatch.data?.user?.email;
        }
    } else {
        const existingAuth = primaryAuthMatch.data?.user || legacyAuthMatch.data?.user;
        if (existingAuth) {
            userId = existingAuth.id;
            finalEmail = existingAuth.email;
        }
    }

    if (!userId) {
        const { data: authData, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
            email: primaryEmail,
            password: generateSecurePassword(),
            email_confirm: true,
            user_metadata: { line_user_id: lineUserId, display_name: displayName },
        });
        if (signUpError) throw new Error(`Auth creation failed: ${signUpError.message}`);
        userId = authData.user.id;
        finalEmail = primaryEmail;
        logTime('user_created');
    }

    // 3. Sync & Generate Link
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

    const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'magiclink',
        email: finalEmail,
        options: { redirectTo: process.env.NEXT_PUBLIC_APP_URL || origin }
    });

    if (sessionError) throw new Error(`Session error: ${sessionError.message}`);
    logTime('link_generated');

    return {
        success: true,
        userId,
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
