-- ==========================================
-- Platopia Database Rebuild Schema
-- ==========================================

-- 1. Clean up existing tables (Order matters for foreign keys)
DROP TABLE IF EXISTS job_bookmarks CASCADE;
DROP TABLE IF EXISTS plaza_posts CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS conversation_participants CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;
DROP TABLE IF EXISTS job_applications CASCADE; -- New table replacing bookings/job_experiences
DROP TABLE IF EXISTS bookings CASCADE; -- Old table
DROP TABLE IF EXISTS job_experiences CASCADE; -- Old table
DROP TABLE IF EXISTS jobs CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- 2. Create Tables

-- Profiles: Users and Companies
CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    username TEXT,
    user_type TEXT CHECK (user_type IN ('individual', 'company')) NOT NULL DEFAULT 'individual',
    avatar_type TEXT, -- e.g., 'character_murabito_young_man_blue.svg'
    bio TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Jobs: Experiences offered by companies
CREATE TABLE jobs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID REFERENCES profiles(id) NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    location TEXT,
    reward TEXT,
    thumbnail_url TEXT,
    status TEXT CHECK (status IN ('open', 'closed', 'draft')) DEFAULT 'open',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Job Applications: Managing the flow from application to completion
CREATE TABLE job_applications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    job_id UUID REFERENCES jobs(id) NOT NULL,
    applicant_id UUID REFERENCES profiles(id) NOT NULL,
    status TEXT CHECK (status IN ('pending', 'approved', 'rejected', 'completed', 'cancelled')) DEFAULT 'pending',
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(job_id, applicant_id) -- Prevent double application
);

-- Plaza Posts: Sharing experiences
CREATE TABLE plaza_posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) NOT NULL,
    job_id UUID REFERENCES jobs(id), -- Optional for companies, Required for individuals (enforced by app logic/RLS)
    content TEXT NOT NULL,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Job Bookmarks: Saved jobs
CREATE TABLE job_bookmarks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) NOT NULL,
    job_id UUID REFERENCES jobs(id) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, job_id)
);

-- Conversations: Chat rooms
CREATE TABLE conversations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Conversation Participants: Who is in the chat
CREATE TABLE conversation_participants (
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    last_read_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (conversation_id, user_id)
);

-- Messages: Chat content
CREATE TABLE messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES profiles(id) NOT NULL,
    content TEXT NOT NULL,
    message_type TEXT CHECK (message_type IN ('text', 'booking_request', 'system', 'image')) DEFAULT 'text',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE plaza_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- 4. Create Basic Policies (Simplified for development, tighten for production)

-- Profiles
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Jobs
CREATE POLICY "Jobs are viewable by everyone" ON jobs FOR SELECT USING (true);
CREATE POLICY "Companies can insert jobs" ON jobs FOR INSERT WITH CHECK (auth.uid() = company_id);
CREATE POLICY "Companies can update own jobs" ON jobs FOR UPDATE USING (auth.uid() = company_id);

-- Job Applications
CREATE POLICY "Users can view own applications" ON job_applications FOR SELECT USING (auth.uid() = applicant_id OR auth.uid() IN (SELECT company_id FROM jobs WHERE id = job_id));
CREATE POLICY "Users can create applications" ON job_applications FOR INSERT WITH CHECK (auth.uid() = applicant_id);
CREATE POLICY "Participants can update applications" ON job_applications FOR UPDATE USING (auth.uid() = applicant_id OR auth.uid() IN (SELECT company_id FROM jobs WHERE id = job_id));

-- Plaza Posts
CREATE POLICY "Posts are viewable by everyone" ON plaza_posts FOR SELECT USING (true);
CREATE POLICY "Users can insert own posts" ON plaza_posts FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Job Bookmarks
CREATE POLICY "Users can view own bookmarks" ON job_bookmarks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own bookmarks" ON job_bookmarks FOR ALL USING (auth.uid() = user_id);

-- Chat System (Simplified)
CREATE POLICY "Users can view conversations they are in" ON conversations FOR SELECT USING (EXISTS (SELECT 1 FROM conversation_participants WHERE conversation_id = id AND user_id = auth.uid()));
CREATE POLICY "Users can view participants of their conversations" ON conversation_participants FOR SELECT USING (conversation_id IN (SELECT conversation_id FROM conversation_participants WHERE user_id = auth.uid()));
CREATE POLICY "Users can view messages in their conversations" ON messages FOR SELECT USING (conversation_id IN (SELECT conversation_id FROM conversation_participants WHERE user_id = auth.uid()));
CREATE POLICY "Users can insert messages in their conversations" ON messages FOR INSERT WITH CHECK (conversation_id IN (SELECT conversation_id FROM conversation_participants WHERE user_id = auth.uid()));

-- 5. Functions

-- Function to create a new conversation or get existing one
CREATE OR REPLACE FUNCTION create_new_conversation(other_user_id UUID)
RETURNS UUID AS $$
DECLARE
    convo_id UUID;
    current_user_id UUID;
BEGIN
    current_user_id := auth.uid();

    -- Check if conversation already exists between these two
    SELECT c.id INTO convo_id
    FROM conversations c
    JOIN conversation_participants cp1 ON c.id = cp1.conversation_id
    JOIN conversation_participants cp2 ON c.id = cp2.conversation_id
    WHERE cp1.user_id = current_user_id AND cp2.user_id = other_user_id
    LIMIT 1;

    -- If not exists, create new
    IF convo_id IS NULL THEN
        INSERT INTO conversations DEFAULT VALUES RETURNING id INTO convo_id;
        INSERT INTO conversation_participants (conversation_id, user_id) VALUES (convo_id, current_user_id);
        INSERT INTO conversation_participants (conversation_id, user_id) VALUES (convo_id, other_user_id);
    END IF;

    RETURN convo_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get unread count
CREATE OR REPLACE FUNCTION get_unread_count()
RETURNS INTEGER AS $$
DECLARE
    unread_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO unread_count
    FROM messages m
    JOIN conversation_participants cp ON m.conversation_id = cp.conversation_id
    WHERE cp.user_id = auth.uid()
    AND m.created_at > cp.last_read_at
    AND m.sender_id != auth.uid();
    
    RETURN unread_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Insert Dummy Data (Optional, but helpful for rebuild)
-- Note: You will need to manually create users in Auth or use existing UIDs to make this work perfectly.
-- For now, we leave the tables empty ready for fresh data.
