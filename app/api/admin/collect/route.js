import { NextResponse } from 'next/server';
import { autoCollectAreaData } from '@/lib/collection/orchestrator';

export async function POST(request) {
    try {
        const body = await request.json();
        const { area } = body;

        if (!area) {
            return NextResponse.json({ error: 'Area is required' }, { status: 400 });
        }

        console.log(`[API v2.0] Received collection request for ${area}`);
        console.log(`[API v2.0] ENV CHECK - MAPS_KEY: ${!!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}, CSE_ID: ${!!process.env.GOOGLE_CSE_ID}`);

        const result = await autoCollectAreaData(area);

        return NextResponse.json({ success: true, data: result });
    } catch (error) {
        console.error('Collection API Error:', error);
        // Return detailed error info for debugging
        return NextResponse.json({
            error: error.message || 'Internal Server Error',
            details: error.toString(),
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }, { status: 500 });
    }
}
