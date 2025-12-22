import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Initialize Supabase Admin Client
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

export const dynamic = 'force-dynamic';

// Helper to get date strings
const getDateString = (daysAgo = 0) => {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return date.toISOString().split('T')[0];
};

export async function GET(request) {
    try {
        const today = getDateString(0);
        const yesterday = getDateString(1);
        const weekAgo = getDateString(7);
        const monthAgo = getDateString(30);

        // ========== DAILY KPIs ==========

        // 1. New Users Today
        const { count: newUsersToday } = await supabaseAdmin
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', today);

        // 2. New Users Yesterday (for comparison)
        const { count: newUsersYesterday } = await supabaseAdmin
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', yesterday)
            .lt('created_at', today);

        // 3. Recipes Created Today
        const { count: recipesToday } = await supabaseAdmin
            .from('recipes')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', today);

        // 4. Recipes Created Yesterday
        const { count: recipesYesterday } = await supabaseAdmin
            .from('recipes')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', yesterday)
            .lt('created_at', today);

        // 5. Saves Today
        const { count: savesToday } = await supabaseAdmin
            .from('saved_recipes')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', today);

        // 6. Saves Yesterday
        const { count: savesYesterday } = await supabaseAdmin
            .from('saved_recipes')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', yesterday)
            .lt('created_at', today);

        // 7. Likes Today
        const { count: likesToday } = await supabaseAdmin
            .from('likes')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', today);

        // 8. Likes Yesterday
        const { count: likesYesterday } = await supabaseAdmin
            .from('likes')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', yesterday)
            .lt('created_at', today);

        // 9. Tried Reports Today
        const { count: triedToday } = await supabaseAdmin
            .from('tried_reports')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', today);

        // 10. Tried Reports Yesterday
        const { count: triedYesterday } = await supabaseAdmin
            .from('tried_reports')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', yesterday)
            .lt('created_at', today);

        // ========== TOTALS ==========
        const { count: totalUsers } = await supabaseAdmin
            .from('profiles')
            .select('*', { count: 'exact', head: true });

        const { count: totalRecipes } = await supabaseAdmin
            .from('recipes')
            .select('*', { count: 'exact', head: true });

        const { count: totalChildren } = await supabaseAdmin
            .from('children')
            .select('*', { count: 'exact', head: true });

        // ========== WEEKLY TREND (past 7 days) ==========
        const { data: weeklyData } = await supabaseAdmin
            .from('profiles')
            .select('created_at')
            .gte('created_at', weekAgo);

        // Group by date
        const usersByDay = {};
        for (let i = 0; i < 7; i++) {
            usersByDay[getDateString(i)] = 0;
        }
        weeklyData?.forEach(row => {
            const date = row.created_at.split('T')[0];
            if (usersByDay[date] !== undefined) {
                usersByDay[date]++;
            }
        });

        // ========== FUNNEL DATA ==========
        // Total users who completed each step
        const { count: usersWithChildren } = await supabaseAdmin
            .from('children')
            .select('user_id', { count: 'exact', head: true });

        const { count: usersWithSaves } = await supabaseAdmin
            .from('saved_recipes')
            .select('user_id', { count: 'exact', head: true });

        const { count: usersWithRecipes } = await supabaseAdmin
            .from('recipes')
            .select('user_id', { count: 'exact', head: true });

        // ========== ANALYTICS EVENTS (if table exists) ==========
        let smartImportStats = { starts: 0, successes: 0 };
        try {
            const { count: importStarts } = await supabaseAdmin
                .from('analytics_events')
                .select('*', { count: 'exact', head: true })
                .eq('event_name', 'smart_import_start')
                .gte('created_at', weekAgo);

            const { count: importSuccesses } = await supabaseAdmin
                .from('analytics_events')
                .select('*', { count: 'exact', head: true })
                .eq('event_name', 'smart_import_success')
                .gte('created_at', weekAgo);

            smartImportStats = {
                starts: importStarts || 0,
                successes: importSuccesses || 0
            };
        } catch (e) {
            // analytics_events table may not exist yet
        }

        return NextResponse.json({
            // Daily KPIs with comparison
            daily: {
                newUsers: { today: newUsersToday || 0, yesterday: newUsersYesterday || 0 },
                recipes: { today: recipesToday || 0, yesterday: recipesYesterday || 0 },
                saves: { today: savesToday || 0, yesterday: savesYesterday || 0 },
                likes: { today: likesToday || 0, yesterday: likesYesterday || 0 },
                tried: { today: triedToday || 0, yesterday: triedYesterday || 0 }
            },
            // Totals
            totals: {
                users: totalUsers || 0,
                recipes: totalRecipes || 0,
                children: totalChildren || 0
            },
            // Weekly trend
            weekly: {
                usersByDay: Object.entries(usersByDay)
                    .map(([date, count]) => ({ date, count }))
                    .reverse()
            },
            // Funnel
            funnel: {
                registered: totalUsers || 0,
                childAdded: usersWithChildren || 0,
                firstSave: usersWithSaves || 0,
                firstRecipe: usersWithRecipes || 0
            },
            // Feature usage
            features: {
                smartImport: smartImportStats
            },
            // Metadata
            generatedAt: new Date().toISOString()
        });

    } catch (error) {
        console.error('Analytics API error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
