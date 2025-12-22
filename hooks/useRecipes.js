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
                    ),
                    cooking_logs (id, content, rating, created_at, user_id),
                    recipe_images (id, image_url),
                    likes!recipe_id (id),
                    saved_recipes!recipe_id (id)
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
                isPublic: recipe.is_public,
                author: recipe.profiles,
                userId: recipe.user_id,
                createdAt: recipe.created_at,
                likeCount: recipe.likes?.length || 0,
                saveCount: recipe.saved_recipes?.length || 0,
                // New fields
                logs: recipe.cooking_logs || [],
                memoImages: recipe.recipe_images || []
            }));

            setRecipes(formattedRecipes);
        } catch (error) {
            console.error('Error fetching recipes:', error);
            addToast('レシピの取得に失敗しました', 'error');
        } finally {
            setLoading(false);
        }
    }, [addToast]);

    // Add Cooking Log (Private Memo)
    const addCookingLog = async (logData) => {
        try {
            const { error } = await supabase
                .from('cooking_logs')
                .insert([logData]);

            if (error) throw error;

            addToast('メモを保存しました', 'success');
            fetchRecipes();
            return true;
        } catch (error) {
            console.error('Error adding log:', error);
            addToast('メモの保存に失敗しました', 'error');
            throw error;
        }
    };

    // Delete Cooking Log (Private Memo)
    const deleteCookingLog = async (logId) => {
        try {
            const { error } = await supabase
                .from('cooking_logs')
                .delete()
                .eq('id', logId);

            if (error) throw error;

            addToast('メモを削除しました', 'success');
            fetchRecipes();
            return true;
        } catch (error) {
            console.error('Error deleting log:', error);
            addToast('メモの削除に失敗しました', 'error');
            throw error;
        }
    };

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

    const updateRecipeImageLocal = (id, imageUrl) => {
        setRecipes(prev => prev.map(r => r.id === id ? { ...r, image: imageUrl } : r));
    };

    const updateRecipeImage = async (id, imageUrl) => {
        if (!imageUrl) return;
        try {
            // Update local state immediately for perceived speed
            updateRecipeImageLocal(id, imageUrl);

            const { error } = await supabase
                .from('recipes')
                .update({ image_url: imageUrl })
                .eq('id', id);
            if (error) throw error;
            // No need to fetchRecipes() here as we already updated local state
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
                is_public: recipe.isPublic === true // Ensure boolean
            };

            console.log('Creating recipe with data:', { ...newRecipe, is_public: newRecipe.is_public, isPublicType: typeof newRecipe.is_public });

            const { data, error } = await supabase
                .from('recipes')
                .insert(newRecipe)
                .select()
                .single();

            if (error) {
                console.error('Supabase insert error:', error);
                throw error;
            }

            addToast('レシピを投稿しました', 'success');

            // Handle Memo Images (Smart Canvas)
            if (recipe.memoImages && recipe.memoImages.length > 0) {
                const imageInserts = recipe.memoImages.map(img => ({
                    recipe_id: data.id,
                    user_id: user.id,
                    image_url: img.image_url || img // Handle object or string
                }));
                const { error: imgError } = await supabase
                    .from('recipe_images')
                    .insert(imageInserts);
                if (imgError) console.error('Error saving memo images', imgError);
            }

            // Refresh list
            fetchRecipes();

            // Trigger async OGP image fetch if image not provided
            if (!newRecipe.image_url && newRecipe.source_url) {
                previewImage(newRecipe.source_url, data.id);
            }
            return data;
        } catch (error) {
            console.error('Error adding recipe:', error);
            console.error('Error details:', JSON.stringify(error, null, 2));
            addToast(`投稿に失敗しました: ${error.message || 'Unknown error'}`, 'error');
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
                is_public: recipe.isPublic,
                updated_at: new Date().toISOString()
            };

            const { error } = await supabase
                .from('recipes')
                .update(updates)
                .eq('id', id);

            if (error) throw error;

            // Handle Memo Images Update
            // Strategy: Verify current images. In a real app we might diff. 
            // Here, we'll naive-sync: Delete all and re-insert (safe for small numbers) OR just insert new.
            // But deleting requires knowing we aren't deleting someone else's if shared? RLS handles it.
            // Let's just Insert new ones for now to avoid accidental data loss logic bugs in this turn.
            // Wait, if I delete in UI, it should be removed.
            // So: Delete *all* existing for this recipe, then insert current list.
            if (recipe.memoImages) {
                await supabase.from('recipe_images').delete().eq('recipe_id', id);
                if (recipe.memoImages.length > 0) {
                    const imageInserts = recipe.memoImages.map(img => ({
                        recipe_id: id,
                        user_id: user.id || updates.user_id, // ensure user_id is available
                        image_url: img.image_url || img
                    }));
                    await supabase.from('recipe_images').insert(imageInserts);
                }
            }

            addToast('レシピを更新しました', 'success');
            // Update local state is tricky with joins. Refetch is safer.
            fetchRecipes();
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
        previewImage, // expose for UI components
        addCookingLog, // expose for UI components
        deleteCookingLog // expose for deleting memos
    };
};
