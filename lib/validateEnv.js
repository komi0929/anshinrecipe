/**
 * 環境変数検証ユーティリティ
 * アプリケーション起動時に必須環境変数をチェックし、
 * 未設定の場合は明確なエラーメッセージを表示
 */

// 必須環境変数の定義
const REQUIRED_ENV_VARS = {
    // Supabase
    NEXT_PUBLIC_SUPABASE_URL: {
        description: 'Supabase Project URL',
        example: 'https://xxxx.supabase.co',
        required: true,
    },
    NEXT_PUBLIC_SUPABASE_ANON_KEY: {
        description: 'Supabase Anonymous Key',
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        required: true,
    },

    // LINE認証
    NEXT_PUBLIC_LINE_CHANNEL_ID: {
        description: 'LINE Login Channel ID',
        example: '1234567890',
        required: true,
    },
};

// サーバーサイドのみで必要な環境変数
const SERVER_ONLY_ENV_VARS = {
    SUPABASE_SERVICE_ROLE_KEY: {
        description: 'Supabase Service Role Key (for admin operations)',
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        required: true,
    },
    LINE_CHANNEL_SECRET: {
        description: 'LINE Login Channel Secret',
        example: 'abcd1234...',
        required: true,
    },
    ADMIN_PIN: {
        description: 'Admin Dashboard PIN Code',
        example: '1234',
        required: true,
    },
};

// オプション環境変数
const OPTIONAL_ENV_VARS = {
    NEXT_PUBLIC_APP_URL: {
        description: 'Application Base URL',
        example: 'https://your-app.vercel.app',
        defaultValue: 'http://localhost:3000',
    },
    NEXT_PUBLIC_GA_MEASUREMENT_ID: {
        description: 'Google Analytics Measurement ID',
        example: 'G-XXXXXXXXXX',
        defaultValue: null,
    },
    GA4_PROPERTY_ID: {
        description: 'GA4 Property ID (for admin analytics)',
        example: '123456789',
        defaultValue: null,
    },
};

/**
 * 環境変数を検証
 * @param {boolean} isServer - サーバーサイドかどうか
 * @returns {{ valid: boolean, errors: string[], warnings: string[] }}
 */
export function validateEnvVars(isServer = false) {
    const errors = [];
    const warnings = [];

    // 必須環境変数のチェック
    for (const [key, config] of Object.entries(REQUIRED_ENV_VARS)) {
        const value = process.env[key];
        if (!value) {
            errors.push(`❌ ${key} is not set\n   Description: ${config.description}\n   Example: ${config.example}`);
        }
    }

    // サーバーサイドのみの環境変数チェック
    if (isServer) {
        for (const [key, config] of Object.entries(SERVER_ONLY_ENV_VARS)) {
            const value = process.env[key];
            if (!value && config.required) {
                errors.push(`❌ ${key} is not set (server-only)\n   Description: ${config.description}\n   Example: ${config.example}`);
            }
        }
    }

    // オプション環境変数のチェック（警告のみ）
    for (const [key, config] of Object.entries(OPTIONAL_ENV_VARS)) {
        const value = process.env[key];
        if (!value && config.defaultValue === null) {
            warnings.push(`⚠️  ${key} is not set (optional)\n   Description: ${config.description}`);
        }
    }

    return {
        valid: errors.length === 0,
        errors,
        warnings,
    };
}

/**
 * 環境変数を検証し、エラーがあればログに出力
 * 開発時にコンソールで問題を明確に表示
 */
export function checkEnvVars() {
    const isServer = typeof window === 'undefined';
    const { valid, errors, warnings } = validateEnvVars(isServer);

    if (!valid) {
        console.error('\n' + '='.repeat(60));
        console.error('🚨 MISSING REQUIRED ENVIRONMENT VARIABLES');
        console.error('='.repeat(60) + '\n');
        errors.forEach(error => console.error(error + '\n'));
        console.error('Please check your .env.local file and add the missing variables.');
        console.error('='.repeat(60) + '\n');

        // 開発環境では処理を続行（警告のみ）
        // 本番環境では必要に応じてthrowする
        if (process.env.NODE_ENV === 'production') {
            // 本番では致命的エラーとして扱う（任意）
            // throw new Error('Missing required environment variables');
        }
    }

    if (warnings.length > 0) {
        console.warn('\n' + '-'.repeat(60));
        console.warn('⚠️  OPTIONAL ENVIRONMENT VARIABLES NOT SET');
        console.warn('-'.repeat(60) + '\n');
        warnings.forEach(warning => console.warn(warning + '\n'));
        console.warn('-'.repeat(60) + '\n');
    }

    return valid;
}

/**
 * 起動時チェック用のラッパー
 * サーバーコンポーネントまたはAPIルートで使用
 */
export function validateServerEnv() {
    const { valid, errors } = validateEnvVars(true);

    if (!valid) {
        console.error('Server environment validation failed:', errors);
        return false;
    }

    return true;
}
