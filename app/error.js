'use client';

import { useEffect } from 'react';
import { RefreshCcw, Home } from 'lucide-react';
import Link from 'next/link';

export default function Error({ error, reset }) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error('Error Boundary caught:', error);
        // Attempt to log more details if it's an Event or generic Object
        try {
            console.error('Error type:', error?.type);
            console.error('Error message:', error?.message);
            console.error('Error JSON:', JSON.stringify(error, null, 2));
        } catch (e) {
            console.error('Failed to parse error:', e);
        }
    }, [error]);

    return (
        <div className="container" style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '60vh',
            textAlign: 'center'
        }}>
            <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--color-alert)' }}>
                予期せぬエラーが発生しました
            </h2>
            <p className="text-sub mb-8">
                申し訳ありません。もう一度お試しください。
            </p>

            <div style={{ display: 'flex', gap: '16px' }}>
                <button
                    onClick={reset}
                    className="btn btn-primary"
                >
                    <RefreshCcw size={20} />
                    再読み込み
                </button>
                <Link href="/" className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '9999px', border: '2px solid var(--color-border)', fontWeight: 'bold' }}>
                    <Home size={20} />
                    ホームへ
                </Link>
            </div>
        </div>
    );
}
