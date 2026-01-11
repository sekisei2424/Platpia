-- 1. Extend Profiles Table
-- Add Avatar SNS specific columns to the existing profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS username text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_type text DEFAULT 'blue_square';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS current_location_x float DEFAULT 400;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS current_location_y float DEFAULT 300;

-- Populate username from name if empty
UPDATE profiles SET username = name WHERE username IS NULL;

-- 2. Create Plaza Posts Table
-- We use 'plaza_posts' because 'posts' already exists for Listings/Events
create table if not exists plaza_posts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Create Jobs Table (for Village gamification)
create table if not exists jobs (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  status text default 'open',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Create Job Experiences Table
create table if not exists job_experiences (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) not null,
  job_id uuid references jobs(id) not null,
  completed_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Enable RLS (Row Level Security)
alter table plaza_posts enable row level security;
alter table jobs enable row level security;
alter table job_experiences enable row level security;

-- 6. Create Policies

-- Plaza Posts
create policy "Public plaza posts are viewable by everyone."
  on plaza_posts for select
  using ( true );

create policy "Authenticated users can insert plaza posts."
  on plaza_posts for insert
  with check ( auth.role() = 'authenticated' );

-- Jobs
create policy "Public jobs are viewable by everyone."
  on jobs for select
  using ( true );

-- Job Experiences
create policy "Public job experiences are viewable by everyone."
  on job_experiences for select
  using ( true );

create policy "Authenticated users can insert job experiences."
  on job_experiences for insert
  with check ( auth.role() = 'authenticated' );
