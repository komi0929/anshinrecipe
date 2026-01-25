-- ADD MISSING COLUMNS TO RESTAURANTS TABLE
-- Required for Anshin Map data flow to work properly
-- Run this migration in Supabase SQL Editor

BEGIN;

-- 1. Add overview column for AI-generated store description
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS overview TEXT;

-- 2. Add classified_images for Miner's categorized photos
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS classified_images JSONB DEFAULT '{}';

-- 3. Add place_id for Google Places reference
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS place_id TEXT;

-- 4. Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';

COMMIT;
