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

// Approve Candidate
export async function POST(request) {
    try {
        const { candidateId } = await request.json();

        // 1. Fetch Candidate Data
        const { data: candidate, error: fetchError } = await supabase
            .from('candidate_restaurants')
            .select('*')
            .eq('id', candidateId)
            .single();

        if (fetchError) throw fetchError;

        // 2. Insert into Live Restaurants table
        const { data: restaurant, error: insertError } = await supabase
            .from('restaurants')
            .insert([{
                name: candidate.shop_name,
                address: candidate.address,
                lat: candidate.lat,
                lng: candidate.lng,
                reliability_score: candidate.reliability_score,
                sources: candidate.sources,
                is_verified: true,
                last_collected_at: new Date().toISOString()
            }])
            .select()
            .single();

        if (insertError) throw insertError;

        // 3. Insert Menus into normalized table
        if (candidate.menus && candidate.menus.length > 0) {
            const menuInserts = candidate.menus.map(m => ({
                restaurant_id: restaurant.id,
                name: m.name,
                description: m.description || '',
                price: m.price || 0,
                // In candidate, supportedAllergens means "SAFE for these".
                // In DB 'menus' table, 'allergens' usually means "CONTAINS".
                // We'll store supportedAllergens in 'tags' or handle mapping logic.
                tags: [...(m.tags || []), ...m.supportedAllergens.map(a => `${a}_free`)]
            }));

            await supabase.from('menus').insert(menuInserts);

            // 4. Create compatibility entries based on supported allergens
            // Flatten all supported allergens from all menus for this shop
            const allSupported = Array.from(new Set(candidate.menus.flatMap(m => m.supportedAllergens)));

            if (allSupported.length > 0) {
                const allergenMap = {
                    '小麦': 'wheat',
                    '卵': 'egg',
                    '乳': 'milk',
                    'ナッツ': 'nut',
                    'そば': 'buckwheat',
                };

                const compInserts = allSupported
                    .filter(a => allergenMap[a])
                    .map(a => ({
                        restaurant_id: restaurant.id,
                        allergen: allergenMap[a],
                        status: 'safe'
                    }));

                if (compInserts.length > 0) {
                    await supabase.from('restaurant_compatibility').insert(compInserts);
                }
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
