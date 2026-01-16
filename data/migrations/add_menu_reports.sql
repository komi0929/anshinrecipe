-- Add menu_id column to restaurant_reports for menu-level reporting
ALTER TABLE restaurant_reports ADD COLUMN IF NOT EXISTS menu_id UUID REFERENCES menus(id) ON DELETE SET NULL;
ALTER TABLE restaurant_reports ADD COLUMN IF NOT EXISTS report_target TEXT DEFAULT 'shop' CHECK (report_target IN ('shop', 'menu'));

-- Add index for menu reports
CREATE INDEX IF NOT EXISTS restaurant_reports_menu_id_idx ON restaurant_reports (menu_id);

-- Update RLS to allow anonymous submissions (already done in fix_missing_columns_and_rls.sql, but ensure)
DROP POLICY IF EXISTS "Anyone can insert reports" ON restaurant_reports;
CREATE POLICY "Anyone can insert reports" ON restaurant_reports
    FOR INSERT WITH CHECK (true);

-- Ensure admins can view all
DROP POLICY IF EXISTS "Admins can view all reports" ON restaurant_reports;
CREATE POLICY "Admins can view all reports" ON restaurant_reports
    FOR SELECT USING (true);
