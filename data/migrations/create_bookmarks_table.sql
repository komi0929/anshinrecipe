-- Create Bookmarks Table
create table if not exists public.bookmarks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  restaurant_id text not null, -- using text to support both UUIDs and Google Place IDs if needed
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, restaurant_id)
);

-- Indexes for Bookmarks
create index if not exists bookmarks_user_id_idx on public.bookmarks(user_id);
create index if not exists bookmarks_restaurant_id_idx on public.bookmarks(restaurant_id);

-- RLS for Bookmarks
alter table public.bookmarks enable row level security;

create policy "Users can view their own bookmarks"
  on public.bookmarks for select
  using (auth.uid() = user_id);

create policy "Users can insert their own bookmarks"
  on public.bookmarks for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own bookmarks"
  on public.bookmarks for delete
  using (auth.uid() = user_id);

-- Create Reviews Table (if not exists)
create table if not exists public.reviews (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  restaurant_id text not null,
  menu_id uuid references public.menus(id), -- Optional: Link to specific menu item
  rating integer check (rating >= 1 and rating <= 5) not null,
  content text,
  images text[] default array[]::text[],
  visit_date date,
  review_type text default 'general', -- 'general' or 'menu_post'
  is_own_menu boolean default false,
  custom_menu_name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Indexes for Reviews
create index if not exists reviews_restaurant_id_idx on public.reviews(restaurant_id);
create index if not exists reviews_user_id_idx on public.reviews(user_id);

-- RLS for Reviews
alter table public.reviews enable row level security;

-- Everyone can read reviews
create policy "Reviews are public"
  on public.reviews for select
  using (true);

-- Users can insert their own reviews
create policy "Users can insert reviews"
  on public.reviews for insert
  with check (auth.uid() = user_id);

-- Create Review Likes Table
create table if not exists public.review_likes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  review_id uuid references public.reviews(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, review_id)
);

-- RLS for Review Likes
alter table public.review_likes enable row level security;

create policy "Review likes are public"
  on public.review_likes for select
  using (true);

create policy "Users can like reviews"
  on public.review_likes for insert
  with check (auth.uid() = user_id);

create policy "Users can unlike reviews"
  on public.review_likes for delete
  using (auth.uid() = user_id);
