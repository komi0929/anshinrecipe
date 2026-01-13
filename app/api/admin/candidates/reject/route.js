import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function POST(request) {
    try {
        const { candidateId } = await request.json();

        const { error } = await supabase
            .from('candidate_restaurants')
            .update({ status: 'rejected' })
            .eq('id', candidateId);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
