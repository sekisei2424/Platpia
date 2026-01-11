-- 1. Clean up existing tables (User approved reset)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP TABLE IF EXISTS job_experiences CASCADE;
DROP TABLE IF EXISTS jobs CASCADE;
DROP TABLE IF EXISTS plaza_posts CASCADE;
DROP TABLE IF EXISTS posts CASCADE; -- Legacy
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS users CASCADE; -- Legacy
DROP TYPE IF EXISTS user_type_enum CASCADE;

-- 2. Create User Type Enum
CREATE TYPE user_type_enum AS ENUM ('individual', 'company');

-- 3. Create Profiles Table
CREATE TABLE profiles (
  id uuid references auth.users on delete cascade not null primary key,
  username text,
  user_type user_type_enum not null default 'individual',
  avatar_type text default 'blue_square',
  current_location_x float default 400,
  current_location_y float default 300,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Create Plaza Posts Table
CREATE TABLE plaza_posts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Create Jobs Table
CREATE TABLE jobs (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  status text default 'open',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. Create Job Experiences Table
CREATE TABLE job_experiences (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) not null,
  job_id uuid references jobs(id) not null,
  completed_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 7. Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE plaza_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_experiences ENABLE ROW LEVEL SECURITY;

-- 8. Create RLS Policies

-- Profiles
CREATE POLICY "Public profiles are viewable by everyone."
  ON profiles FOR SELECT
  USING ( true );

CREATE POLICY "Users can update own profile."
  ON profiles FOR UPDATE
  USING ( auth.uid() = id );

-- Plaza Posts
CREATE POLICY "Public plaza posts are viewable by everyone."
  ON plaza_posts FOR SELECT
  USING ( true );

CREATE POLICY "Authenticated users can insert plaza posts."
  ON plaza_posts FOR INSERT
  WITH CHECK ( auth.role() = 'authenticated' );

-- Jobs
CREATE POLICY "Public jobs are viewable by everyone."
  ON jobs FOR SELECT
  USING ( true );

-- Job Experiences
CREATE POLICY "Public job experiences are viewable by everyone."
  ON job_experiences FOR SELECT
  USING ( true );

CREATE POLICY "Authenticated users can insert job experiences."
  ON job_experiences FOR INSERT
  WITH CHECK ( auth.role() = 'authenticated' );

-- 9. Create Auth Trigger for Automatic Profile Creation
-- This function runs when a new user signs up via Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, user_type, avatar_type)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'username', 'Anonymous'),
    COALESCE((new.raw_user_meta_data->>'user_type')::public.user_type_enum, 'individual'),
    COALESCE(new.raw_user_meta_data->>'avatar_type', 'blue_square')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
