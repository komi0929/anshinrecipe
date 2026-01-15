'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export const MenuGallery = ({ restaurantId }) => {
    const [photos, setPhotos] = useState([]);

    useEffect(() => {
        const fetchPhotos = async () => {
            // Fetch reviews that contain images
            const { data } = await supabase
                .from('reviews')
                .select('id, images, menu_id, custom_menu_name, menus(name)')
                .eq('restaurant_id', restaurantId)
                .not('images', 'is', null) // Filter where images is not null
            // Note: 'images' is JSONB[], filtering for non-empty requires improved query or client side filter if array is empty.
            // Checking length > 0 in PostgREST is tricky depending on version. 
            // We will filter client side for MVP safety.

            if (data) {
                // Flatten: Review -> [Image1, Image2] -> Gallery Items
                const allPhotos = data.flatMap(review => {
                    if (!review.images || review.images.length === 0) return [];
                    return review.images.map(imgUrl => ({
                        reviewId: review.id,
                        url: imgUrl,
                        menuName: review.menus?.name || review.custom_menu_name || 'メニュー'
                    }));
                });
                setPhotos(allPhotos);
            }
        };
        fetchPhotos();
    }, [restaurantId]);

    if (photos.length === 0) return (
        <div className="py-20 text-center text-slate-400 bg-slate-50 rounded-2xl">
            <p>写真がまだありません 📸</p>
        </div>
    );

    return (
        <div className="grid grid-cols-3 gap-1 sm:gap-2">
            {photos.map((photo, i) => (
                <div key={i} className="aspect-square relative group overflow-hidden bg-slate-100">
                    <img
                        src={photo.url}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        alt={photo.menuName}
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                        <span className="text-white text-xs font-bold truncate w-full">
                            {photo.menuName}
                        </span>
                    </div>
                </div>
            ))}
        </div>
    );
};
