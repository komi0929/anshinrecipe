import { useState, useEffect, useCallback } from 'react';
import useSWR from 'swr';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/Toast';
import { uploadImage } from '@/lib/imageUpload';

// Global cache for auth session to prevent refetching
let cachedSession = null;
let sessionInitialized = false;

// Fetcher function for SWR
const fetchProfileData = async (userId) => {
    if (!userId) return null;

    const [profileRes, childrenRes, savedRes, likedRes, recipeCountRes, reportCountRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).single(),
        supabase.from('children').select('*').eq('user_id', userId),
        supabase.from('saved_recipes').select('recipe_id').eq('user_id', userId),
        supabase.from('likes').select('recipe_id').eq('user_id', userId).eq('reaction_type', 'yummy'),
        supabase.from('recipes').select('*', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('tried_reports').select('*', { count: 'exact', head: true }).eq('user_id', userId),
    ]);

    const profileData = profileRes.data;
    const childrenData = childrenRes.data || [];
    const savedData = savedRes.data || [];
    const likedData = likedRes.data || [];

    return {
        profile: profileData ? {
            id: profileData.id,
            userName: profileData.display_name || profileData.username || '',
            avatarUrl: profileData.avatar_url || profileData.picture_url || '',
            children: childrenData,
            stats: {
                recipeCount: recipeCountRes.count || 0,
                reportCount: reportCountRes.count || 0
            }
        } : { id: null, userName: '', avatarUrl: '', children: [], stats: { recipeCount: 0, reportCount: 0 } },
        savedRecipeIds: savedData.map(item => item.recipe_id),
        likedRecipeIds: likedData.map(item => item.recipe_id),
    };
};

