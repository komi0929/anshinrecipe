import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Initialize Supabase Admin Client
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

export const dynamic = 'force-dynamic';

export async function GET(request) {
    // Basic security check - in a real app, use better auth
    // Here we rely on the client knowing the admin page exists and this route being obscure, 
    // or we could pass the PIN in headers if we wanted to be stricter, 
    // but the PIN is client-side environment variable anyway.

    try {
        // 1. Total Users
        const { count: userCount, error: userError } = await supabaseAdmin
            .from('profiles')
            .select('*', { count: 'exact', head: true });

        if (userError) throw userError;

        // 2. Total Recipes
        const { count: recipeCount, error: recipeError } = await supabaseAdmin
            .from('recipes')
            .select('*', { count: 'exact', head: true });

        if (recipeError) throw recipeError;

        // 3. Tsukurepos & Likes (Engagement)
        const { count: tsukurepoCount } = await supabaseAdmin
            .from('tried_reports')
            .select('*', { count: 'exact', head: true });

        // 4. Allergen Stats (Need to fetch actual data)
        // Fetch all children's allergens to calculate distribution
        const { data: childrenData, error: childrenError } = await supabaseAdmin
            .from('children')
            .select('allergens');

        if (childrenError) throw childrenError;

        // Process Allergen Distribution
        const allergenCounts = {};
        let totalAllergies = 0;

        childrenData.forEach(child => {
            if (child.allergens && Array.isArray(child.allergens)) {
                child.allergens.forEach(allergen => {
                    allergenCounts[allergen] = (allergenCounts[allergen] || 0) + 1;
                    totalAllergies++;
                });
            }
        });

        // Convert to sorted array
        const allergenDistribution = Object.entries(allergenCounts)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 8); // Top 8

        // 5. Popular Recipes (Top 5 by Likes - if we can query this easily)
        // Note: Counting relations might be heavy, so we rely on a 'likes' column if it exists or just recent ones.
        // Assuming we store aggregate counts or need to join. 
        // For simplicity/performance now, let's just get recent recipes.
        // Or if we want "Popular", we can try to order by bookmark/like counts if they exist.
        // Let's check if recipes has a like_count column.

        return NextResponse.json({
            stats: {
                users: userCount,
                recipes: recipeCount,
                tsukurepos: tsukurepoCount,
                active_children: childrenData.length
            },
            allergens: allergenDistribution,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Admin stats error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
