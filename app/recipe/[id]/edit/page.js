'use client'

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useRecipes } from '@/hooks/useRecipes';
import { useProfile } from '@/hooks/useProfile';
import { ArrowLeft, Trash2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { RecipeForm } from '@/components/RecipeForm';
import { supabase } from '@/lib/supabaseClient';

const EditRecipeContent = () => {
    const router = useRouter();
    const { id } = useParams();
    const { updateRecipe, deleteRecipe } = useRecipes();
    const { user, profile, loading: profileLoading } = useProfile();

    const [isLoading, setIsLoading] = useState(true);
    const [initialData, setInitialData] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

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

    const handleDelete = async () => {
        if (!id || !user) return;

        setIsDeleting(true);
        try {
            // Delete from Supabase
            const { error } = await supabase
                .from('recipes')
                .delete()
                .eq('id', id)
                .eq('user_id', user.id);

            if (error) throw error;

            // Navigate to home
            router.push('/?tab=mine');
        } catch (error) {
            console.error('Failed to delete recipe:', error);
            alert('レシピの削除に失敗しました');
        } finally {
            setIsDeleting(false);
            setShowDeleteConfirm(false);
        }
    };

    // Show skeleton while loading
    if (profileLoading || isLoading || !user || !initialData) {
        return (
            <div className="container add-recipe-page relative">
                <div className="page-header">
                    <div className="w-8 h-8 bg-slate-200 rounded-full animate-pulse" />
                    <div className="h-6 w-32 bg-slate-200 rounded animate-pulse" />
                </div>
                <div className="w-full max-w-2xl mx-auto p-4 space-y-6">
                    <div className="h-12 bg-slate-200 rounded-xl animate-pulse" />
                    <div className="aspect-video bg-slate-200 rounded-xl animate-pulse" />
                    <div className="h-32 bg-slate-200 rounded-xl animate-pulse" />
                    <div className="h-12 bg-slate-200 rounded-xl animate-pulse" />
                </div>
            </div>
        );
    }

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

                {/* Delete Button */}
                <div className="mt-8 pt-6 border-t border-red-100">
                    <button
                        type="button"
                        onClick={() => setShowDeleteConfirm(true)}
                        className="w-full py-3 px-4 bg-red-50 text-red-600 font-bold rounded-xl border border-red-200 hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                    >
                        <Trash2 size={20} />
                        このレシピを削除する
                    </button>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
                        <h3 className="text-xl font-bold text-slate-800 mb-4">レシピを削除しますか？</h3>
                        <p className="text-slate-600 mb-6">
                            この操作は取り消せません。レシピに関連するすべてのデータ（いいね、保存、レポートなど）も削除されます。
                        </p>
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => setShowDeleteConfirm(false)}
                                disabled={isDeleting}
                                className="flex-1 py-3 px-4 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                            >
                                キャンセル
                            </button>
                            <button
                                type="button"
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="flex-1 py-3 px-4 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50"
                            >
                                {isDeleting ? '削除中...' : '削除する'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const EditRecipePage = () => {
    return (
        <Suspense fallback={null}>
            <EditRecipeContent />
        </Suspense>
    );
};

export default EditRecipePage;

