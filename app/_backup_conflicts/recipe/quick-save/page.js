'use client'

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { useProfile } from '@/hooks/useProfile';
import { CheckCircle, Loader2, AlertCircle } from 'lucide-react';

const QuickSaveContent = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, loading: profileLoading } = useProfile();
    const [status, setStatus] = useState('saving'); // 'saving' | 'success' | 'error'
    const [error, setError] = useState('');

    useEffect(() => {
        const saveRecipe = async () => {
            // Wait for auth to be ready
            if (profileLoading) return;

            // Check login
            if (!user) {
                // Store intended save in localStorage and redirect to login
                const params = Object.fromEntries(searchParams.entries());
                localStorage.setItem('pendingQuickSave', JSON.stringify(params));
                router.push('/login');
                return;
            }

            // Extract URL from params
            const title = searchParams.get('title') || '';
            const text = searchParams.get('text') || '';
            const url = searchParams.get('url') || '';

            // Try to find URL in text if not provided directly
            let extractedUrl = url;
            let extractedMemo = text;

            if (!extractedUrl && text) {
                const urlMatch = text.match(/(https?:\/\/[^\s]+)/);
                if (urlMatch) {
                    extractedUrl = urlMatch[0];
                    extractedMemo = text.replace(extractedUrl, '').trim();
                }
            }

            if (!extractedUrl && !title) {
                setStatus('error');
                setError('保存するURLが見つかりませんでした');
                setTimeout(() => router.push('/'), 3000);
                return;
            }

            try {
                // Fetch OGP data to get title and image
                let ogpTitle = title;
                let ogpImage = '';

                if (extractedUrl) {
                    try {
                        const ogpRes = await fetch('/api/ogp', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ url: extractedUrl })
                        });
                        if (ogpRes.ok) {
                            const ogpData = await ogpRes.json();
                            ogpTitle = ogpData.title || title || extractedUrl;
                            ogpImage = ogpData.image || '';
                        }
                    } catch (e) {
                        console.log('OGP fetch failed, using fallback title');
                        ogpTitle = title || extractedUrl;
                    }
                }

                // Save to database as private (draft) recipe
                const newRecipe = {
                    user_id: user.id,
                    title: ogpTitle || 'レシピメモ',
                    description: '',
                    image_url: ogpImage,
                    source_url: extractedUrl,
                    tags: [],
                    free_from_allergens: [],
                    positive_ingredients: [],
                    child_ids: [],
                    scenes: [],
                    memo: extractedMemo,
                    is_public: false // Always save as private/draft
                };

                const { error: insertError } = await supabase
                    .from('recipes')
                    .insert(newRecipe);

                if (insertError) throw insertError;

                setStatus('success');

                // Redirect to home after 2 seconds
                setTimeout(() => {
                    router.push('/?tab=mine');
                }, 2000);

            } catch (e) {
                console.error('Quick save error:', e);
                setStatus('error');
                setError('保存に失敗しました');
                setTimeout(() => router.push('/'), 3000);
            }
        };

        saveRecipe();
    }, [user, profileLoading, searchParams, router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#fcfcfc]">
            <div className="text-center p-8">
                {status === 'saving' && (
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
                            <Loader2 className="w-8 h-8 text-primary animate-spin" />
                        </div>
                        <p className="text-lg font-bold text-slate-700">保存中...</p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="flex flex-col items-center gap-4 animate-in zoom-in-50 duration-300">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-10 h-10 text-green-500" />
                        </div>
                        <p className="text-xl font-bold text-slate-700">保存しました！</p>
                        <p className="text-sm text-slate-500">「自分のレシピ」に追加されました</p>
                    </div>
                )}

                {status === 'error' && (
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                            <AlertCircle className="w-8 h-8 text-red-500" />
                        </div>
                        <p className="text-lg font-bold text-slate-700">{error}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

const QuickSavePage = () => {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-[#fcfcfc]">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                </div>
            </div>
        }>
            <QuickSaveContent />
        </Suspense>
    );
};

export default QuickSavePage;
