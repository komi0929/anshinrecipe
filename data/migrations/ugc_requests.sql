-- User Collection Requests Table
-- Users can request coverage for specific shops

CREATE TABLE IF NOT EXISTS public.collection_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Optional (can be anonymous)
    shop_name TEXT NOT NULL,
    url TEXT,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'pending', -- pending, processing, completed, rejected
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE public.collection_requests ENABLE ROW LEVEL SECURITY;

-- Allow anyone (authenticated or anon depending on app) to insert
-- Assuming app allows public requests for now, or authenticated.
-- Let's allow public insert for growth, but maybe rate limit in API.
CREATE POLICY "Allow all users to insert requests" ON public.collection_requests FOR INSERT WITH CHECK (true);

-- Allow users to see their own requests (if user_id exists)
CREATE POLICY "Allow users to view own requests" ON public.collection_requests FOR SELECT USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_collection_requests_status ON public.collection_requests(status);
