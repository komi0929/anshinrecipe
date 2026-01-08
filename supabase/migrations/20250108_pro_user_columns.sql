-- プロユーザー機能のためのカラム追加
-- Migration: 20250108_pro_user_columns.sql

-- プロユーザーフラグを追加
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_pro BOOLEAN DEFAULT FALSE;

-- プロユーザー用のプロフィールフィールド
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS instagram_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS twitter_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS youtube_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS blog_url TEXT;

-- プロユーザーフラグにインデックスを追加（検索高速化のため）
CREATE INDEX IF NOT EXISTS idx_profiles_is_pro ON profiles(is_pro) WHERE is_pro = TRUE;

-- コメント追加
COMMENT ON COLUMN profiles.is_pro IS 'プロユーザーフラグ（料理研究家、管理栄養士等）';
COMMENT ON COLUMN profiles.bio IS 'プロユーザーの自己紹介文（500文字まで推奨）';
COMMENT ON COLUMN profiles.instagram_url IS 'InstagramプロフィールURL';
COMMENT ON COLUMN profiles.twitter_url IS 'X(Twitter)プロフィールURL';
COMMENT ON COLUMN profiles.youtube_url IS 'YouTubeチャンネルURL';
COMMENT ON COLUMN profiles.blog_url IS 'ブログURL';
