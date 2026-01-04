import { supabase } from '@/lib/supabaseClient';
import { NextResponse } from 'next/server';

/**
 * GET - Fetch active announcements (public endpoint)
 * This is for the notifications page to display announcements
 */
export async function GET() {
    try {
        const { data, error } = await supabase
            .from('announcements')
            .select('id, title, content, emoji, created_at')
            .eq('is_active', true)
            .order('created_at', { ascending: false })
            .limit(20);

        if (error) {
            console.error('Error fetching announcements:', error);
            return NextResponse.json(
                { error: 'Failed to fetch announcements' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            announcements: data || []
        });

    } catch (error) {
        console.error('Error in public announcements API:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
