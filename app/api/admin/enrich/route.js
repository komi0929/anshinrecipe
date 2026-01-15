
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { enrichRestaurantData } from '@/lib/collection/enricher';

export async function POST(request) {
    try {
        const body = await request.json();
        const { candidateId, shopName, address } = body;

        if (!candidateId || !shopName) {
            return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
        }

        // 1. Call Enricher
        console.log(`[API] Enriching data for: ${shopName}`);
        const enrichedData = await enrichRestaurantData(shopName, address || '');

        // 2. Fetch current candidate to merge
        const { data: current, error: fetchError } = await supabase
            .from('candidate_restaurants')
            .select('sources, id') // We assume features are inside 'sources' metadata or a future column. 
            // Wait, currently 'features' are buried in the UI state or metadata source.
            // Let's store this enriched data as a NEW source of type 'enrichment_update'.
            .eq('id', candidateId)
            .single();

        if (fetchError) throw fetchError;

        // 3. Append to Sources
        const newSource = {
            type: 'enrichment_update',
            url: 'google_places_api',
            data: {
                features: enrichedData.features,
                metadata: enrichedData.metadata,
                updated_at: new Date().toISOString()
            }
        };

        const updatedSources = [...(current.sources || []), newSource];

        // 4. Update DB
        const { error: updateError } = await supabase
            .from('candidate_restaurants')
            .update({ sources: updatedSources })
            .eq('id', candidateId);

        if (updateError) throw updateError;

        return NextResponse.json({ success: true, verifiedData: enrichedData });

    } catch (error) {
        console.error('[API] Enrich Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
