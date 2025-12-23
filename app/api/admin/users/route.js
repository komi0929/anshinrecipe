import { NextResponse } from 'next/server';
import { supabase as supabaseAdmin } from '@/lib/supabaseClient';

// Verify admin token
async function verifyAdminToken(request) {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return false;
    }

    const token = authHeader.split(' ')[1];
    const expectedPin = process.env.ADMIN_PIN || process.env.NEXT_PUBLIC_ADMIN_PIN;

    return token === `admin_${expectedPin}_token`;
}

// GET: List all users
export async function GET(request) {
    if (!await verifyAdminToken(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const offset = (page - 1) * limit;

        const { data: users, error, count } = await supabaseAdmin
            .from('profiles')
            .select(`
                id,
                username,
                display_name,
                avatar_url,
                picture_url,
                is_banned,
                ban_reason,
                created_at
            `, { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) throw error;

        // Get recipe counts for each user
        const userIds = users.map(u => u.id);
        const { data: recipeCounts } = await supabaseAdmin
            .from('recipes')
            .select('user_id')
            .in('user_id', userIds);

        const recipeCountMap = {};
        recipeCounts?.forEach(r => {
            recipeCountMap[r.user_id] = (recipeCountMap[r.user_id] || 0) + 1;
        });

        const usersWithCounts = users.map(u => ({
            ...u,
            recipeCount: recipeCountMap[u.id] || 0
        }));

        return NextResponse.json({
            data: usersWithCounts,
            pagination: {
                page,
                limit,
                total: count,
                totalPages: Math.ceil(count / limit)
            }
        });

    } catch (error) {
        console.error('Users API error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PATCH: Update user status (ban/unban)
export async function PATCH(request) {
    if (!await verifyAdminToken(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { userId, action, reason } = await request.json();

        if (!userId || !action) {
            return NextResponse.json({ error: 'userId and action are required' }, { status: 400 });
        }

        if (action === 'ban') {
            const { error } = await supabaseAdmin
                .from('profiles')
                .update({
                    is_banned: true,
                    ban_reason: reason || 'No reason provided',
                    banned_at: new Date().toISOString()
                })
                .eq('id', userId);

            if (error) throw error;
            return NextResponse.json({ success: true, message: 'User banned' });
        }

        if (action === 'unban') {
            const { error } = await supabaseAdmin
                .from('profiles')
                .update({
                    is_banned: false,
                    ban_reason: null,
                    banned_at: null
                })
                .eq('id', userId);

            if (error) throw error;
            return NextResponse.json({ success: true, message: 'User unbanned' });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

    } catch (error) {
        console.error('User update error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
