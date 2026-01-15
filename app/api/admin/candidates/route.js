import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

// Get Pending Candidates (Inbox)
export async function GET() {
    try {
        const { data, error } = await supabase
            .from('candidate_restaurants')
            .select('*')
            .eq('status', 'pending')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return NextResponse.json({ success: true, data });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

// Update Candidate (Edit before approval)
export async function PATCH(request) {
    try {
        const { id, ...updates } = await request.json();
        const { data, error } = await supabase
            .from('candidate_restaurants')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return NextResponse.json({ success: true, data });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

// Approve Candidate
export async function POST(request) {
    try {
        const { candidateId, selectedMenuIndices, selectedImage, editedCandidates } = await request.json();

        // 1. Fetch Candidate Data (Base)
        const { data: candidate, error: fetchError } = await supabase
            .from('candidate_restaurants')
            .select('*')
            .eq('id', candidateId)
            .single();

        if (fetchError) throw fetchError;

        // Merge edited data if provided
        const finalData = editedCandidates ? { ...candidate, ...editedCandidates } : candidate;

        // 2. Insert into Live Restaurants table
        const metaSource = candidate.sources?.find(s => s.type === 'system_metadata');
        const meta = metaSource?.data || {};

        const restaurantData = {
            name: finalData.shopName || finalData.shop_name, // Handle key diffs between FE and DB
            address: finalData.address,
            lat: finalData.lat,
            lng: finalData.lng,
            reliability_score: finalData.reliability_score || candidate.reliability_score,
            sources: candidate.sources?.filter(s => s.type !== 'system_metadata'),
            is_verified: true,
            last_collected_at: new Date().toISOString(),
            image_url: selectedImage || (meta.images?.[0]?.url),
            phone: finalData.phone || meta.phone,
            opening_hours: meta.opening_hours ?? candidate.opening_hours ?? {},
            website_url: finalData.website_url || meta.website_url,
            instagram_url: finalData.instagram_url,
            tags: meta.tags ?? candidate.tags ?? [],
            features: finalData.features || meta.features || {}, // Use edited features
            contamination_level: meta.contamination_level ?? candidate.contamination_level ?? 'unknown'
        };

        const { data: restaurant, error: insertError } = await supabase
            .from('restaurants')
            .insert([restaurantData])
            .select()
            .single();

        if (insertError) throw insertError;

        // 3. Insert FILTERED Menus into normalized table
        if (finalData.menus && finalData.menus.length > 0) {
            // Apply human selection filter
            const menusToInsert = selectedMenuIndices
                ? finalData.menus.filter((_, idx) => selectedMenuIndices.includes(idx))
                : finalData.menus;

            const menuInserts = menusToInsert.map(m => ({
                restaurant_id: restaurant.id,
                name: m.name,
                description: m.description || '',
                price: m.price || 0,
                // allergens column (legacy but standard) = contained
                allergens: m.allergens_contained || [],
                // New granular columns
                allergens_contained: m.allergens_contained || [],
                allergens_removable: m.allergens_removable || [],

                tags: [...(m.tags || []), ...(m.allergens_contained?.length === 0 ? ['allergen_free'] : [])],
                child_status: 'checking', // Default to checking unless explicitly set
                child_details: { note: m.description }
            }));

            if (menuInserts.length > 0) {
                await supabase.from('menus').insert(menuInserts);
            }

            // 4. Create compatibility entries (Optional: depending on design, menus table might be enough now)
            // But for search optimization, we might keep it.
            // Using logic: If menu has NO allergens contained, it is SAFE.
            // If menu has allergen REMOVABLE, it is REMOVABLE.

            // Collect all safe/removable statuses for the restaurant
            const compatibilityMap = {}; // { wheat: { safe: bool, removable: bool } }

            menusToInsert.forEach(m => {
                const contained = m.allergens_contained || [];
                const removable = m.allergens_removable || [];
                const allMajor = ['wheat', 'egg', 'milk', 'buckwheat', 'peanut', 'shrimp', 'crab'];

                allMajor.forEach(allergen => {
                    if (!compatibilityMap[allergen]) compatibilityMap[allergen] = { safe: false, removable: false };

                    if (!contained.includes(allergen)) {
                        compatibilityMap[allergen].safe = true; // At least one menu is safe
                    }
                    if (removable.includes(allergen)) {
                        compatibilityMap[allergen].removable = true;
                    }
                });
            });

            const compInserts = Object.entries(compatibilityMap).flatMap(([allergen, status]) => {
                const entries = [];
                if (status.safe) entries.push({ restaurant_id: restaurant.id, allergen, status: 'safe' });
                else if (status.removable) entries.push({ restaurant_id: restaurant.id, allergen, status: 'removable' });
                return entries;
            });

            if (compInserts.length > 0) {
                await supabase.from('restaurant_compatibility').insert(compInserts);
            }
        }

        // 5. Update Candidate Status
        await supabase
            .from('candidate_restaurants')
            .update({ status: 'approved' })
            .eq('id', candidateId);

        return NextResponse.json({ success: true, restaurantId: restaurant.id });
    } catch (error) {
        console.error('Approval Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
