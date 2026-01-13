'use client';

import React, { useState } from 'react';
import { MapContainer } from '@/components/map/MapContainer';
import { Search, Map as MapIcon, List, Check } from 'lucide-react';
import { useMapData } from '@/hooks/useMapData';
import { useRouter } from 'next/navigation';
import './MapPage.css';

// Wrapper for MapContainer to pass restaurants from hook
const MapContainerWrapper = ({ restaurants }) => {
    // We are expecting MapContainer to be updated to accept restaurants prop
    // OR we temporarily duplicate the logic here if editing `MapContainer.jsx` is complex
    // For now, let's assume `MapContainer.jsx` will be updated shortly after this file.
    return <MapContainer restaurants={restaurants} />
}

export default function MapPage() {
    const [viewMode, setViewMode] = useState('map'); // 'map' or 'list'
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedAllergens, setSelectedAllergens] = useState([]);
    const router = useRouter();

    // Use the hook with filters
    const { restaurants, loading } = useMapData({
        searchQuery,
        allergens: selectedAllergens
    });

    const toggleAllergen = (allergen) => {
        setSelectedAllergens(prev =>
            prev.includes(allergen)
                ? prev.filter(a => a !== allergen)
                : [...prev, allergen]
        );
    };

    const ALLERGENS = [
        { label: '小麦', value: 'wheat', icon: '🌾' },
        { label: '卵', value: 'egg', icon: '🥚' },
        { label: '乳', value: 'milk', icon: '🥛' },
        { label: 'ナッツ', value: 'nut', icon: '🥜' },
        { label: 'そば', value: 'soba', icon: '🍜' },
        { label: 'えび', value: 'shrimp', icon: '🦐' },
        { label: 'かに', value: 'crab', icon: '🦀' },
    ];

    const AllergenChip = ({ label, value, icon }) => (
        <button
            onClick={() => toggleAllergen(value)}
            className={`map-filter-chip ${selectedAllergens.includes(value) ? 'active' : ''}`}
        >
            <span className="text-lg">{icon}</span>
            <span className="font-bold text-sm text-gray-700">{label}なし</span>
            {selectedAllergens.includes(value) && <Check size={14} className="ml-1 text-orange-500" strokeWidth={3} />}
        </button>
    );

    const ListCard = ({ restaurant }) => (
        <div
            onClick={() => router.push(`/map/${restaurant.id || restaurant.place_id}`)}
            className="map-list-card"
        >
            <div className="card-image-container">
                {/* Use first menu image if available, else placeholder */}
                {restaurant.menus?.[0]?.image_url ? (
                    <img src={restaurant.menus[0].image_url} className="card-image" alt={restaurant.name} />
                ) : (
                    <div className="card-image-placeholder">🍳</div>
                )}
                {restaurant.menus?.length > 0 && (
                    <span className="menu-count-badge">
                        {restaurant.menus.length}品
                    </span>
                )}
            </div>
            <div className="card-content">
                <div className="flex justify-between items-start">
                    <h3 className="card-title">{restaurant.name}</h3>
                    <span className="card-rating">★ 4.5</span>
                </div>
                <p className="card-address">{restaurant.address}</p>

                {/* Show matched menus or top menus - HIGHLIGHT */}
                <div className="card-menu-highlight">
                    <span className="highlight-label">おすすめ:</span>
                    {restaurant.menus?.slice(0, 1).map((m, i) => (
                        <span key={i} className="menu-name">
                            {m.name}
                        </span>
                    ))}
                    {restaurant.menus?.length > 1 && <span className="more-count">+{restaurant.menus.length - 1}</span>}
                </div>

                <div className="card-tags">
                    {restaurant.tags?.slice(0, 3).map(t => (
                        <span key={t} className="tag-chip">
                            {t}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );

    return (
        <div className="map-page-container">
            {/* Search Bar - Floating */}
            <div className="map-search-bar-container">
                <div className="map-search-bar">
                    <Search className="map-search-icon" size={20} />
                    <input
                        type="text"
                        placeholder="エリア、店名、メニューで検索..."
                        className="map-search-input"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                {/* Quick Filters */}
                <div className="map-quick-filters">
                    {ALLERGENS.map(a => (
                        <AllergenChip key={a.value} {...a} />
                    ))}
                </div>
            </div>

            {/* Main Content */}
            <div className="map-content">
                {/* Map View - Visible on Mobile if mode=map, Always on Desktop */}
                <div className={`map-view-container ${viewMode === 'list' ? 'hidden-mobile' : ''}`}>
                    <MapContainerWrapper restaurants={restaurants} />
                </div>

                {/* List View - Visible on Mobile if mode=list, Always on Desktop */}
                <div className={`map-list-view ${viewMode === 'map' ? 'hidden-mobile' : ''}`}>
                    <div className="list-content-padding">
                        {loading ? (
                            <div className="loading-state">
                                <div className="spinner"></div>
                                <p>美味しいお店を探しています...</p>
                            </div>
                        ) : restaurants.length === 0 ? (
                            <div className="empty-state">
                                <div className="text-4xl mb-4">😢</div>
                                <p>条件に合うお店が見つかりませんでした</p>
                                <button onClick={() => { setSearchQuery(''); setSelectedAllergens([]) }} className="reset-btn">
                                    条件をリセット
                                </button>
                            </div>
                        ) : (
                            restaurants.map(r => (
                                <ListCard key={r.id || r.place_id} restaurant={r} />
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Floating Toggle (Mobile Only) */}
            <button
                className="map-view-toggle-btn mobile-only"
                onClick={() => setViewMode(prev => prev === 'map' ? 'list' : 'map')}
            >
                {viewMode === 'map' ? (
                    <>
                        <List size={20} strokeWidth={2.5} />
                        <span>リスト</span>
                    </>
                ) : (
                    <>
                        <MapIcon size={20} strokeWidth={2.5} />
                        <span>地図</span>
                    </>
                )}
            </button>
        </div>
    );
}
