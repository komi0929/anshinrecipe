'use client'

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/Toast';

export const useRecipes = () => {
    const [recipes, setRecipes] = useState([]);
    const [loading, setLoading] = useState(true);
    const { addToast } = useToast();

    const fetchRecipes = useCallback(async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('recipes')
                .select(`
                    *,
                    profiles:user_id (
                        username,
                        avatar_url,
                        display_name,
                        picture_url
                    )
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Transform data to match component expectations
            const formattedRecipes = data.map(recipe => ({
                id: recipe.id,
                title: recipe.title,
                description: recipe.description,
                image: recipe.image_url,
                sourceUrl: recipe.source_url,
                tags: recipe.tags || [],
                freeFromAllergens: recipe.free_from_allergens || [],
                positiveIngredients: recipe.positive_ingredients || [],
                childIds: recipe.child_ids || [],
                scenes: recipe.scenes || [],
                memo: recipe.memo || '',
                author: recipe.profiles,
                userId: recipe.user_id,
                createdAt: recipe.created_at
            }));

            setRecipes(formattedRecipes);
        } catch (error) {
            console.error('Error fetching recipes:', error);
            addToast('レシピの取得に失敗しました', 'error');
        } finally {
            setLoading(false);
        }
    }, [addToast]);

    useEffect(() => {
        fetchRecipes();
    }, [fetchRecipes]);

    // ---- New additions for async OGP image handling ----
    const imageCache = new Map(); // URL -> image URL

    const fetchOgImage = async (url) => {
        if (imageCache.has(url)) return imageCache.get(url);
        try {
            // Use a lightweight endpoint (Supabase Edge Function or third‑party) to get OGP image
            const endpoint = process.env.NEXT_PUBLIC_OG_FETCH_ENDPOINT || '/api/fetch-og-image';
            const res = await fetch(`${endpoint}?url=${encodeURIComponent(url)}`);
            if (!res.ok) throw new Error('OG fetch failed');
            const data = await res.json();
            const imageUrl = data.ogImage || data.image || null;
            if (imageUrl) imageCache.set(url, imageUrl);
            return imageUrl;
        } catch (e) {
            console.error('Failed to fetch OGP image:', e);
            return null;
        }
    };

    const updateRecipeImage = async (id, imageUrl) => {
        if (!imageUrl) return;
        try {
            const { error } = await supabase
                .from('recipes')
                .update({ image_url: imageUrl })
                .eq('id', id);
            if (error) throw error;
            // Refresh the list to reflect the new image
            fetchRecipes();
        } catch (e) {
            console.error('Error updating recipe image:', e);
        }
    };

    const previewImage = async (sourceUrl, recipeId) => {
        const ogImg = await fetchOgImage(sourceUrl);
        if (ogImg) {
            await updateRecipeImage(recipeId, ogImg);
        }
    };
    // ---------------------------------------------------

    const addRecipe = async (recipe, user, profile) => {
        if (!user) return;
        try {
            // Get allergens from selected children
            let autoFreeFromAllergens = [];
            if (recipe.childIds && recipe.childIds.length > 0 && profile?.children) {
                const selectedChildren = profile.children.filter(child =>
                    recipe.childIds.includes(child.id)
                );

                // Collect all unique allergens from selected children
                const allergensSet = new Set();
                selectedChildren.forEach(child => {
                    if (child.allergens && Array.isArray(child.allergens)) {
                        child.allergens.forEach(allergen => allergensSet.add(allergen));
                    }
                });
                autoFreeFromAllergens = Array.from(allergensSet);
            }

            // Merge with manually specified allergens
            const combinedAllergens = [
                ...new Set([
                    ...autoFreeFromAllergens,
                    ...(recipe.freeFromAllergens || [])
                ])
            ];

            const newRecipe = {
                user_id: user.id,
                title: recipe.title,
                description: recipe.description,
                image_url: recipe.image,
                source_url: recipe.sourceUrl,
                tags: recipe.tags || [],
                free_from_allergens: combinedAllergens,
                positive_ingredients: recipe.positiveIngredients || [],
                child_ids: recipe.childIds || [],
                scenes: recipe.scenes || [],
                memo: recipe.memo || '',
                is_public: true
            };

            const { data, error } = await supabase
                .from('recipes')
                .insert(newRecipe)
                .select()
                .single();

            if (error) throw error;

            addToast('レシピを投稿しました', 'success');
            // Refresh list
            fetchRecipes();
            // Trigger async OGP image fetch if image not provided
            if (!newRecipe.image_url && newRecipe.source_url) {
                // previewImage will fetch and update later
                previewImage(newRecipe.source_url, data.id);
            }
            return data;
        } catch (error) {
            console.error('Error adding recipe:', error);
            addToast('投稿に失敗しました', 'error');
            throw error;
        }
    };

    const updateRecipe = async (id, recipe) => {
        try {
            const updates = {
                title: recipe.title,
                description: recipe.description,
                image_url: recipe.image,
                source_url: recipe.sourceUrl,
                tags: recipe.tags || [],
                // We don't auto-calculate allergens on update to avoid overwriting manual changes unexpectedly, 
                // but we could if desired. For now, let's trust the input or re-calculate if needed.
                // Simplified: usage same as addRecipe for consistency
                child_ids: recipe.childIds || [],
                scenes: recipe.scenes || [],
                memo: recipe.memo || '',
                updated_at: new Date().toISOString()
            };

            const { error } = await supabase
                .from('recipes')
                .update(updates)
                .eq('id', id);

            if (error) throw error;

            addToast('レシピを更新しました', 'success');
            // Update local state
            setRecipes(prev => prev.map(r => r.id === id ? { ...r, ...recipe } : r));
            fetchRecipes(); // Refresh full list to be sure
        } catch (error) {
            console.error('Error updating recipe:', error);
            addToast('更新に失敗しました', 'error');
            throw error;
        }
    };

    const deleteRecipe = async (id) => {
        try {
            const { error } = await supabase
                .from('recipes')
                .delete()
                .eq('id', id);

            if (error) throw error;

            setRecipes(prev => prev.filter(r => r.id !== id));
            addToast('レシピを削除しました', 'success');
        } catch (error) {
            console.error('Error deleting recipe:', error);
            addToast('削除に失敗しました', 'error');
        }
    };

    return {
        recipes,
        loading,
        addRecipe,
        updateRecipe,
        deleteRecipe,
        refreshRecipes: fetchRecipes,
        previewImage // expose for UI components
    };
};
