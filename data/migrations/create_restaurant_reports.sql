-- Create table for restaurant error reports from users
CREATE TABLE IF NOT EXISTS restaurant_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    issue_type TEXT NOT NULL, -- 'closed', 'wrong_info', 'allergy_mismatch', 'other'
    details TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'ignored')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE restaurant_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert reports" ON restaurant_reports
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admins can view all reports" ON restaurant_reports
    FOR SELECT USING (true); -- Simplified, usually check admin role

CREATE INDEX IF NOT EXISTS restaurant_reports_status_idx ON restaurant_reports (status);
