-- Add new columns to jobs table
ALTER TABLE jobs 
ADD COLUMN description TEXT,
ADD COLUMN company_id UUID REFERENCES profiles(id),
ADD COLUMN location TEXT,
ADD COLUMN reward TEXT,
ADD COLUMN thumbnail_url TEXT,
ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL;

-- Enable RLS
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Jobs are viewable by everyone" 
ON jobs FOR SELECT 
USING (true);

CREATE POLICY "Companies can insert jobs" 
ON jobs FOR INSERT 
WITH CHECK (
  auth.uid() = company_id
);

CREATE POLICY "Companies can update their own jobs" 
ON jobs FOR UPDATE 
USING (
  auth.uid() = company_id
);

CREATE POLICY "Companies can delete their own jobs" 
ON jobs FOR DELETE 
USING (
  auth.uid() = company_id
);
