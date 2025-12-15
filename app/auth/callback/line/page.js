'use client'

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Loader2, AlertCircle } from 'lucide-react';

export default function LineCallbackPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const handleCallback = async () => {
            try {
                const code = searchParams.get('code');
                const state = searchParams.get('state');
                const errorParam = searchParams.get('error');

                if (errorParam) {
                    setError('LINE認証がキャンセルされました');
                    setLoading(false);
                    setTimeout(() => router.push('/login'), 2000);
                    return;
                }

                if (!code) {
                    setError('認証コードが見つかりません');
                    setLoading(false);
                    setTimeout(() => router.push('/login'), 2000);
                    return;
                }

                // Verify state (CSRF protection)
                const storedState = sessionStorage.getItem('line_oauth_state');
                sessionStorage.removeItem('line_oauth_state');
                sessionStorage.removeItem('line_oauth_nonce');

                if (state !== storedState) {
                    setError('無効なリクエストです');
                    setLoading(false);
                    setTimeout(() => router.push('/login'), 2000);
                    return;
                }

                // Call API route to handle authentication
                const response = await fetch('/api/auth/line', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ code }),
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || '認証に失敗しました');
                }

                const data = await response.json();

                // Use the magic link to authenticate
                if (data.redirectUrl) {
                    window.location.href = data.redirectUrl;
                } else {
                    // Fallback: refresh session and redirect
                    await supabase.auth.refreshSession();
                    router.push('/');
                    router.refresh();
                }

            } catch (error) {
                console.error('LINE callback error:', error);
                setError(error.message || '認証処理中にエラーが発生しました');
                setLoading(false);
                setTimeout(() => router.push('/login'), 3000);
            }
        };

        handleCallback();
    }, [searchParams, router]);

    return (
        <div className="login-page">
            <div className="login-container">
                <div className="callback-status">
                    {loading ? (
                        <>
                            <Loader2 className="animate-spin" size={48} />
                            <h2>認証処理中...</h2>
                            <p>しばらくお待ちください</p>
                        </>
                    ) : error ? (
                        <>
                            <AlertCircle size={48} color="#EF4444" />
                            <h2>エラー</h2>
                            <p>{error}</p>
                            <p className="redirect-message">ログインページにリダイレクトします...</p>
                        </>
                    ) : (
                        <>
                            <Loader2 className="animate-spin" size={48} />
                            <h2>ログイン成功!</h2>
                            <p>リダイレクト中...</p>
                        </>
                    )}
                </div>
            </div>

            <style jsx>{`
        .callback-status {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 16px;
          padding: 48px 24px;
          text-align: center;
        }

        .callback-status h2 {
          margin: 0;
          font-size: 24px;
          font-weight: 700;
          color: var(--text-primary);
        }

        .callback-status p {
          margin: 0;
          font-size: 16px;
          color: var(--text-secondary);
        }

        .redirect-message {
          margin-top: 8px;
          font-size: 14px;
          color: var(--text-tertiary);
        }

        .animate-spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
        </div>
    );
}
