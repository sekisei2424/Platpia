-- Add job_id to plaza_posts to link posts to jobs
ALTER TABLE plaza_posts 
ADD COLUMN job_id UUID REFERENCES jobs(id);

-- Create job_bookmarks table
CREATE TABLE job_bookmarks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) NOT NULL,
    job_id UUID REFERENCES jobs(id) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, job_id)
);

-- Enable RLS for bookmarks
ALTER TABLE job_bookmarks ENABLE ROW LEVEL SECURITY;

-- Policies for bookmarks
CREATE POLICY "Users can view their own bookmarks" 
ON job_bookmarks FOR SELECT 
USING ( auth.uid() = user_id );

CREATE POLICY "Users can create their own bookmarks" 
ON job_bookmarks FOR INSERT 
WITH CHECK ( auth.uid() = user_id );

CREATE POLICY "Users can delete their own bookmarks" 
ON job_bookmarks FOR DELETE 
USING ( auth.uid() = user_id );
