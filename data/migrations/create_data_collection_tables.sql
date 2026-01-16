-- データ収集機能に必要なテーブル
-- Supabase SQLエディタで実行してください

-- 1. data_collection_jobs テーブル
CREATE TABLE IF NOT EXISTS public.data_collection_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    area_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- pending, processing, completed, failed
    collected_count INTEGER DEFAULT 0,
    processed_count INTEGER DEFAULT 0,
    logs JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- 2. raw_collected_data テーブル
CREATE TABLE IF NOT EXISTS public.raw_collected_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES public.data_collection_jobs(id) ON DELETE CASCADE,
    source_type TEXT,
    source_url TEXT,
    raw_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. candidate_restaurants テーブル（承認待ちデータ）
CREATE TABLE IF NOT EXISTS public.candidate_restaurants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES public.data_collection_jobs(id) ON DELETE CASCADE,
    shop_name TEXT NOT NULL,
    address TEXT,
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    menus JSONB,
    sources JSONB,
    reliability_score INTEGER DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, rejected
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLSポリシー (オプション: 管理者のみアクセス可能にする場合)
ALTER TABLE public.data_collection_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.raw_collected_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_restaurants ENABLE ROW LEVEL SECURITY;

-- 全ユーザーに読み取り許可（管理画面でアクセスするため）
CREATE POLICY "Allow all users to read data_collection_jobs" ON public.data_collection_jobs FOR SELECT USING (true);
CREATE POLICY "Allow all users to insert data_collection_jobs" ON public.data_collection_jobs FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all users to update data_collection_jobs" ON public.data_collection_jobs FOR UPDATE USING (true);

CREATE POLICY "Allow all users to read raw_collected_data" ON public.raw_collected_data FOR SELECT USING (true);
CREATE POLICY "Allow all users to insert raw_collected_data" ON public.raw_collected_data FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow all users to read candidate_restaurants" ON public.candidate_restaurants FOR SELECT USING (true);
CREATE POLICY "Allow all users to insert candidate_restaurants" ON public.candidate_restaurants FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all users to update candidate_restaurants" ON public.candidate_restaurants FOR UPDATE USING (true);
CREATE POLICY "Allow all users to delete candidate_restaurants" ON public.candidate_restaurants FOR DELETE USING (true);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_data_collection_jobs_status ON public.data_collection_jobs(status);
CREATE INDEX IF NOT EXISTS idx_candidate_restaurants_status ON public.candidate_restaurants(status);
CREATE INDEX IF NOT EXISTS idx_candidate_restaurants_job_id ON public.candidate_restaurants(job_id);