export const useProfile = () => {
    const [user, setUser] = useState(cachedSession?.user ?? null);
    const [initializing, setInitializing] = useState(!sessionInitialized);
    const { addToast } = useToast();

    // Use SWR for profile data - returns cached data immediately
    const { data: profileData, mutate: mutateProfile, isLoading: swrLoading } = useSWR(
        user?.id ? ['profile', user.id] : null,
        ([, userId]) => fetchProfileData(userId),
        {
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
            dedupingInterval: 60000, // 1 minute cache
        }
    );

    // Derived state from SWR
    const profile = profileData?.profile ?? { id: null, userName: '', avatarUrl: '', children: [], stats: { recipeCount: 0, reportCount: 0 } };
    const savedRecipeIds = profileData?.savedRecipeIds ?? [];
    const likedRecipeIds = profileData?.likedRecipeIds ?? [];

    // Loading is only true during initial auth check, not SWR refetch
    const loading = initializing || (user && !profileData && swrLoading);

    useEffect(() => {
        // Get current session - use cached if available
        const getSession = async () => {
            if (sessionInitialized && cachedSession) {
                setUser(cachedSession.user);
                setInitializing(false);
                return;
            }

            const { data: { session } } = await supabase.auth.getSession();
            cachedSession = session;
            sessionInitialized = true;
            setUser(session?.user ?? null);
            setInitializing(false);
        };

        getSession();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            cachedSession = session;
            setUser(session?.user ?? null);
            if (!session) {
                mutateProfile(null, false); // Clear cache on logout
            }
        });

        return () => subscription.unsubscribe();
    }, [mutateProfile]);

    // fetchProfile is now just a cache refresh trigger
    const fetchProfile = useCallback(async () => {
        if (user?.id) {
            mutateProfile();
        }
    }, [user?.id, mutateProfile]);

    const updateUserName = async (name) => {
        if (!user) return;
        try {
            const { error } = await supabase
                .from('profiles')
                .upsert({ id: user.id, username: name, updated_at: new Date() });

            if (error) throw error;
            mutateProfile(prev => prev ? { ...prev, profile: { ...prev.profile, userName: name } } : prev, false);
            addToast('名前を更新しました', 'success');
        } catch (error) {
            console.error('Error updating profile:', error);
            addToast('更新に失敗しました', 'error');
        }
    };

    const updateAvatar = async (file) => {
        if (!user || !file) return;
        try {
            const publicUrl = await uploadImage(file, 'recipe-images'); // Using recipe-images as default shared bucket

            const { error } = await supabase
                .from('profiles')
                .update({ avatar_url: publicUrl, updated_at: new Date() })
                .eq('id', user.id);

            if (error) throw error;

            mutateProfile(prev => prev ? { ...prev, profile: { ...prev.profile, avatarUrl: publicUrl } } : prev, false);
            addToast('アイコンを更新しました', 'success');
        } catch (error) {
            console.error('Error updating avatar:', error);
            addToast('画像のアップロードに失敗しました', 'error');
        }
    };

    const addChild = async (child) => {
        if (!user) return;
        try {
            // Convert allergens array if needed (assuming child.allergens is already an array)
            const newChild = {
                user_id: user.id,
                name: child.name,
                icon: child.icon,
                photo: child.photo, // Add photo URL support
                allergens: child.allergens || []
            };

            const { data, error } = await supabase
                .from('children')
                .insert(newChild)
                .select()
                .single();

            if (error) throw error;

            mutateProfile(prev => prev ? { ...prev, profile: { ...prev.profile, children: [...prev.profile.children, data] } } : prev, false);
            addToast('お子様を登録しました', 'success');
        } catch (error) {
            console.error('Error adding child:', error);
            addToast('登録に失敗しました', 'error');
        }
    };

    const updateChild = async (id, updatedChild) => {
        try {
            const { error } = await supabase
                .from('children')
                .update({
                    name: updatedChild.name,
                    icon: updatedChild.icon,
                    photo: updatedChild.photo,
                    allergens: updatedChild.allergens
                })
                .eq('id', id);

            if (error) throw error;

            mutateProfile(prev => prev ? { ...prev, profile: { ...prev.profile, children: prev.profile.children.map(c => c.id === id ? { ...c, ...updatedChild } : c) } } : prev, false);
            addToast('お子様の情報を更新しました', 'success');
        } catch (error) {
            console.error('Error updating child:', error);
            addToast('更新に失敗しました', 'error');
        }
    };

    const deleteChild = async (id) => {
        try {
            const { error } = await supabase
                .from('children')
                .delete()
                .eq('id', id);

            if (error) throw error;

            mutateProfile(prev => prev ? { ...prev, profile: { ...prev.profile, children: prev.profile.children.filter(c => c.id !== id) } } : prev, false);
            addToast('削除しました', 'success');
        } catch (error) {
            console.error('Error deleting child:', error);
            addToast('削除に失敗しました', 'error');
        }
    };

    const toggleSave = async (recipeId) => {
        if (!user) {
            addToast('保存するにはログインが必要です', 'info');
            return;
        }

        const isSaved = savedRecipeIds.includes(recipeId);

        try {
            if (isSaved) {
                // Delete
                const { error } = await supabase
                    .from('saved_recipes')
                    .delete()
                    .eq('user_id', user.id)
                    .eq('recipe_id', recipeId);

                if (error) throw error;

                mutateProfile(prev => prev ? { ...prev, savedRecipeIds: prev.savedRecipeIds.filter(id => id !== recipeId) } : prev, false);
            } else {
                // Insert
                const { error } = await supabase
                    .from('saved_recipes')
                    .insert({ user_id: user.id, recipe_id: recipeId });

                if (error) throw error;

                mutateProfile(prev => prev ? { ...prev, savedRecipeIds: [...prev.savedRecipeIds, recipeId] } : prev, false);

                // NOTIFICATION LOGIC
                // Fetch recipe owner
                const { data: recipe } = await supabase
                    .from('recipes')
                    .select('user_id')
                    .eq('id', recipeId)
                    .single();

                if (recipe && recipe.user_id !== user.id) {
                    await supabase.from('notifications').insert({
                        recipient_id: recipe.user_id,
                        actor_id: user.id,
                        type: 'save',
                        recipe_id: recipeId
                    });
                }
            }
        } catch (error) {
            console.error('Error toggling save:', error);
            addToast('操作に失敗しました', 'error');
        }
    };

    const toggleLike = async (recipeId) => {
        if (!user) {
            addToast('アクションにはログインが必要です', 'info');
            return;
        }

        const isLiked = likedRecipeIds.includes(recipeId);

        try {
            if (isLiked) {
                const { error } = await supabase
                    .from('likes')
                    .delete()
                    .eq('user_id', user.id)
                    .eq('recipe_id', recipeId)
                    .eq('reaction_type', 'yummy');

                if (error) throw error;

                mutateProfile(prev => prev ? { ...prev, likedRecipeIds: prev.likedRecipeIds.filter(id => id !== recipeId) } : prev, false);
            } else {
                const { error } = await supabase
                    .from('likes')
                    .insert({
                        user_id: user.id,
                        recipe_id: recipeId,
                        reaction_type: 'yummy'
                    });

                if (error) throw error;

                mutateProfile(prev => prev ? { ...prev, likedRecipeIds: [...prev.likedRecipeIds, recipeId] } : prev, false);

                // NOTIFICATION LOGIC
                const { data: recipe } = await supabase
                    .from('recipes')
                    .select('user_id')
                    .eq('id', recipeId)
                    .single();

                if (recipe && recipe.user_id !== user.id) {
                    await supabase.from('notifications').insert({
                        recipient_id: recipe.user_id,
                        actor_id: user.id,
                        type: 'like',
                        recipe_id: recipeId
                    });
                }
            }
        } catch (error) {
            console.error('Error toggling like:', error);
        }
    }


    const deleteAccount = async () => {
        if (!user) return;

        try {
            setLoading(true);

            console.log('Calling account deletion API for user:', user.id);

            // Call server-side API that uses service role to bypass RLS
            const response = await fetch('/api/account/delete', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userId: user.id }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Account deletion failed');
            }

            console.log('Account deletion API response:', result);

            // Sign out locally (auth user is already deleted on server)
            await supabase.auth.signOut();

            addToast('アカウントを削除しました', 'success');
        } catch (error) {
            console.error('Error deleting account:', error);
            addToast('アカウント削除に失敗しました', 'error');
        } finally {
            setLoading(false);
        }
    };

    return {
        user,
        profile,
        loading,
        savedRecipeIds,
        likedRecipeIds,
        updateUserName,
        updateAvatar,
        addChild,
        updateChild,
        deleteChild,
        toggleSave,
        toggleLike,
        deleteAccount
    };
};

