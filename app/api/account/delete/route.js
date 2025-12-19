import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'fallback_key_for_build';

// Create Supabase admin client for server-side operations (bypasses RLS)
const supabaseAdmin = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

export async function POST(request) {
    try {
        const { userId } = await request.json();

        if (!userId) {
            return Response.json({ error: 'Missing userId' }, { status: 400 });
        }

        console.log('Starting account deletion for user:', userId);

        // Helper function to extract file name from Supabase storage URL
        const extractFileName = (url) => {
            if (!url) return null;
            try {
                const urlParts = url.split('/');
                return urlParts[urlParts.length - 1];
            } catch {
                return null;
            }
        };

        // 1. Get user's profile for avatar URL
        const { data: profileData } = await supabaseAdmin
            .from('profiles')
            .select('avatar_url')
            .eq('id', userId)
            .single();

        // 2. Get user's children for their photos
        const { data: childrenData } = await supabaseAdmin
            .from('children')
            .select('photo')
            .eq('user_id', userId);

        // 3. Get user's recipes for image cleanup
        const { data: userRecipes } = await supabaseAdmin
            .from('recipes')
            .select('id, image_url')
            .eq('user_id', userId);

        console.log('User data found - Profile:', !!profileData, 'Children:', childrenData?.length || 0, 'Recipes:', userRecipes?.length || 0);

        // 4. Delete notifications (both as recipient and actor)
        await supabaseAdmin
            .from('notifications')
            .delete()
            .eq('recipient_id', userId);

        await supabaseAdmin
            .from('notifications')
            .delete()
            .eq('actor_id', userId);

        console.log('Notifications deleted');

        // 5. If user has recipes, delete all related data
        if (userRecipes?.length) {
            const recipeIds = userRecipes.map(r => r.id);

            // Delete notifications about these recipes
            await supabaseAdmin
                .from('notifications')
                .delete()
                .in('recipe_id', recipeIds);

            // Delete likes on these recipes
            await supabaseAdmin
                .from('likes')
                .delete()
                .in('recipe_id', recipeIds);

            // Delete saved_recipes for these recipes
            await supabaseAdmin
                .from('saved_recipes')
                .delete()
                .in('recipe_id', recipeIds);

            // Delete tried_reports on these recipes
            await supabaseAdmin
                .from('tried_reports')
                .delete()
                .in('recipe_id', recipeIds);

            // Delete recipe_images
            await supabaseAdmin
                .from('recipe_images')
                .delete()
                .in('recipe_id', recipeIds);

            // Delete cooking_logs
            await supabaseAdmin
                .from('cooking_logs')
                .delete()
                .in('recipe_id', recipeIds);

            console.log('Recipe-related data deleted');
        }

        // 6. Delete tried_reports by this user
        await supabaseAdmin
            .from('tried_reports')
            .delete()
            .eq('user_id', userId);

        // 7. Delete report_likes by this user
        await supabaseAdmin
            .from('report_likes')
            .delete()
            .eq('user_id', userId);

        // 8. Delete children
        await supabaseAdmin
            .from('children')
            .delete()
            .eq('user_id', userId);

        // 9. Delete saved_recipes by this user
        await supabaseAdmin
            .from('saved_recipes')
            .delete()
            .eq('user_id', userId);

        // 10. Delete likes by this user
        await supabaseAdmin
            .from('likes')
            .delete()
            .eq('user_id', userId);

        // 11. Delete user's recipes
        await supabaseAdmin
            .from('recipes')
            .delete()
            .eq('user_id', userId);

        console.log('User data deleted');

        // 12. Delete profile
        await supabaseAdmin
            .from('profiles')
            .delete()
            .eq('id', userId);

        console.log('Profile deleted');

        // 13. Delete storage files
        try {
            // Delete avatar image
            if (profileData?.avatar_url) {
                const avatarFileName = extractFileName(profileData.avatar_url);
                if (avatarFileName) {
                    await supabaseAdmin.storage.from('recipe-images').remove([avatarFileName]);
                    console.log('Avatar deleted:', avatarFileName);
                }
            }

            // Delete recipe images
            if (userRecipes?.length) {
                const recipeImageFiles = userRecipes
                    .map(r => extractFileName(r.image_url))
                    .filter(Boolean);
                if (recipeImageFiles.length > 0) {
                    await supabaseAdmin.storage.from('recipe-images').remove(recipeImageFiles);
                    console.log('Recipe images deleted:', recipeImageFiles.length);
                }
            }

            // Delete children photos
            if (childrenData?.length) {
                const childPhotoFiles = childrenData
                    .map(c => extractFileName(c.photo))
                    .filter(Boolean);
                if (childPhotoFiles.length > 0) {
                    await supabaseAdmin.storage.from('child-photos').remove(childPhotoFiles);
                    await supabaseAdmin.storage.from('recipe-images').remove(childPhotoFiles);
                    console.log('Child photos deleted:', childPhotoFiles.length);
                }
            }
        } catch (storageError) {
            console.error('Error deleting storage files:', storageError);
            // Continue even if storage cleanup fails
        }

        // 14. Delete auth user (this will cascade delete the session)
        const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
        if (authDeleteError) {
            console.error('Error deleting auth user:', authDeleteError);
            // Don't fail the whole operation if auth user deletion fails
        } else {
            console.log('Auth user deleted');
        }

        console.log('Account deletion completed successfully');

        return Response.json({ success: true });

    } catch (error) {
        console.error('Account deletion error:', error);
        return Response.json({ error: 'Internal server error' }, { status: 500 });
    }
}
