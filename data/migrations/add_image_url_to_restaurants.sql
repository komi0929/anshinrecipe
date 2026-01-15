-- Add image_url column to restaurants table
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS image_url TEXT;

COMMENT ON COLUMN restaurants.image_url IS 'Primary image URL for the restaurant (e.g. exterior or hero image)';
