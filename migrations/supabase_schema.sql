-- Enable Realtime
alter publication supabase_realtime add table profiles;
alter publication supabase_realtime add table posts;

-- Create profiles table
create table profiles (
  id uuid references auth.users not null primary key,
  username text unique,
  avatar_type text default 'blue_square',
  current_location_x float default 400,
  current_location_y float default 300,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create posts table
create table posts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create jobs table
create table jobs (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  status text default 'open', -- open, in_progress, completed
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create job_experiences table
create table job_experiences (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) not null,
  job_id uuid references jobs(id) not null,
  completed_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Set up Row Level Security (RLS)
alter table profiles enable row level security;
alter table posts enable row level security;
alter table jobs enable row level security;
alter table job_experiences enable row level security;

-- Policies
-- Profiles: Public read, Self update
create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( true );

create policy "Users can insert their own profile."
  on profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on profiles for update
  using ( auth.uid() = id );

-- Posts: Public read, Authenticated insert
create policy "Public posts are viewable by everyone."
  on posts for select
  using ( true );

create policy "Authenticated users can insert posts."
  on posts for insert
  with check ( auth.role() = 'authenticated' );

-- Jobs: Public read
create policy "Public jobs are viewable by everyone."
  on jobs for select
  using ( true );

-- Job Experiences: Public read, Authenticated insert
create policy "Public job experiences are viewable by everyone."
  on job_experiences for select
  using ( true );

create policy "Authenticated users can insert job experiences."
  on job_experiences for insert
  with check ( auth.role() = 'authenticated' );
