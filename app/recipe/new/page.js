'use client'

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useRecipes } from '@/hooks/useRecipes';
import { useProfile } from '@/hooks/useProfile';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { RecipeForm } from '@/components/RecipeForm';
import './AddRecipePage.css';

const AddRecipePage = () => {
    const router = useRouter();
    const { addRecipe } = useRecipes();
    const { user, profile, loading: profileLoading } = useProfile();

    useEffect(() => {
        if (!profileLoading && !user) {
            router.push('/login');
        }
    }, [user, profileLoading, router]);

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
                    onSubmit={handleCreateRecipe}
                    user={user}
                    profile={profile}
                />
            </div>
        </div>
    );
};

export default AddRecipePage;
