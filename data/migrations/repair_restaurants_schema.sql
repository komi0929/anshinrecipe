-- REPAIR RESTAURANTS TABLE
-- Adds missing columns that are required by the application.

BEGIN;

-- 1. Ensure basic columns exist
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS features JSONB DEFAULT '{}';
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS contamination_level TEXT DEFAULT 'unknown';
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS reliability_score INTEGER DEFAULT 0;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS sources JSONB DEFAULT '[]';
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS last_collected_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS opening_hours JSONB DEFAULT '{}';
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS instagram_url TEXT;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS website_url TEXT;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS lng DOUBLE PRECISION;

-- 2. Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';

COMMIT;
