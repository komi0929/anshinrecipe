import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabaseClient";

// filters: { tags: [], allergens: [], searchQuery: '' }
// allergens: ['wheat', 'egg', 'milk'] -> Show restaurants that are SAFE for these
export const useMapData = (filters = {}) => {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch from Supabase
  useEffect(() => {
    const fetchRestaurants = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch restaurants with their menus
        const { data, error: fetchError } = await supabase
          .from("restaurants")
          .select(
            `
                        *,
                        menus (*)
                    `,
          )
          .order("created_at", { ascending: false });

        if (fetchError) {
          throw fetchError;
        }

        // Transform data to match expected structure
        const transformedData = (data || []).map((restaurant) => ({
          ...restaurant,
          // Ensure compatibility array exists for filtering
          compatibility: restaurant.compatibility || [],
          // Ensure menus array exists
          menus: restaurant.menus || [],
          // Ensure features object exists
          features: restaurant.features || {},
          // Ensure tags array exists
          tags: restaurant.tags || [],
        }));

        setRestaurants(transformedData);
      } catch (err) {
        console.error("Error fetching restaurants:", err);
        setError(err.message);
        setRestaurants([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurants();
  }, []);

  // Client-side Filtering Logic (Robust enough for Phase 1 scale)
  const filteredRestaurants = useMemo(() => {
    if (!restaurants) return [];

    return restaurants.filter((r) => {
      // Text Search (Name or Address)
      if (filters.searchQuery) {
        const q = filters.searchQuery.toLowerCase();
        const matchName = r.name.toLowerCase().includes(q);
        const matchAddress = r.address.toLowerCase().includes(q);
        // Also search in menus
        const matchMenu = r.menus?.some((m) =>
          m.name.toLowerCase().includes(q),
        );

        if (!matchName && !matchAddress && !matchMenu) return false;
      }

      // Allergen Filter (Exclusion logic)
      // If user selects "Wheat", they want "Wheat Free" (Safe from Wheat)
      if (filters.allergens && filters.allergens.length > 0) {
        // Mapping from filter value to features field name
        const allergenToFeature = {
          wheat: "gluten_free",
          egg: "egg_free",
          milk: "dairy_free",
          nut: "nut_free",
        };

        // Check if restaurant is SAFE for ALL selected allergens
        const isSafe = filters.allergens.every((allergen) => {
          // ===== Priority 1: Features Detection (from Miner) =====
          // Check if features field indicates this allergen is safe
          const featureKey = allergenToFeature[allergen];
          if (featureKey && r.features?.[featureKey] === "◯") {
            return true; // Miner detected this is safe
          }

          // ===== Priority 2: Menu Level Check =====
          // If any menu is safe for this allergen
          const hasSafeMenu = r.menus?.some(
            (m) => !m.allergens?.includes(allergen),
          );

          // ===== Priority 3: Compatibility table =====
          const comp = r.compatibility?.find((c) => c.allergen === allergen);
          const isRestSafe =
            comp?.status === "safe" || comp?.status === "removable";

          return hasSafeMenu || isRestSafe;
        });

        if (!isSafe) return false;
      }

      return true;
    });
  }, [restaurants, filters]);

  const getRestaurantById = (id) => {
    return restaurants.find((r) => r.id === id || r.place_id === id);
  };

  return {
    restaurants: filteredRestaurants, // Return filtered list
    allRestaurants: restaurants, // Return all for reference if needed
    loading,
    error,
    getRestaurantById,
  };
};
