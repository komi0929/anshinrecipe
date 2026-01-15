import { useState, useEffect, useCallback } from 'react';
import useSWR from 'swr';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/Toast';
import { uploadImage } from '@/lib/imageUpload';

// Fetcher function for SWR
const fetchProfileData = async (userId) => {
    if (!userId) return null;

    const [profileRes, childrenRes, savedRes, likedRes, recipeCountRes, reportCountRes, userRestRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).single(),
        supabase.from('children').select('*').eq('user_id', userId),
        supabase.from('saved_recipes').select('recipe_id').eq('user_id', userId),
        supabase.from('likes').select('recipe_id').eq('user_id', userId).eq('reaction_type', 'yummy'),
        supabase.from('recipes').select('*', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('tried_reports').select('*', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('user_restaurants').select('restaurant_id, status').eq('user_id', userId),
    ]);

    const profileData = profileRes.data;
    const childrenData = childrenRes.data || [];
    const savedData = savedRes.data || [];
    const likedData = likedRes.data || [];
    const userRestData = userRestRes.data || [];

    return {
        profile: profileData ? {
            id: profileData.id,
            userName: profileData.username || profileData.display_name || '',
            avatarUrl: profileData.avatar_url || profileData.picture_url || '',
            children: childrenData,
            stats: {
                recipeCount: recipeCountRes.count || 0,
                reportCount: reportCountRes.count || 0
            },
            isPro: profileData.is_pro || false,
            bio: profileData.bio || '',
            instagramUrl: profileData.instagram_url || '',
            twitterUrl: profileData.twitter_url || '',
            youtubeUrl: profileData.youtube_url || '',
            blogUrl: profileData.blog_url || ''
        } : null,
        savedRecipeIds: savedData.map(item => item.recipe_id),
        likedRecipeIds: likedData.map(item => item.recipe_id),
        visitedRestaurantIds: userRestData.filter(i => i.status === 'visited').map(i => i.restaurant_id),
        wishlistRestaurantIds: userRestData.filter(i => i.status === 'wishlist').map(i => i.restaurant_id),
    };
};

