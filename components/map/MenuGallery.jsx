import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { X, ZoomIn } from 'lucide-react';

export const MenuGallery = ({ restaurantId, images = [] }) => {
    const [photos, setPhotos] = useState([]);
    const [selectedPhoto, setSelectedPhoto] = useState(null);

    useEffect(() => {
        const fetchPhotos = async () => {
            // 1. Restaurant Level Images (pass from props)
            // Prioritize Google Maps or Official images
            const restaurantPhotos = images?.map(img => ({
                type: 'official',
                url: img.url || img, // Handle string or object
                menuName: '店舗写真' // Generic label
            })) || [];

            // 2. Fetch Review Images
            const { data } = await supabase
                .from('reviews')
                .select('id, images, menu_id, custom_menu_name, menus(name)')
                .eq('restaurant_id', restaurantId)
                .not('images', 'is', null);

            let reviewPhotos = [];
            if (data) {
                reviewPhotos = data.flatMap(review => {
                    if (!review.images || review.images.length === 0) return [];
                    return review.images.map(imgUrl => ({
                        reviewId: review.id,
                        type: 'review',
                        url: imgUrl,
                        menuName: review.menus?.name || review.custom_menu_name || '投稿写真'
                    }));
                });
            }

            setPhotos([...restaurantPhotos, ...reviewPhotos]);
        };
        fetchPhotos();
    }, [restaurantId, images]);

    if (photos.length === 0) return (
        <div className="py-20 text-center text-slate-400 bg-slate-50 rounded-2xl">
            <p>写真がまだありません 📸</p>
        </div>
    );

    return (
        <>
            <div className="grid grid-cols-3 gap-1 sm:gap-2">
                {photos.map((photo, i) => (
                    <button
                        key={i}
                        onClick={() => setSelectedPhoto(photo)}
                        className="aspect-square relative group overflow-hidden bg-slate-100 rounded-lg"
                    >
                        <img
                            src={photo.url}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            alt={photo.menuName}
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                            <span className="text-white text-xs font-bold truncate w-full flex items-center gap-1">
                                {photo.type === 'official' ? '🏢' : '👤'} {photo.menuName}
                            </span>
                        </div>
                    </button>
                ))}
            </div>

            {/* Lightbox Modal */}
            {selectedPhoto && (
                <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setSelectedPhoto(null)}>
                    <button
                        className="absolute top-4 right-4 p-2 bg-white/10 rounded-full hover:bg-white/20 text-white transition-colors"
                        onClick={(e) => { e.stopPropagation(); setSelectedPhoto(null); }}
                    >
                        <X size={24} />
                    </button>

                    <div className="relative max-w-4xl w-full max-h-[80vh]" onClick={e => e.stopPropagation()}>
                        <img
                            src={selectedPhoto.url}
                            className="w-full h-full object-contain rounded-lg shadow-2xl"
                            alt={selectedPhoto.menuName}
                        />
                        <div className="absolute bottom-[-3rem] left-0 text-white">
                            <p className="font-bold text-lg">{selectedPhoto.menuName}</p>
                            <p className="text-sm opacity-70">
                                {selectedPhoto.type === 'official' ? 'Google Maps / 公式サイト' : 'ユーザー投稿'}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
