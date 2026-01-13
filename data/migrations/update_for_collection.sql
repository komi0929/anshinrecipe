-- Create data_collection_jobs table to track execution status
CREATE TABLE IF NOT EXISTS data_collection_jobs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    area_name TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    collected_count INTEGER DEFAULT 0,
    processed_count INTEGER DEFAULT 0,
    saved_count INTEGER DEFAULT 0,
    logs JSONB DEFAULT '[]'::jsonb,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Create raw_collected_data table for staging the RAW outputs from collectors
CREATE TABLE IF NOT EXISTS raw_collected_data (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    job_id UUID REFERENCES data_collection_jobs(id) ON DELETE CASCADE,
    source_type TEXT NOT NULL, -- 'official', 'sns', 'gourmet', 'blog', 'google_maps', 'reservation'
    source_url TEXT,
    raw_data JSONB NOT NULL,
    collected_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create candidate_restaurants table for the "Inbox" (Post-AI Pipeline)
CREATE TABLE IF NOT EXISTS candidate_restaurants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    job_id UUID REFERENCES data_collection_jobs(id) ON DELETE SET NULL,
    shop_name TEXT NOT NULL,
    address TEXT,
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    menus JSONB DEFAULT '[]'::jsonb,
    sources JSONB DEFAULT '[]'::jsonb,
    reliability_score INTEGER DEFAULT 0,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Update restaurants table with new columns for reliability and verification
ALTER TABLE restaurants 
ADD COLUMN IF NOT EXISTS reliability_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS sources JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS last_collected_at TIMESTAMP WITH TIME ZONE;

-- Create indexes
CREATE INDEX IF NOT EXISTS data_collection_jobs_area_idx ON data_collection_jobs (area_name);
CREATE INDEX IF NOT EXISTS data_collection_jobs_status_idx ON data_collection_jobs (status);
CREATE INDEX IF NOT EXISTS candidate_restaurants_status_idx ON candidate_restaurants (status);