export const useProfile = () => {
    const [user, setUser] = useState(null);
    const [isAuthLoading, setIsAuthLoading] = useState(true);
    const { addToast } = useToast();

    // Use SWR only if we have a user
    const { data: profileData, mutate: mutateProfile } = useSWR(
        user?.id ? ['profile', user.id] : null,
        ([, userId]) => fetchProfileData(userId),
        {
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
            dedupingInterval: 60000,
        }
    );

    const profile = profileData?.profile ?? null;
    const savedRecipeIds = profileData?.savedRecipeIds ?? [];
    const likedRecipeIds = profileData?.likedRecipeIds ?? [];
    const visitedRestaurantIds = profileData?.visitedRestaurantIds ?? [];
    const wishlistRestaurantIds = profileData?.wishlistRestaurantIds ?? [];

    const loading = isAuthLoading || (user && !profileData);

    useEffect(() => {
        let mounted = true;

        const getSession = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (mounted) {
                    setUser(session?.user ?? null);
                    setIsAuthLoading(false);
                }
            } catch (error) {
                console.error('Session check failed', error);
                if (mounted) setIsAuthLoading(false);
            }
        };

        getSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (mounted) {
                setUser(session?.user ?? null);
                if (!session) mutateProfile(null, false);
            }
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, [mutateProfile]);

    const fetchProfile = useCallback(async () => {
        if (user?.id) mutateProfile();
    }, [user?.id, mutateProfile]);

    const updateUserName = async (name) => {
        if (!user) return;
        try {
            const { error } = await supabase.from('profiles').update({ username: name, display_name: name, updated_at: new Date() }).eq('id', user.id);
            if (error) throw error;
            mutateProfile();
            addToast('名前を更新しました', 'success');
        } catch (error) { addToast('更新に失敗しました', 'error'); }
    };

    const updateAvatar = async (file) => {
        if (!user || !file) return;
        try {
            const publicUrl = await uploadImage(file, 'recipe-images');
            const { error } = await supabase.from('profiles').update({ avatar_url: publicUrl, updated_at: new Date() }).eq('id', user.id);
            if (error) throw error;
            mutateProfile();
            addToast('アイコンを更新しました', 'success');
        } catch (error) { addToast('画像のアップロードに失敗しました', 'error'); }
    };

    const addChild = async (child) => {
        if (!user) return;
        try {
            const { error } = await supabase.from('children').insert({ user_id: user.id, name: child.name, icon: child.icon, photo: child.photo, allergens: child.allergens || [] });
            if (error) throw error;
            mutateProfile();
            addToast('お子様を登録しました', 'success');
        } catch (error) { addToast('登録に失敗しました', 'error'); }
    };

    const updateChild = async (id, updatedChild) => {
        try {
            const { error } = await supabase.from('children').update({ name: updatedChild.name, icon: updatedChild.icon, photo: updatedChild.photo, allergens: updatedChild.allergens }).eq('id', id);
            if (error) throw error;
            mutateProfile();
            addToast('お子様の情報を更新しました', 'success');
        } catch (error) { addToast('更新に失敗しました', 'error'); }
    };

    const deleteChild = async (id) => {
        try {
            const { error } = await supabase.from('children').delete().eq('id', id);
            if (error) throw error;
            mutateProfile();
            addToast('削除しました', 'success');
        } catch (error) { addToast('削除に失敗しました', 'error'); }
    };

    const toggleSave = async (recipeId) => {
        if (!user) return addToast('保存するにはログインが必要です', 'info');
        const wasSaved = savedRecipeIds.includes(recipeId);
        try {
            if (wasSaved) await supabase.from('saved_recipes').delete().eq('user_id', user.id).eq('recipe_id', recipeId);
            else await supabase.from('saved_recipes').insert({ user_id: user.id, recipe_id: recipeId });
            mutateProfile();
        } catch (error) { addToast('操作に失敗しました', 'error'); }
    };

    const toggleLike = async (recipeId) => {
        if (!user) return addToast('アクションにはログインが必要です', 'info');
        const wasLiked = likedRecipeIds.includes(recipeId);
        try {
            if (wasLiked) await supabase.from('likes').delete().eq('user_id', user.id).eq('recipe_id', recipeId).eq('reaction_type', 'yummy');
            else await supabase.from('likes').insert({ user_id: user.id, recipe_id: recipeId, reaction_type: 'yummy' });
            mutateProfile();
        } catch (error) { addToast('操作に失敗しました', 'error'); }
    };

    const deleteAccount = async () => {
        if (!user) return;
        try {
            const response = await fetch('/api/account/delete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user.id }) });
            if (!response.ok) throw new Error('Account deletion failed');
            await supabase.auth.signOut();
            addToast('アカウントを削除しました', 'success');
        } catch (error) { addToast('アカウント削除に失敗しました', 'error'); }
    };

    const updateProProfile = async ({ bio, instagramUrl, twitterUrl, youtubeUrl, blogUrl }) => {
        if (!user) return;
        try {
            const { error } = await supabase.from('profiles').update({ bio, instagram_url: instagramUrl, twitter_url: twitterUrl, youtube_url: youtubeUrl, blog_url: blogUrl, updated_at: new Date() }).eq('id', user.id);
            if (error) throw error;
            mutateProfile();
            addToast('プロフィールを更新しました', 'success');
        } catch (error) { addToast('更新に失敗しました', 'error'); }
    };

    const toggleUserRestaurant = async (restaurantId, status) => {
        if (!user) return addToast('ログインが必要です', 'info');
        const isCurrentlyInStatus = (status === 'visited' ? visitedRestaurantIds : wishlistRestaurantIds).includes(restaurantId);
        try {
            if (isCurrentlyInStatus) await supabase.from('user_restaurants').delete().eq('user_id', user.id).eq('restaurant_id', restaurantId).eq('status', status);
            else await supabase.from('user_restaurants').insert({ user_id: user.id, restaurant_id: restaurantId, status, visited_at: status === 'visited' ? new Date().toISOString() : null });
            mutateProfile();
            addToast(status === 'visited' ? '来店済みリストを更新しました' : '行きたいリストを更新しました', 'success');
        } catch (error) { addToast('エラーが発生しました', 'error'); }
    };

    return {
        user, profile, loading, savedRecipeIds, likedRecipeIds, visitedRestaurantIds, wishlistRestaurantIds,
        updateUserName, updateAvatar, addChild, updateChild, deleteChild, toggleSave, toggleLike, toggleUserRestaurant, deleteAccount, updateProProfile
    };
};
