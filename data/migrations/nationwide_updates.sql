-- Nationwide Coverage & Incremental Updates Schema

-- 1. Create Master Municipalities Table
CREATE TABLE IF NOT EXISTS public.master_municipalities (
    code TEXT PRIMARY KEY, -- JIS Code (e.g., '40132')
    prefecture TEXT NOT NULL, -- e.g., '福岡県'
    name TEXT NOT NULL, -- e.g., '福岡市博多区'
    last_collected_at TIMESTAMPTZ, -- Null if never collected
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.master_municipalities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all users to read master_municipalities" ON public.master_municipalities FOR SELECT USING (true);
CREATE POLICY "Allow all users to update master_municipalities" ON public.master_municipalities FOR UPDATE USING (true);
CREATE POLICY "Allow all users to insert master_municipalities" ON public.master_municipalities FOR INSERT WITH CHECK (true);

-- 2. Update Data Collection Jobs to link to Municipality
ALTER TABLE public.data_collection_jobs 
ADD COLUMN IF NOT EXISTS municipality_code TEXT REFERENCES public.master_municipalities(code);

-- 3. Update Candidate Restaurants to link to Existing Restaurants (for Incremental Updates)
ALTER TABLE public.candidate_restaurants 
ADD COLUMN IF NOT EXISTS reference_restaurant_id UUID REFERENCES public.restaurants(id);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_master_municipalities_last_collected ON public.master_municipalities(last_collected_at);
