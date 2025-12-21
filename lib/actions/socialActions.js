import { supabase } from '@/lib/supabaseClient';

/**
 * Create a new tried report
 */
export async function createTriedReport(recipeId, data, userId) {
    if (!userId) throw new Error('User must be logged in');

    try {
        const { data: report, error } = await supabase
            .from('tried_reports')
            .insert({
                user_id: userId,
                recipe_id: recipeId,
                image_url: data.imageUrl || null,
                comment: data.comment || null
            })
            .select(`
                *,
                profiles:user_id (
                    username,
                    display_name,
                    avatar_url
                )
            `)
            .single();

        if (error) throw error;

        // NOTIFICATION LOGIC
        // Fetch recipe owner
        const { data: recipe } = await supabase
            .from('recipes')
            .select('user_id')
            .eq('id', recipeId)
            .single();

        if (recipe && recipe.user_id !== userId) {
            await supabase.from('notifications').insert({
                recipient_id: recipe.user_id,
                actor_id: userId,
                type: 'report',
                recipe_id: recipeId
            });
        }

        return {
            ...report,
            userId: report.user_id,
            recipeId: report.recipe_id,
            imageUrl: report.image_url,
            createdAt: report.created_at,
            author: report.profiles
        };
    } catch (error) {
        console.error('Error creating tried report:', error);
        throw error;
    }
}

/**
 * Get all tried reports for a recipe
 */
export async function getTriedReports(recipeId) {
    try {
        const { data, error } = await supabase
            .from('tried_reports')
            .select(`
                *,
                profiles:user_id (
                    username,
                    display_name,
                    avatar_url
                )
            `)
            .eq('recipe_id', recipeId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return (data || []).map(r => ({
            ...r,
            userId: r.user_id,
            recipeId: r.recipe_id,
            imageUrl: r.image_url,
            createdAt: r.created_at,
            author: r.profiles
        }));
    } catch (error) {
        console.error('Error fetching tried reports:', error);
        return [];
    }
}

/**
 * Delete a tried report
 */
export async function deleteTriedReport(reportId, userId) {
    if (!userId) throw new Error('User must be logged in');

    try {
        const { error } = await supabase
            .from('tried_reports')
            .delete()
            .eq('id', reportId)
            .eq('user_id', userId);

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Error deleting tried report:', error);
        throw error;
    }
}

/**
 * Get reaction counts for a recipe
 */
export async function getReactionCounts(recipeId) {
    try {
        // Fallback: Fetch all reactions for this recipe and count them manually
        // This is safe for MVP scale. For production with millions of likes, we need RPC.
        const { data, error } = await supabase
            .from('likes')
            .select('reaction_type')
            .eq('recipe_id', recipeId);

        if (error) throw error;

        const counts = {
            yummy: 0,
            helpful: 0,
            ate_it: 0
        };

        (data || []).forEach(row => {
            if (counts[row.reaction_type] !== undefined) {
                counts[row.reaction_type]++;
            }
        });

        return counts;
    } catch (error) {
        console.error('Error getting reaction counts:', error);
        return { yummy: 0, helpful: 0, ate_it: 0 };
    }
}

/**
 * Get user's current reaction for a recipe
 */
export async function getUserReaction(recipeId, userId) {
    if (!userId) return null;

    try {
        const { data, error } = await supabase
            .from('likes')
            .select('reaction_type')
            .eq('recipe_id', recipeId)
            .eq('user_id', userId)
            .single();

        if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
        return data?.reaction_type || null;
    } catch (error) {
        console.error('Error getting user reaction:', error);
        return null;
    }
}

/**
 * Toggle reaction (add, change, or remove)
 */
export async function toggleReaction(recipeId, reactionType, userId) {
    if (!userId) throw new Error('User must be logged in');

    try {
        // Check if user already has a reaction
        const { data: existing } = await supabase
            .from('likes')
            .select('reaction_type')
            .eq('recipe_id', recipeId)
            .eq('user_id', userId)
            .single();

        if (existing) {
            // If same reaction, remove it
            if (existing.reaction_type === reactionType) {
                const { error } = await supabase
                    .from('likes')
                    .delete()
                    .eq('recipe_id', recipeId)
                    .eq('user_id', userId);

                if (error) throw error;
                return null; // Removed
            } else {
                // Change to new reaction
                const { error } = await supabase
                    .from('likes')
                    .update({ reaction_type: reactionType })
                    .eq('recipe_id', recipeId)
                    .eq('user_id', userId);

                if (error) throw error;
                return reactionType; // Changed
            }
        } else {
            // Add new reaction
            const { error } = await supabase
                .from('likes')
                .insert({
                    recipe_id: recipeId,
                    user_id: userId,
                    reaction_type: reactionType
                });

            if (error) throw error;
            return reactionType; // Added
        }
    } catch (error) {
        console.error('Error toggling reaction:', error);
        throw error;
    }
}

/**
 * Toggle like for a tried report
 */
export async function toggleReportLike(reportId, userId) {
    if (!userId) throw new Error('User must be logged in');

    try {
        const { data: existing } = await supabase
            .from('report_likes')
            .select('id')
            .eq('report_id', reportId)
            .eq('user_id', userId)
            .single();

        if (existing) {
            await supabase
                .from('report_likes')
                .delete()
                .eq('id', existing.id);
            return false; // Unliked
        } else {
            await supabase
                .from('report_likes')
                .insert({
                    report_id: reportId,
                    user_id: userId
                });

            // NOTIFICATION: Notify report author about the like
            const { data: report } = await supabase
                .from('tried_reports')
                .select('user_id, recipe_id')
                .eq('id', reportId)
                .single();

            if (report && report.user_id !== userId) {
                await supabase.from('notifications').insert({
                    recipient_id: report.user_id,
                    actor_id: userId,
                    type: 'report_like',
                    recipe_id: report.recipe_id
                });
            }

            return true; // Liked
        }
    } catch (error) {
        console.error('Error toggling report like:', error);
        throw error;
    }
}

/**
 * Get like info for a report
 */
export async function getReportLikeInfo(reportId, userId) {
    try {
        const { count, error: countError } = await supabase
            .from('report_likes')
            .select('*', { count: 'exact', head: true })
            .eq('report_id', reportId);

        if (countError) throw countError;

        let isLiked = false;
        if (userId) {
            const { data, error: likeError } = await supabase
                .from('report_likes')
                .select('id')
                .eq('report_id', reportId)
                .eq('user_id', userId)
                .single();
            if (data) isLiked = true;
        }

        return { count: count || 0, isLiked };
    } catch (error) {
        console.error('Error getting report like info:', error);
        return { count: 0, isLiked: false };
    }
}
