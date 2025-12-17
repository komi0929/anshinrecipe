'use client'

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useRecipes } from '@/hooks/useRecipes';
import { useProfile } from '@/hooks/useProfile';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { RecipeForm } from '@/components/RecipeForm';

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
            router.push('/');
        } catch (error) {
            console.error('Failed to add recipe', error);
            alert('レシピの保存に失敗しました');
        }
    };

    if (profileLoading) return <div className="loading-spinner">読み込み中...</div>;
    if (!user) return null;

    return (
        <div className="container add-recipe-page relative">
            <div className="page-header">
                <Link href="/" className="back-button">
                    <ArrowLeft size={24} />
                </Link>
                <h1 className="page-title">レシピを追加</h1>
            </div>

            <div className="w-full max-w-2xl mx-auto">
                <RecipeForm
                    initialData={initialData}
                    onSubmit={handleCreateRecipe}
                    user={user}
                    profile={profile}
                />
            </div>
        </div>
    );
};

const AddRecipePage = () => {
    return (
        <Suspense fallback={<div className="loading-spinner">読み込み中...</div>}>
            <AddRecipeContent />
        </Suspense>
    );
};

export default AddRecipePage;
