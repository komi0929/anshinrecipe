-- Create reports table for flagging inappropriate content
create table if not exists public.reports (
    id uuid default gen_random_uuid() primary key,
    recipe_id uuid references public.recipes(id) on delete cascade not null,
    reporter_id uuid references auth.users(id) on delete set null, -- Can be null if we allow anonymous reporting, but safer to link to user
    reason text not null, -- 'allergy_risk', 'inappropriate', 'spam', 'other'
    details text,
    status text default 'pending' check (status in ('pending', 'reviewed', 'resolved', 'dismissed')),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS Policies
alter table public.reports enable row level security;

-- Users can insert reports
create policy "Users can insert reports"
    on public.reports for insert
    with check (auth.uid() = reporter_id);

-- Only admins/moderators can view reports (For now, just disable public select)
-- create policy "Admins can view reports" ... (Skip for now, or allow reporter to see their own)

create policy "Users can view their own reports"
    on public.reports for select
    using (auth.uid() = reporter_id);
