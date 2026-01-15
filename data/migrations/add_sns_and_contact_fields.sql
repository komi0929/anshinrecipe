-- Add SNS related columns to restaurants
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS instagram_url TEXT;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS sns_urls JSONB DEFAULT '[]'::jsonb;

-- Ensure candidate_restaurants also has these for editing
ALTER TABLE candidate_restaurants ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE candidate_restaurants ADD COLUMN IF NOT EXISTS website_url TEXT;
ALTER TABLE candidate_restaurants ADD COLUMN IF NOT EXISTS instagram_url TEXT;
