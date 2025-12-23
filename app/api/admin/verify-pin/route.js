/**
 * Admin PIN Verification API Route
 * サーバーサイドでPINを検証し、クライアントにPINを露出させない
 */

export async function POST(request) {
    try {
        const { pin } = await request.json();

        if (!pin) {
            return Response.json({ error: 'PIN is required' }, { status: 400 });
        }

        // サーバーサイドで環境変数を検証（NEXT_PUBLIC_プレフィックスなし）
        const adminPin = process.env.ADMIN_PIN;

        if (!adminPin) {
            console.error('ADMIN_PIN environment variable is not set');
            return Response.json({ error: 'Server configuration error' }, { status: 500 });
        }

        // PIN検証
        if (pin === adminPin) {
            // 成功時にセッショントークンを生成
            const sessionToken = generateSessionToken();

            return Response.json({
                success: true,
                token: sessionToken
            });
        } else {
            return Response.json({ error: 'Invalid PIN' }, { status: 401 });
        }
    } catch (error) {
        console.error('PIN verification error:', error);
        return Response.json({ error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * セッショントークンを生成
 * 簡易的な実装 - 本番では JWT などを使用することを推奨
 */
function generateSessionToken() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    const token = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    // トークンにタイムスタンプを追加（24時間有効）
    const expiry = Date.now() + 24 * 60 * 60 * 1000;
    return `${token}_${expiry}`;
}

/**
 * セッショントークン検証用 API
 */
export async function GET(request) {
    try {
        const authHeader = request.headers.get('Authorization');

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return Response.json({ valid: false }, { status: 401 });
        }

        const token = authHeader.substring(7);
        const isValid = validateSessionToken(token);

        return Response.json({ valid: isValid });
    } catch (error) {
        console.error('Token validation error:', error);
        return Response.json({ valid: false }, { status: 500 });
    }
}

/**
 * セッショントークンを検証
 */
function validateSessionToken(token) {
    if (!token || !token.includes('_')) return false;

    const parts = token.split('_');
    const expiry = parseInt(parts[parts.length - 1], 10);

    if (isNaN(expiry)) return false;

    // 有効期限チェック
    return Date.now() < expiry;
}
