import { NextResponse } from 'next/server';
import crypto from 'crypto';

// LINE Messaging API credentials (different from LINE Login)
const LINE_BOT_CHANNEL_SECRET = process.env.LINE_BOT_CHANNEL_SECRET;
const LINE_BOT_CHANNEL_ACCESS_TOKEN = process.env.LINE_BOT_CHANNEL_ACCESS_TOKEN;

// Supabase for saving recipes
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Verify LINE webhook signature
function verifySignature(body, signature) {
    if (!LINE_BOT_CHANNEL_SECRET) return false;

    const hash = crypto
        .createHmac('SHA256', LINE_BOT_CHANNEL_SECRET)
        .update(body)
        .digest('base64');

    return hash === signature;
}

// Send reply message to LINE user
async function replyMessage(replyToken, messages) {
    if (!LINE_BOT_CHANNEL_ACCESS_TOKEN) {
        console.error('LINE_BOT_CHANNEL_ACCESS_TOKEN not configured');
        return;
    }

    try {
        await fetch('https://api.line.me/v2/bot/message/reply', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${LINE_BOT_CHANNEL_ACCESS_TOKEN}`
            },
            body: JSON.stringify({
                replyToken,
                messages: Array.isArray(messages) ? messages : [messages]
            })
        });
    } catch (error) {
        console.error('Failed to send LINE reply:', error);
    }
}

// Extract URL from text
function extractUrl(text) {
    const urlMatch = text.match(/(https?:\/\/[^\s]+)/);
    return urlMatch ? urlMatch[0] : null;
}

// Fetch OGP data for the URL
async function fetchOgpData(url) {
    try {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://anshin-recipe.vercel.app';
        const response = await fetch(`${baseUrl}/api/ogp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url })
        });

        if (response.ok) {
            return await response.json();
        }
    } catch (e) {
        console.error('OGP fetch failed:', e);
    }
    return { title: url, image: '' };
}

export async function POST(request) {
    try {
        // Get raw body for signature verification
        const body = await request.text();
        const signature = request.headers.get('x-line-signature');

        // Verify webhook signature
        if (!verifySignature(body, signature)) {
            console.warn('Invalid LINE webhook signature');
            return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
        }

        const data = JSON.parse(body);
        const events = data.events || [];

        for (const event of events) {
            // Only process text messages
            if (event.type !== 'message' || event.message?.type !== 'text') {
                continue;
            }

            const lineUserId = event.source?.userId;
            const messageText = event.message?.text || '';
            const replyToken = event.replyToken;

            // Extract URL from message
            const url = extractUrl(messageText);

            if (!url) {
                // No URL found - send help message
                await replyMessage(replyToken, {
                    type: 'text',
                    text: '🍳 レシピのURLを送ってね！\n\nInstagramやTikTokのレシピURLをそのまま送信すると、あんしんレシピに保存できます。'
                });
                continue;
            }

            // Check if we have Supabase credentials
            if (!supabaseUrl || !supabaseServiceKey) {
                await replyMessage(replyToken, {
                    type: 'text',
                    text: '⚠️ サーバー設定エラーが発生しました。管理者にお問い合わせください。'
                });
                continue;
            }

            const supabase = createClient(supabaseUrl, supabaseServiceKey);

            // Find user by LINE ID
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('id')
                .eq('line_user_id', lineUserId)
                .single();

            if (profileError || !profile) {
                // User not linked - send link instructions
                const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://anshin-recipe.vercel.app';
                await replyMessage(replyToken, {
                    type: 'text',
                    text: `🔗 アカウント連携が必要です\n\nあんしんレシピにLINEでログインしてください。\n\n${appUrl}`
                });
                continue;
            }

            // Fetch OGP data
            const ogpData = await fetchOgpData(url);

            // Save recipe
            const newRecipe = {
                user_id: profile.id,
                title: ogpData.title || 'レシピメモ',
                description: '',
                image_url: ogpData.image || '',
                source_url: url,
                tags: [],
                free_from_allergens: [],
                positive_ingredients: [],
                child_ids: [],
                scenes: [],
                memo: '',
                is_public: false // Save as private
            };

            const { error: insertError } = await supabase
                .from('recipes')
                .insert(newRecipe);

            if (insertError) {
                console.error('Failed to save recipe:', insertError);
                await replyMessage(replyToken, {
                    type: 'text',
                    text: '❌ 保存に失敗しました。もう一度お試しください。'
                });
                continue;
            }

            // Success!
            await replyMessage(replyToken, {
                type: 'text',
                text: `✅ 保存しました！\n\n📝 ${ogpData.title || 'レシピ'}\n\nあんしんレシピアプリで確認してね 🍳`
            });
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('LINE webhook error:', error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}

// GET endpoint for LINE webhook verification
export async function GET() {
    return NextResponse.json({ status: 'LINE Bot webhook is ready' });
}
