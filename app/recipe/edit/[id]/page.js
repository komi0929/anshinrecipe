'use client'

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useRecipes } from '@/hooks/useRecipes';
import { useProfile } from '@/hooks/useProfile';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { RecipeForm } from '@/components/RecipeForm';
import { supabase } from '@/lib/supabaseClient'; // Direct import for single fetch if needed

const EditRecipePage = () => {
    const router = useRouter();
    const params = useParams();
    const { id } = params;

    const { recipes, updateRecipe, loading: recipesLoading } = useRecipes();
    const { user, profile, loading: profileLoading } = useProfile();

    const [recipe, setRecipe] = useState(null);
    const [loading, setLoading] = useState(true);

    // Effect to find or fetch recipe
    useEffect(() => {
        if (!id) return;

        const findAndSetRecipe = async () => {
            setLoading(true);

            // 1. Try to find in existing list
            const found = recipes.find(r => r.id === id);
            if (found) {
                setRecipe(found);
                setLoading(false);
                return;
            }

            // 2. If not in list (e.g. direct access), fetch single
            // Note: useRecipes normally fetches all, so we might just wait for it, 
            // but for speed/accuracy on direct load:
            try {
                const { data, error } = await supabase
                    .from('recipes')
                    .select('*')
                    .eq('id', id)
                    .single();

                if (error) throw error;

                // Map to internal format if needed (useRecipes does mapping, we should match it)
                // Simplified mapping to match RecipeForm expectations
                const mapped = {
                    id: data.id,
                    title: data.title,
                    description: data.description,
                    image: data.image_url,
                    sourceUrl: data.source_url,
                    tags: data.tags || [],
                    childIds: data.child_ids || [],
                    scenes: data.scenes || [],
                    memo: data.memo || '',
                    userId: data.user_id
                };
                setRecipe(mapped);
            } catch (err) {
                console.error('Error fetching recipe:', err);
                router.push('/'); // Redirect if not found
            } finally {
                setLoading(false);
            }
        };

        if (!recipesLoading) {
            findAndSetRecipe();
        }
    }, [id, recipes, recipesLoading, router]);

    // Effect to check ownership
    useEffect(() => {
        if (!profileLoading && user && recipe) {
            if (user.id !== recipe.userId) {
                alert('権限がありません');
                router.push('/');
            }
        }
    }, [user, recipe, profileLoading, router]);

    const handleUpdateRecipe = async (formData) => {
        try {
            await updateRecipe(id, formData);
            router.push(`/recipe/${id}`);
        } catch (error) {
            console.error('Failed to update recipe', error);
            alert('レシピの更新に失敗しました');
        }
    };

    if (profileLoading || loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;
    if (!user || !recipe) return null;

    return (
        <div className="container relative pb-20">
            <div className="flex items-center gap-4 p-4 sticky top-0 bg-white z-10 border-b">
                <Link href={`/recipe/${id}`} className="p-2 hover:bg-gray-100 rounded-full">
                    <ArrowLeft size={24} />
                </Link>
                <h1 className="text-lg font-bold">レシピを編集</h1>
            </div>

            <div className="w-full max-w-2xl mx-auto p-4">
                <RecipeForm
                    initialData={recipe}
                    onSubmit={handleUpdateRecipe}
                    user={user}
                    profile={profile}
                    isEditMode={true}
                />
            </div>
        </div>
    );
};

export default EditRecipePage;
