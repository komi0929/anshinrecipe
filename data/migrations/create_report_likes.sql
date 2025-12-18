-- Create report_likes table
CREATE TABLE IF NOT EXISTS report_likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    report_id UUID NOT NULL REFERENCES tried_reports(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, report_id)
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_report_likes_report_id ON report_likes(report_id);
CREATE INDEX IF NOT EXISTS idx_report_likes_user_id ON report_likes(user_id);

-- Enable RLS
ALTER TABLE report_likes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view report likes"
    ON report_likes FOR SELECT
    USING (true);

CREATE POLICY "Users can insert their own report likes"
    ON report_likes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own report likes"
    ON report_likes FOR DELETE
    USING (auth.uid() = user_id);
