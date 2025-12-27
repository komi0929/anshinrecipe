'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/Toast';

/**
 * useCollections - レシピコレクション（フォルダ）管理フック
 * 
 * ユーザーが保存したレシピをフォルダで整理できる機能
 */

// デフォルトのコレクションアイコン候補
export const COLLECTION_ICONS = [
    '📁', '⭐', '❤️', '🍳', '🍱', '🎂', '🥗', '🍜',
    '🏠', '👶', '🎄', '🎃', '🌸', '🏖️', '🎂', '🎉'
];

// デフォルトのコレクションカラー候補
export const COLLECTION_COLORS = [
    '#f97316', // Orange
    '#ef4444', // Red
    '#ec4899', // Pink
    '#8b5cf6', // Purple
    '#3b82f6', // Blue
    '#06b6d4', // Cyan
    '#10b981', // Emerald
    '#84cc16', // Lime
];

export const useCollections = (userId) => {
    const [collections, setCollections] = useState([]);
    const [loading, setLoading] = useState(true);
    const { addToast } = useToast();

    // Fetch all collections for user
    const fetchCollections = useCallback(async () => {
        if (!userId) {
            setLoading(false);
            return;
        }

        try {
            const { data, error } = await supabase
                .from('collections')
                .select(`
                    *,
                    collection_recipes (
                        recipe_id,
                        added_at,
                        recipe:recipes (
                            id,
                            title,
                            image_url
                        )
                    )
                `)
                .eq('user_id', userId)
                .order('position', { ascending: true });

            if (error) throw error;

            const formatted = data?.map(c => ({
                id: c.id,
                name: c.name,
                description: c.description,
                icon: c.icon,
                color: c.color,
                isDefault: c.is_default,
                position: c.position,
                createdAt: c.created_at,
                recipeCount: c.collection_recipes?.length || 0,
                recipes: c.collection_recipes?.map(cr => ({
                    id: cr.recipe_id,
                    addedAt: cr.added_at,
                    title: cr.recipe?.title,
                    image: cr.recipe?.image_url,
                })) || [],
                // Preview images (first 4)
                previewImages: c.collection_recipes
                    ?.slice(0, 4)
                    .map(cr => cr.recipe?.image_url)
                    .filter(Boolean) || [],
            })) || [];

            setCollections(formatted);
        } catch (error) {
            console.error('Error fetching collections:', error);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        fetchCollections();
    }, [fetchCollections]);

    // Create new collection
    const createCollection = useCallback(async ({ name, description, icon, color }) => {
        if (!userId) return null;

        try {
            const { data, error } = await supabase
                .from('collections')
                .insert({
                    user_id: userId,
                    name,
                    description,
                    icon: icon || '📁',
                    color: color || '#f97316',
                    position: collections.length,
                })
                .select()
                .single();

            if (error) throw error;

            addToast(`「${name}」を作成しました`, 'success');
            await fetchCollections();
            return data;
        } catch (error) {
            console.error('Error creating collection:', error);
            addToast('コレクションの作成に失敗しました', 'error');
            return null;
        }
    }, [userId, collections.length, addToast, fetchCollections]);

    // Update collection
    const updateCollection = useCallback(async (collectionId, updates) => {
        try {
            const { error } = await supabase
                .from('collections')
                .update(updates)
                .eq('id', collectionId);

            if (error) throw error;

            addToast('更新しました', 'success');
            await fetchCollections();
        } catch (error) {
            console.error('Error updating collection:', error);
            addToast('更新に失敗しました', 'error');
        }
    }, [addToast, fetchCollections]);

    // Delete collection
    const deleteCollection = useCallback(async (collectionId, collectionName) => {
        try {
            const { error } = await supabase
                .from('collections')
                .delete()
                .eq('id', collectionId);

            if (error) throw error;

            addToast(`「${collectionName}」を削除しました`, 'info');
            await fetchCollections();
        } catch (error) {
            console.error('Error deleting collection:', error);
            addToast('削除に失敗しました', 'error');
        }
    }, [addToast, fetchCollections]);

    // Add recipe to collection
    const addRecipeToCollection = useCallback(async (collectionId, recipeId) => {
        try {
            const { error } = await supabase
                .from('collection_recipes')
                .insert({
                    collection_id: collectionId,
                    recipe_id: recipeId,
                });

            if (error) {
                if (error.code === '23505') {
                    addToast('すでに追加されています', 'info');
                    return;
                }
                throw error;
            }

            addToast('コレクションに追加しました', 'success');
            await fetchCollections();
        } catch (error) {
            console.error('Error adding recipe to collection:', error);
            addToast('追加に失敗しました', 'error');
        }
    }, [addToast, fetchCollections]);

    // Remove recipe from collection
    const removeRecipeFromCollection = useCallback(async (collectionId, recipeId) => {
        try {
            const { error } = await supabase
                .from('collection_recipes')
                .delete()
                .eq('collection_id', collectionId)
                .eq('recipe_id', recipeId);

            if (error) throw error;

            addToast('コレクションから削除しました', 'info');
            await fetchCollections();
        } catch (error) {
            console.error('Error removing recipe from collection:', error);
            addToast('削除に失敗しました', 'error');
        }
    }, [addToast, fetchCollections]);

    // Get collections containing a specific recipe
    const getCollectionsForRecipe = useCallback((recipeId) => {
        return collections.filter(c =>
            c.recipes.some(r => r.id === recipeId)
        );
    }, [collections]);

    // Check if recipe is in any collection
    const isRecipeInCollection = useCallback((recipeId, collectionId = null) => {
        if (collectionId) {
            const collection = collections.find(c => c.id === collectionId);
            return collection?.recipes.some(r => r.id === recipeId) || false;
        }
        return collections.some(c => c.recipes.some(r => r.id === recipeId));
    }, [collections]);

    return {
        collections,
        loading,
        createCollection,
        updateCollection,
        deleteCollection,
        addRecipeToCollection,
        removeRecipeFromCollection,
        getCollectionsForRecipe,
        isRecipeInCollection,
        refreshCollections: fetchCollections,
    };
};

export default useCollections;
