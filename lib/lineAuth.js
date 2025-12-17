/**
 * LINE Login Authentication Utilities
 * Handles LINE OAuth 2.0 flow and Supabase integration
 */

import { supabase } from './supabaseClient';

const LINE_CHANNEL_ID = process.env.NEXT_PUBLIC_LINE_CHANNEL_ID;
const LINE_CHANNEL_SECRET = process.env.LINE_CHANNEL_SECRET;
const REDIRECT_URI = typeof window !== 'undefined'
    ? `${window.location.origin}/auth/callback/line`
    : process.env.NEXT_PUBLIC_APP_URL
        ? `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback/line`
        : 'http://localhost:3000/auth/callback/line';

/**
 * Generate LINE OAuth authorization URL
 * @returns {string} LINE authorization URL
 */
export function getLineAuthUrl() {
    const state = generateRandomState();
    const nonce = generateRandomNonce();

    // Store state and nonce in localStorage for verification (sessionStorage doesn't persist across redirects)
    if (typeof window !== 'undefined') {
        localStorage.setItem('line_oauth_state', state);
        localStorage.setItem('line_oauth_nonce', nonce);
    }

    const params = new URLSearchParams({
        response_type: 'code',
        client_id: LINE_CHANNEL_ID,
        redirect_uri: REDIRECT_URI,
        state: state,
        scope: 'profile openid',
        nonce: nonce,
    });

    return `https://access.line.me/oauth2/v2.1/authorize?${params.toString()}`;
}

/**
 * Exchange authorization code for access token
 * @param {string} code - Authorization code from LINE
 * @returns {Promise<string>} Access token
 */
export async function exchangeCodeForToken(code) {
    const params = new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: REDIRECT_URI,
        client_id: LINE_CHANNEL_ID,
        client_secret: LINE_CHANNEL_SECRET,
    });

    const response = await fetch('https://api.line.me/oauth2/v2.1/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(`Failed to exchange code for token: ${error.error_description || error.error}`);
    }

    const data = await response.json();
    return data.access_token;
}

/**
 * Get LINE user profile using access token
 * @param {string} accessToken - LINE access token
 * @returns {Promise<Object>} User profile data
 */
export async function getLineProfile(accessToken) {
    const response = await fetch('https://api.line.me/v2/profile', {
        headers: {
            'Authorization': `Bearer ${accessToken}`,
        },
    });

    if (!response.ok) {
        throw new Error('Failed to get LINE profile');
    }

    const profile = await response.json();
    return {
        lineUserId: profile.userId,
        displayName: profile.displayName,
        pictureUrl: profile.pictureUrl,
    };
}

/**
 * Sign in with LINE profile and create/update Supabase session
 * @param {Object} lineProfile - LINE user profile
 * @returns {Promise<Object>} Supabase user and session
 */
export async function signInWithLine(lineProfile) {
    const { lineUserId, displayName, pictureUrl } = lineProfile;

    // Check if user already exists in profiles table
    const { data: existingProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('id')
        .eq('line_user_id', lineUserId)
        .single();

    let userId;

    if (existingProfile) {
        // User exists, use their ID
        userId = existingProfile.id;

        // Update profile information
        await supabase
            .from('profiles')
            .update({
                display_name: displayName,
                picture_url: pictureUrl,
                updated_at: new Date().toISOString(),
            })
            .eq('id', userId);
    } else {
        // New user, create Supabase auth user with a dummy email
        // Since LINE doesn't provide email, we create a unique email based on LINE user ID
        const dummyEmail = `${lineUserId}@line.user`;
        const dummyPassword = generateSecurePassword();

        const { data: authData, error: signUpError } = await supabase.auth.signUp({
            email: dummyEmail,
            password: dummyPassword,
            options: {
                data: {
                    line_user_id: lineUserId,
                    display_name: displayName,
                },
            },
        });

        if (signUpError) {
            throw new Error(`Failed to create user: ${signUpError.message}`);
        }

        userId = authData.user.id;

        // Create profile record
        const { error: profileError } = await supabase
            .from('profiles')
            .insert({
                id: userId,
                line_user_id: lineUserId,
                display_name: displayName,
                picture_url: pictureUrl,
            });

        if (profileError) {
            throw new Error(`Failed to create profile: ${profileError.message}`);
        }
    }

    // Sign in the user
    const dummyEmail = `${lineUserId}@line.user`;
    const { data: sessionData, error: signInError } = await supabase.auth.signInWithPassword({
        email: dummyEmail,
        password: generateSecurePassword(), // This won't work for existing users
    });

    // If password sign-in fails (for existing users), use admin API or custom token
    // For now, we'll use a workaround: update the session manually
    if (signInError) {
        // Alternative: Use Supabase admin to create a session
        // This requires implementing a server-side API route
        throw new Error('Session creation failed. Please implement server-side session creation.');
    }

    return {
        user: sessionData.user,
        session: sessionData.session,
    };
}

/**
 * Generate random state for CSRF protection
 * @returns {string} Random state string
 */
function generateRandomState() {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate random nonce for replay attack protection
 * @returns {string} Random nonce string
 */
function generateRandomNonce() {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate a secure random password
 * @returns {string} Secure password
 */
function generateSecurePassword() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Verify OAuth state to prevent CSRF attacks
 * @param {string} state - State parameter from callback
 * @returns {boolean} Whether state is valid
 */
export function verifyState(state) {
    if (typeof window === 'undefined') return false;

    const storedState = localStorage.getItem('line_oauth_state');
    localStorage.removeItem('line_oauth_state');
    localStorage.removeItem('line_oauth_nonce');

    return state === storedState;
}
