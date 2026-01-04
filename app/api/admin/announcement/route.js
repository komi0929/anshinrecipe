import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Create a Supabase client with the service role key for admin operations
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
);

/**
 * POST - Create a new announcement and send notifications to all users
 */
export async function POST(request) {
    try {
        const { pin, title, content, emoji } = await request.json();

        // Verify PIN
        if (pin !== process.env.ADMIN_PIN) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        if (!title || !content) {
            return NextResponse.json(
                { error: 'Title and content are required' },
                { status: 400 }
            );
        }

        // 1. Create the announcement in the database
        const { data: announcement, error: announcementError } = await supabaseAdmin
            .from('announcements')
            .insert({
                title: title,
                content: content,
                emoji: emoji || '📢',
                is_active: true
            })
            .select()
            .single();

        if (announcementError) {
            console.error('Error creating announcement:', announcementError);
            return NextResponse.json(
                { error: 'Failed to create announcement' },
                { status: 500 }
            );
        }

        // 2. Get all user profiles to send notifications
        const { data: profiles, error: profilesError } = await supabaseAdmin
            .from('profiles')
            .select('id')
            .not('id', 'is', null);

        if (profilesError) {
            console.error('Error fetching profiles:', profilesError);
            // Announcement was created, but notifications failed
            return NextResponse.json({
                success: true,
                warning: 'Announcement created but failed to send notifications',
                announcement: announcement
            });
        }

        if (!profiles || profiles.length === 0) {
            return NextResponse.json({
                success: true,
                message: 'Announcement created but no users to notify',
                announcement: announcement
            });
        }

        // 3. Create notifications for all users
        const notifications = profiles.map(profile => ({
            recipient_id: profile.id,
            actor_id: null, // System notification (no actor)
            type: 'announcement',
            recipe_id: null,
            is_read: false,
            metadata: {
                announcement_id: announcement.id,
                title: title,
                content: content,
                emoji: emoji || '📢'
            }
        }));

        // Insert notifications in batches to avoid timeout
        const batchSize = 100;
        let insertedCount = 0;

        for (let i = 0; i < notifications.length; i += batchSize) {
            const batch = notifications.slice(i, i + batchSize);
            const { error: insertError } = await supabaseAdmin
                .from('notifications')
                .insert(batch);

            if (insertError) {
                console.error('Error inserting notifications batch:', insertError);
            } else {
                insertedCount += batch.length;
            }
        }

        return NextResponse.json({
            success: true,
            message: `Announcement created and sent to ${insertedCount} users`,
            announcement: announcement,
            totalUsers: profiles.length,
            notificationsSent: insertedCount
        });

    } catch (error) {
        console.error('Error in announcement API:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * GET - Fetch all announcements (for admin dashboard)
 */
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const pin = searchParams.get('pin');
        const activeOnly = searchParams.get('active') !== 'false';

        // Verify PIN for admin access
        if (pin !== process.env.ADMIN_PIN) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        let query = supabaseAdmin
            .from('announcements')
            .select('*')
            .order('created_at', { ascending: false });

        if (activeOnly) {
            query = query.eq('is_active', true);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching announcements:', error);
            return NextResponse.json(
                { error: 'Failed to fetch announcements' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            announcements: data
        });

    } catch (error) {
        console.error('Error in GET announcements:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * DELETE - Deactivate an announcement (soft delete)
 */
export async function DELETE(request) {
    try {
        const { pin, announcementId } = await request.json();

        if (pin !== process.env.ADMIN_PIN) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        if (!announcementId) {
            return NextResponse.json(
                { error: 'Announcement ID is required' },
                { status: 400 }
            );
        }

        const { error } = await supabaseAdmin
            .from('announcements')
            .update({ is_active: false })
            .eq('id', announcementId);

        if (error) {
            console.error('Error deactivating announcement:', error);
            return NextResponse.json(
                { error: 'Failed to deactivate announcement' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Announcement deactivated'
        });

    } catch (error) {
        console.error('Error in DELETE announcement:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
