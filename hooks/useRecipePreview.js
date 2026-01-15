'use client';

import { supabase } from '@/lib/supabaseClient';

export const useRecipePreview = () => {
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

    return { previewImage };
};
