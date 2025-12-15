import { supabase } from '@/lib/supabaseClient';

/**
 * Upload image to Supabase Storage
 * @param {File} file - Image file to upload
 * @param {string} bucket - Storage bucket name (default: 'recipe-images')
 * @returns {Promise<string>} - Public URL of uploaded image
 */
export async function uploadImage(file, bucket = 'recipe-images') {
    if (!file) throw new Error('No file provided');

    try {
        // Generate unique filename
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${fileName}`;

        // Upload file
        const { data, error } = await supabase.storage
            .from(bucket)
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (error) throw error;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from(bucket)
            .getPublicUrl(filePath);

        return publicUrl;
    } catch (error) {
        console.error('Error uploading image:', error);
        throw error;
    }
}

/**
 * Delete image from Supabase Storage
 * @param {string} url - Public URL of the image
 * @param {string} bucket - Storage bucket name (default: 'recipe-images')
 */
export async function deleteImage(url, bucket = 'recipe-images') {
    try {
        // Extract file path from URL
        const urlParts = url.split('/');
        const fileName = urlParts[urlParts.length - 1];

        const { error } = await supabase.storage
            .from(bucket)
            .remove([fileName]);

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Error deleting image:', error);
        throw error;
    }
}
