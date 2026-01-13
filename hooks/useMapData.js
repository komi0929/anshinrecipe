import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import seedData from '@/data/fukuoka_restaurants_seed.json';

// filters: { tags: [], allergens: [] }
// allergens: ['wheat', 'egg', 'milk'] -> Show restaurants that are SAFE for these (AND logic or OR logic? Usually AND for multiple allergies)
export const useMapData = (filters = {}) => {
    const [restaurants, setRestaurants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Initial Fetch
    useEffect(() => {
        const fetchRestaurants = async () => {
            try {
                setLoading(true);
                // Try fetching from DB
                const { data, error } = await supabase
                    .from('restaurants')
                    .select(`
                        *,
                        restaurant_compatibility(*),
                        menus(*)
                    `);

                if (error) throw error;

                if (data && data.length > 0) {
                    setRestaurants(data);
                } else {
                    console.log('Using seed data for map');
                    setRestaurants(seedData);
                }
            } catch (err) {
                console.warn('Map data fetch failed (using seed data):', err);
                setRestaurants(seedData);
            } finally {
                setLoading(false);
            }
        };

        fetchRestaurants();
    }, []);

    // Client-side Filtering Logic (Robust enough for Phase 1 scale)
    const filteredRestaurants = useMemo(() => {
        if (!restaurants) return [];

        return restaurants.filter(r => {
            // Text Search (Name or Address)
            if (filters.searchQuery) {
                const q = filters.searchQuery.toLowerCase();
                const matchName = r.name.toLowerCase().includes(q);
                const matchAddress = r.address.toLowerCase().includes(q);
                // Also search in menus
                const matchMenu = r.menus?.some(m => m.name.toLowerCase().includes(q));

                if (!matchName && !matchAddress && !matchMenu) return false;
            }

            // Allergen Filter (Exclusion logic)
            // If user selects "Wheat", they want "Wheat Free" (Safe from Wheat)
            if (filters.allergens && filters.allergens.length > 0) {
                // Check if restaurant is SAFE for ALL selected allergens
                const isSafe = filters.allergens.every(allergen => {
                    // Check Menu Level First (If any menu is safe) - "Menu-First"
                    // If a restaurant has a menu that DOES NOT contain the allergen, it is a candidate.
                    // However, rigorous safety usually means checking the restaurant compatibility status too.
                    // For "Discovery", if there is at least one menu without the allergen, we show it.

                    const hasSafeMenu = r.menus?.some(m =>
                        !m.allergens?.includes(allergen)
                    );

                    // Also check compatibility table for general safety
                    const comp = r.compatibility?.find(c => c.allergen === allergen);
                    const isRestSafe = comp?.status === 'safe' || comp?.status === 'removable';

                    return hasSafeMenu || isRestSafe;
                });

                if (!isSafe) return false;
            }

            return true;
        });
    }, [restaurants, filters]);

    const getRestaurantById = (id) => {
        return restaurants.find(r => r.id === id || r.place_id === id);
    };

    return {
        restaurants: filteredRestaurants, // Return filtered list
        allRestaurants: restaurants,      // Return all for reference if needed
        loading,
        error,
        getRestaurantById
    };
};
