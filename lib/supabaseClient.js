import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'

// 環境変数の検証と警告表示
const validateSupabaseEnv = () => {
    const missing = [];

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
        missing.push('NEXT_PUBLIC_SUPABASE_URL');
    }
    if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        missing.push('NEXT_PUBLIC_SUPABASE_ANON_KEY');
    }

    if (missing.length > 0) {
        const errorMessage = `
╔══════════════════════════════════════════════════════════════╗
║  ⚠️  MISSING REQUIRED ENVIRONMENT VARIABLES                  ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
${missing.map(v => `║  ❌ ${v.padEnd(53)}║`).join('\n')}
║                                                              ║
║  Please add these to your .env.local file:                   ║
║  NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co           ║
║  NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...                  ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
`;
        console.error(errorMessage);
    }

    return missing.length === 0;
};

// 起動時に検証を実行
validateSupabaseEnv();

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

