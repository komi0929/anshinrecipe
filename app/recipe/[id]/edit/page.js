'use client'

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useRecipes } from '@/hooks/useRecipes';
import { useProfile } from '@/hooks/useProfile';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { RecipeForm } from '@/components/RecipeForm';
import { supabase } from '@/lib/supabaseClient';

const EditRecipeContent = () => {
    const router = useRouter();
    const { id } = useParams();
    const { updateRecipe } = useRecipes();
    const { user, profile, loading: profileLoading } = useProfile();

    const [isLoading, setIsLoading] = useState(true);
    const [initialData, setInitialData] = useState(null);

    useEffect(() => {
        if (!profileLoading && !user) {
            router.push('/login');
        }
    }, [user, profileLoading, router]);

    // Fetch existing recipe data
    useEffect(() => {
        const fetchRecipe = async () => {
            if (!id || !user) return;

            try {
                setIsLoading(true);
                const { data, error } = await supabase
                    .from('recipes')
                    .select('*')
                    .eq('id', id)
                    .single();

                if (error) throw error;

                // Verify ownership
                if (data.user_id !== user.id) {
                    alert('編集権限がありません');
                    router.push(`/recipe/${id}`);
                    return;
                }

                // Populate initial data for RecipeForm
                setInitialData({
                    title: data.title || '',
                    sourceUrl: data.source_url || '',
                    image: data.image_url || '',
                    description: data.description || '',
                    childIds: data.child_ids || [],
                    scenes: data.scenes || [],
                    memo: data.memo || '',
                    tags: data.tags || [],
                    freeFromAllergens: data.free_from_allergens || [],
                    isPublic: data.is_public !== false
                });

            } catch (error) {
                console.error('Error fetching recipe:', error);
                alert('レシピの読み込みに失敗しました');
                router.push('/');
            } finally {
                setIsLoading(false);
            }
        };

        fetchRecipe();
    }, [id, user, router]);

    const handleUpdateRecipe = async (formData) => {
        try {
            await updateRecipe(id, formData);
            router.push(`/recipe/${id}`);
        } catch (error) {
            console.error('Failed to update recipe', error);
            alert('レシピの更新に失敗しました');
        }
    };

    if (profileLoading || isLoading) {
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

    if (!user || !initialData) return null;

    return (
        <div className="container add-recipe-page relative">
            <div className="page-header">
                <Link href={`/recipe/${id}`} className="back-button">
                    <ArrowLeft size={24} />
                </Link>
                <h1 className="page-title">レシピを編集</h1>
            </div>

            <div className="w-full max-w-2xl mx-auto">
                <RecipeForm
                    initialData={initialData}
                    onSubmit={handleUpdateRecipe}
                    user={user}
                    profile={profile}
                    isEditMode={true}
                />
            </div>
        </div>
    );
};

const EditRecipePage = () => {
    const LoadingScreen = () => (
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

    return (
        <Suspense fallback={<LoadingScreen />}>
            <EditRecipeContent />
        </Suspense>
    );
};

export default EditRecipePage;
