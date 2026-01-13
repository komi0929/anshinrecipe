'use client';

import React, { useState } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';
import { useRouter } from 'next/navigation';

const FUKUOKA_CENTER = { lat: 33.5902, lng: 130.4017 };

// Restaurants passed from parent (filtered)
export const MapContainer = ({ restaurants = [] }) => {
    // Ideally, get from env. 
    // If missing, simple fallback UI or mock mode.
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    const router = useRouter();

    if (!apiKey) {
        // Mock Map Implementation when API Key is missing
        return (
            <div className="relative w-full h-full bg-gray-100 overflow-hidden">
                <div className="absolute inset-4 bg-white/80 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center text-center p-6 z-10 shadow-sm border border-gray-200">
                    <p className="font-bold text-gray-800 mb-2">Google Maps APIキー未設定</p>
                    <p className="text-gray-500 text-xs mb-4">
                        開発モード用ダミーマップを表示中。<br />
                        以下の店舗ピンはクリック可能です。
                    </p>
                    <div className="space-y-2 w-full max-w-xs">
                        {restaurants.length === 0 ? <p>条件に合う店舗がありません</p> : restaurants.map(r => (
                            <button
                                key={r.place_id || r.id}
                                onClick={() => router.push(`/map/${r.id || r.place_id}`)}
                                className="w-full p-3 bg-white border border-gray-200 rounded-lg shadow-sm flex items-center gap-3 hover:bg-orange-50 transition-colors text-left"
                            >
                                <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold shrink-0">
                                    {r.name[0]}
                                </div>
                                <div className="min-w-0">
                                    <p className="font-bold text-sm truncate">{r.name}</p>
                                    <p className="text-xs text-gray-500 truncate">{r.address}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10" style={{
                    backgroundImage: 'radial-gradient(#CBD5E1 1px, transparent 1px)',
                    backgroundSize: '20px 20px'
                }}></div>
            </div>
        );
    }

    return (
        <APIProvider apiKey={apiKey}>
            <Map
                defaultCenter={FUKUOKA_CENTER}
                defaultZoom={13}
                gestureHandling={'greedy'}
                disableDefaultUI={true}
                mapId={'anshin-map-id'}
                className="w-full h-full"
            >
                {restaurants.map((restaurant) => (
                    <AdvancedMarker
                        key={restaurant.id || restaurant.place_id}
                        position={{ lat: restaurant.lat, lng: restaurant.lng }}
                        onClick={() => router.push(`/map/${restaurant.id || restaurant.place_id}`)}
                    >
                        <Pin
                            background={'#F97316'}
                            glyphColor={'#FFF'}
                            borderColor={'#FFF'}
                            scale={1.2}
                        />
                    </AdvancedMarker>
                ))}
            </Map>
        </APIProvider>
    );
};
