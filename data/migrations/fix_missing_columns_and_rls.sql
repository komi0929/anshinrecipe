-- Add missing image_url column to restaurants table
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Update restaurant_reports RLS to allow anonymous submissions (critical for general users)
DROP POLICY IF EXISTS "Users can insert reports" ON restaurant_reports;
CREATE POLICY "Anyone can insert reports" ON restaurant_reports
    FOR INSERT WITH CHECK (true);

-- Ensure updated_at is handled by a trigger (Best practice)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_restaurants_updated_at ON restaurants;
CREATE TRIGGER update_restaurants_updated_at
    BEFORE UPDATE ON restaurants
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
