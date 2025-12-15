-- Create Reports Table
CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
    reporter_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    reason TEXT NOT NULL,
    details TEXT,
    status TEXT DEFAULT 'pending', -- pending, resolved, dismissed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Allow anyone (authenticated) to insert reports
CREATE POLICY "Authenticated users can create reports" ON reports
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow only admins (or service role) to read/update?
-- For MVP, we might need a way to read this in the Admin app.
-- If Admin App uses Service Role or specific Admin User, we need policy.
-- For now, let's allow "public" read if we rely on PIN auth in client? 
-- NO, that's dangerous. 
-- Let's just create a policy that might be temporary or rely on Supabase Dashboard for true security?
-- Actually, the user wants an "Admin Page" in the app.
-- We can add a policy "Allow read for anyone with admin_role" but we don't have roles.
-- For MVP speed/simplicity as requested: Allow READ for ALL Authenticated Users (and rely on client-side PIN to hide UI).
-- THIS IS NOT SECURE but fits "Fast MVP" + "Client-side PIN" architecture.
CREATE POLICY "Authenticated users can view reports" ON reports
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update reports" ON reports
    FOR UPDATE USING (auth.role() = 'authenticated');
