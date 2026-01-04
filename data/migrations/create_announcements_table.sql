-- Migration: Create Announcements Table
-- Centralized management of admin announcements with automatic notification dispatch

-- 1. Create Announcements Table
CREATE TABLE IF NOT EXISTS announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    emoji TEXT DEFAULT '📢',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_announcements_created_at ON announcements(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_announcements_active ON announcements(is_active) WHERE is_active = TRUE;

-- 3. RLS Policies
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- Anyone can read active announcements (public read)
CREATE POLICY "Anyone can read active announcements" ON announcements
    FOR SELECT USING (is_active = TRUE);

-- Only service role can insert/update/delete (admin operations via API)
-- No policy for INSERT/UPDATE/DELETE = only service role can modify

-- 4. Add some tracking columns for analytics (optional)
ALTER TABLE announcements 
ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;

-- 5. Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_announcement_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_announcement_timestamp ON announcements;
CREATE TRIGGER trigger_update_announcement_timestamp
    BEFORE UPDATE ON announcements
    FOR EACH ROW
    EXECUTE FUNCTION update_announcement_timestamp();

-- 6. Seed initial announcements (migrate from hardcoded data)
INSERT INTO announcements (title, content, emoji, created_at) VALUES
(
    '📺 YouTube検索機能が追加されました！',
    'YouTubeからお子様のアレルギーを考慮したレシピ動画を検索できるようになりました。レシピ作成画面の「YouTubeから見つける」ボタンからお試しください。シーンや特徴でも絞り込めます！',
    '📺',
    '2025-12-28 00:00:00+09'
),
(
    'あんしんレシピ へようこそ！',
    'アレルギーっ子のパパ・ママのためのレシピ共有アプリです。ご意見・ご要望はLINEかメールでお寄せください。',
    '🎉',
    '2024-12-01 00:00:00+09'
)
ON CONFLICT DO NOTHING;

-- Comment for documentation
COMMENT ON TABLE announcements IS 'Admin announcements that trigger notifications to all users';
