
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        const body = await request.json();
        const { shopName, url, notes } = body;

        if (!shopName) {
            return NextResponse.json({ error: 'Shop name is required' }, { status: 400 });
        }

        // Initialize Supabase Client
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use Service Role for safe inserts if needed, or anon

        // Actually, for client-triggered requests, we might want to use the client's auth context if available from headers?
        // But here we are in API route. Let's use service key but validate input.
        // wait, if we use service key, RLS is bypassed unless we are careful.
        // Let's use anon key if possible, OR just use service key and manual validation.
        // Given the requirement "User-Triggered", maybe we should try to get the user ID.

        const supabase = createClient(supabaseUrl, supabaseKey);

        const { data, error } = await supabase
            .from('collection_requests')
            .insert([
                {
                    shop_name: shopName,
                    url: url || null,
                    notes: notes || null,
                    status: 'pending'
                    // user_id: ... // todo: get from auth if possible
                }
            ])
            .select();

        if (error) {
            console.error('Supabase Insert Error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, data }, { status: 200 });

    } catch (e) {
        console.error('API Error:', e);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
