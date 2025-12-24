import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Admin Client
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Verify admin token using session token from verify-pin API
async function verifyAdminToken(request) {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return false;
    }

    const token = authHeader.split(' ')[1];

    // Validate session token format and expiry (same logic as verify-pin)
    if (!token || !token.includes('_')) return false;

    const parts = token.split('_');
    const expiry = parseInt(parts[parts.length - 1], 10);

    if (isNaN(expiry)) return false;

    // Check expiry (24 hours from token creation)
    return Date.now() < expiry;
}

// GET: List all content (recipes and tried reports)
export async function GET(request) {
    if (!await verifyAdminToken(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type') || 'recipes'; // recipes | tried_reports
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const offset = (page - 1) * limit;

        if (type === 'recipes') {
            const { data: recipes, error, count } = await supabaseAdmin
                .from('recipes')
                .select(`
                    id,
                    title,
                    image_url,
                    is_public,
                    created_at,
                    user_id,
                    profiles:user_id (
                        username,
                        display_name,
                        avatar_url
                    )
                `, { count: 'exact' })
                .order('created_at', { ascending: false })
                .range(offset, offset + limit - 1);

            if (error) throw error;

            return NextResponse.json({
                type: 'recipes',
                data: recipes,
                pagination: {
                    page,
                    limit,
                    total: count,
                    totalPages: Math.ceil(count / limit)
                }
            });
        }

        if (type === 'tried_reports') {
            const { data: reports, error, count } = await supabaseAdmin
                .from('tried_reports')
                .select(`
                    id,
                    comment,
                    image_url,
                    rating,
                    created_at,
                    user_id,
                    recipe_id,
                    profiles:user_id (
                        username,
                        display_name,
                        avatar_url
                    ),
                    recipes:recipe_id (
                        title
                    )
                `, { count: 'exact' })
                .order('created_at', { ascending: false })
                .range(offset, offset + limit - 1);

            if (error) throw error;

            return NextResponse.json({
                type: 'tried_reports',
                data: reports,
                pagination: {
                    page,
                    limit,
                    total: count,
                    totalPages: Math.ceil(count / limit)
                }
            });
        }

        return NextResponse.json({ error: 'Invalid type' }, { status: 400 });

    } catch (error) {
        console.error('Content API error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE: Delete content
export async function DELETE(request) {
    if (!await verifyAdminToken(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { type, id } = await request.json();

        if (!type || !id) {
            return NextResponse.json({ error: 'type and id are required' }, { status: 400 });
        }

        if (type === 'recipe') {
            // First delete related data
            await supabaseAdmin.from('saved_recipes').delete().eq('recipe_id', id);
            await supabaseAdmin.from('likes').delete().eq('recipe_id', id);
            await supabaseAdmin.from('tried_reports').delete().eq('recipe_id', id);
            await supabaseAdmin.from('cooking_logs').delete().eq('recipe_id', id);
            await supabaseAdmin.from('recipe_reports').delete().eq('recipe_id', id);

            // Then delete the recipe
            const { error } = await supabaseAdmin.from('recipes').delete().eq('id', id);
            if (error) throw error;

            return NextResponse.json({ success: true, message: 'Recipe deleted' });
        }

        if (type === 'tried_report') {
            const { error } = await supabaseAdmin.from('tried_reports').delete().eq('id', id);
            if (error) throw error;

            return NextResponse.json({ success: true, message: 'Tried report deleted' });
        }

        return NextResponse.json({ error: 'Invalid type' }, { status: 400 });

    } catch (error) {
        console.error('Delete content error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
