import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/Toast';
import { uploadImage } from '@/lib/imageUpload';

export const useProfile = () => {
    const [profile, setProfile] = useState({
        id: null,
        userName: '',
        avatarUrl: '',
        children: [],
        stats: { recipeCount: 0, reportCount: 0 }
    });
    const [savedRecipeIds, setSavedRecipeIds] = useState([]);
    const [likedRecipeIds, setLikedRecipeIds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const { addToast } = useToast();

    useEffect(() => {
        // Get current session
        const getSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setUser(session?.user ?? null);
            if (session?.user) {
                await fetchProfile(session.user.id);
            } else {
                setLoading(false);
            }
        };

        getSession();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchProfile(session.user.id);
            } else {
                setProfile({ id: null, userName: '', avatarUrl: '', children: [] });
                setSavedRecipeIds([]);
                setLikedRecipeIds([]);
                setLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const fetchProfile = async (userId) => {
        try {
            setLoading(true);

            // Fetch profile
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (profileError && profileError.code !== 'PGRST116') throw profileError;

            // Fetch children
            const { data: childrenData, error: childrenError } = await supabase
                .from('children')
                .select('*')
                .eq('user_id', userId);

            if (childrenError) throw childrenError;

            // Fetch saved recipes
            const { data: savedData, error: savedError } = await supabase
                .from('saved_recipes')
                .select('recipe_id')
                .eq('user_id', userId);

            // Ignore error for saved recipes (table might not exist yet if migration not run)
            if (!savedError && savedData) {
                setSavedRecipeIds(savedData.map(item => item.recipe_id));
            }

            // Fetch liked recipes (reaction_type = 'yummy')
            const { data: likedData, error: likedError } = await supabase
                .from('likes')
                .select('recipe_id')
                .eq('user_id', userId)
                .eq('reaction_type', 'yummy');

            if (!likedError && likedData) {
                setLikedRecipeIds(likedData.map(item => item.recipe_id));
            }

            // Fetch stats (recipes count)
            const { count: recipeCount, error: recipeCountError } = await supabase
                .from('recipes')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', userId);

            // Fetch stats (tried reports count)
            const { count: reportCount, error: reportCountError } = await supabase
                .from('tried_reports')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', userId);

            if (profileData) {
                setProfile({
                    id: profileData.id,
                    userName: profileData.display_name || profileData.username || '',
                    avatarUrl: profileData.avatar_url || profileData.picture_url || '',
                    children: childrenData || [],
                    stats: {
                        recipeCount: recipeCount || 0,
                        reportCount: reportCount || 0
                    }
                });
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
            addToast('プロフィールの取得に失敗しました', 'error');
        } finally {
            setLoading(false);
        }
    };

    const updateUserName = async (name) => {
        if (!user) return;
        try {
            const { error } = await supabase
                .from('profiles')
                .upsert({ id: user.id, username: name, updated_at: new Date() });

            if (error) throw error;
            setProfile(prev => ({ ...prev, userName: name }));
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

            setProfile(prev => ({ ...prev, avatarUrl: publicUrl }));
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

            setProfile(prev => ({
                ...prev,
                children: [...prev.children, data]
            }));
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

            setProfile(prev => ({
                ...prev,
                children: prev.children.map(c => c.id === id ? { ...c, ...updatedChild } : c)
            }));
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

            setProfile(prev => ({
                ...prev,
                children: prev.children.filter(c => c.id !== id)
            }));
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

                setSavedRecipeIds(prev => prev.filter(id => id !== recipeId));
            } else {
                // Insert
                const { error } = await supabase
                    .from('saved_recipes')
                    .insert({ user_id: user.id, recipe_id: recipeId });

                if (error) throw error;

                setSavedRecipeIds(prev => [...prev, recipeId]);

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

                setLikedRecipeIds(prev => prev.filter(id => id !== recipeId));
            } else {
                const { error } = await supabase
                    .from('likes')
                    .insert({
                        user_id: user.id,
                        recipe_id: recipeId,
                        reaction_type: 'yummy'
                    });

                if (error) throw error;

                setLikedRecipeIds(prev => [...prev, recipeId]);

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

            // 1. Delete children
            const { error: childError } = await supabase
                .from('children')
                .delete()
                .eq('user_id', user.id);
            if (childError) console.error('Error deleting children:', childError);

            // 2. Delete saved recipes
            const { error: savedError } = await supabase
                .from('saved_recipes')
                .delete()
                .eq('user_id', user.id);
            if (savedError) console.error('Error deleting saved recipes:', savedError);

            // 3. Delete likes
            const { error: likesError } = await supabase
                .from('likes')
                .delete()
                .eq('user_id', user.id);
            if (likesError) console.error('Error deleting likes:', likesError);

            // 4. Delete user's recipes
            const { error: recipeError } = await supabase
                .from('recipes')
                .delete()
                .eq('user_id', user.id);
            if (recipeError) console.error('Error deleting recipes:', recipeError);

            // 5. Delete profile
            const { error: profileError } = await supabase
                .from('profiles')
                .delete()
                .eq('id', user.id);
            if (profileError) console.error('Error deleting profile:', profileError);

            // 6. Sign out
            await supabase.auth.signOut();

            // State cleanup happens in onAuthStateChange
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

