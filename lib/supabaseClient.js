import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.warn('Missing Supabase environment variables - App will not function correctly')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        // Store session in localStorage so it persists across browser sessions
        persistSession: true,
        // Automatically refresh the token before it expires
        autoRefreshToken: true,
        // Detect session from URL (for OAuth callbacks)
        detectSessionInUrl: true,
        // Use localStorage for session storage (survives browser close)
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    }
})
