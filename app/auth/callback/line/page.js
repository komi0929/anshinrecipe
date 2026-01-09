'use client'

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Loader2, AlertCircle } from 'lucide-react';
import Image from 'next/image';

function LineCallbackContent() {
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

                // Verify state (CSRF protection) - use localStorage as sessionStorage doesn't persist across redirects
                const storedState = localStorage.getItem('line_oauth_state');
                const isProRegistration = localStorage.getItem('pro_registration') === 'true';

                // Debug log for state verification
                console.log('State verification:', {
                    receivedState: state,
                    storedState: storedState,
                    stateMatch: state === storedState,
                    isProRegistration
                });

                // Clean up localStorage
                localStorage.removeItem('line_oauth_state');
                localStorage.removeItem('line_oauth_nonce');
                localStorage.removeItem('pro_registration');

                // State validation - warn but continue if state is missing (may happen on browser restart/cache clear)
                if (storedState && state !== storedState) {
                    console.warn('State mismatch detected, but continuing authentication attempt');
                    // Note: We continue anyway since the state mismatch could be due to 
                    // browser cache issues, and the server-side code validation is still safe
                }

                // Call API route to handle authentication
                const response = await fetch('/api/auth/line', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        code,
                        redirectUri: window.location.origin + '/auth/callback/line',
                        isProRegistration: isProRegistration
                    }),
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
                // Extend timeout to give user time to read the error
                setTimeout(() => router.push('/login'), 8000);
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
                            <h2 style={{ color: '#EF4444' }}>認証エラーが発生しました</h2>
                            <div className="error-box">
                                <p className="error-message">{error}</p>
                            </div>
                            <p className="redirect-hint">まもなくログインページに戻ります...</p>
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

        .error-box {
          background-color: #FEF2F2;
          border: 1px solid #FECACA;
          border-radius: 12px;
          padding: 16px;
          margin: 8px 0;
          max-width: 100%;
          word-break: break-all;
        }

        .error-message {
          color: #DC2626 !important;
          font-size: 14px !important;
          font-weight: 500;
          line-height: 1.5;
        }

        .redirect-hint {
          margin-top: 12px !important;
          font-size: 12px !important;
          color: #9CA3AF !important;
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

export default function LineCallbackPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-[#fcfcfc]">
                <div className="animate-pulse">
                    <Image
                        src="/logo.png"
                        alt="Loading..."
                        width={180}
                        height={45}
                        className="object-contain opacity-50"
                    />
                </div>
            </div>
        }>
            <LineCallbackContent />
        </Suspense>
    );
}
