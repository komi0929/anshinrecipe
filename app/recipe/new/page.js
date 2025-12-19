'use client'

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useRecipes } from '@/hooks/useRecipes';
import { useProfile } from '@/hooks/useProfile';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { RecipeForm } from '@/components/RecipeForm';
import CoachMark from '@/components/CoachMark';

const AddRecipeContent = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { addRecipe } = useRecipes();
    const { user, profile, loading: profileLoading } = useProfile();
    const [initialData, setInitialData] = useState({});

    useEffect(() => {
        if (!profileLoading && !user) {
            router.push('/login');
        }
    }, [user, profileLoading, router]);

    // Parse Share Target Params
    useEffect(() => {
        const title = searchParams.get('title');
        const text = searchParams.get('text');
        const url = searchParams.get('url');

        if (title || text || url) {
            let extractedUrl = url || '';
            let extractedMemo = text || '';

            // Attempt to extract URL from text if direct URL param is missing
            // (Many SNS apps share "Check this out! https://..." as text)
            if (!extractedUrl && text) {
                const urlMatch = text.match(/(https?:\/\/[^\s]+)/);
                if (urlMatch) {
                    extractedUrl = urlMatch[0];
                    extractedMemo = text.replace(extractedUrl, '').trim();
                }
            }

            setInitialData({
                title: title || '',
                sourceUrl: extractedUrl,
                memo: extractedMemo
            });
        }
    }, [searchParams]);

    const handleCreateRecipe = async (formData) => {
        try {
            await addRecipe(formData, user, profile);
            router.push('/?tab=mine');
        } catch (error) {
            console.error('Failed to add recipe', error);
            alert('レシピの保存に失敗しました');
        }
    };

    if (profileLoading) {
        return (
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
        );
    }
    if (!user) return null;

    // Check if user has no children registered
    const hasNoChildren = !profile?.children || profile.children.length === 0;

    return (
        <div className="container add-recipe-page relative">
            <div className="page-header">
                <Link href="/" className="back-button">
                    <ArrowLeft size={24} />
                </Link>
                <h1 className="page-title">レシピを追加</h1>
            </div>

            {hasNoChildren ? (
                <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-orange-100 to-amber-50 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-orange-100">
                        <span className="text-4xl">👶</span>
                    </div>
                    <h2 className="text-xl font-bold text-slate-700 mb-3">
                        お子様を登録しましょう
                    </h2>
                    <p className="text-slate-500 text-sm mb-6 leading-relaxed">
                        アレルギー情報を登録すると<br />
                        すべての機能が使用いただけます
                    </p>
                    <Link
                        href="/profile"
                        className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-400 to-amber-400 text-white px-8 py-4 rounded-full font-bold shadow-lg shadow-orange-200 hover:shadow-xl transition-all active:scale-95"
                    >
                        <span className="text-lg">👶</span>
                        お子様を登録する
                    </Link>
                </div>
            ) : (
                <>
                    <div className="w-full max-w-2xl mx-auto">
                        <RecipeForm
                            initialData={initialData}
                            onSubmit={handleCreateRecipe}
                            user={user}
                            profile={profile}
                        />
                    </div>

                    {/* Coach Marks for First Time Users */}
                    <CoachMark
                        targetId="recipe-form-url-input"
                        message="便利な機能✨ URLを入力するとレシピ情報を自動で読み込みます！"
                        position="bottom"
                        uniqueKey="recipe_url_guide"
                        delay={1000}
                    />

                    <CoachMark
                        targetId="recipe-form-image-area"
                        message="自分で撮った写真をアップロードすることもできます📷"
                        position="top"
                        uniqueKey="recipe_image_guide"
                        delay={5000}
                    />

                    {/* Note: Delays are staggered so they don't pop up all at once if user is fast */}
                </>
            )}
        </div>
    );
};

const AddRecipePage = () => {
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
            <AddRecipeContent />
        </Suspense>
    );
};

export default AddRecipePage;
