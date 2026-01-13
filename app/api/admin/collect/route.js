import { NextResponse } from 'next/server';
import { autoCollectAreaData } from '@/lib/collection/orchestrator';

export async function POST(request) {
    try {
        const body = await request.json();
        const { area } = body;

        if (!area) {
            return NextResponse.json({ error: 'Area is required' }, { status: 400 });
        }

        // Trigger the orchestrator
        // In a real production environment, this should be offloaded to a background queue (e.g., BullMQ, Inngest)
        // For this implementation, we await it (or we could fire and forget if looking for async)
        // User asked for "Data Collection Start" -> "Automatic Execution".

        console.log(`[API] Received collection request for ${area}`);

        const result = await autoCollectAreaData(area);

        return NextResponse.json({ success: true, data: result });
    } catch (error) {
        console.error('Collection API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
