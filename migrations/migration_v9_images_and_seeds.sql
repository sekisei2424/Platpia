-- Add image_url to plaza_posts
ALTER TABLE plaza_posts 
ADD COLUMN image_url TEXT;

-- Create Storage Bucket for Post Images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('post_images', 'post_images', true);

-- Storage Policies
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT 
USING ( bucket_id = 'post_images' );

CREATE POLICY "Authenticated users can upload" 
ON storage.objects FOR INSERT 
WITH CHECK ( 
  bucket_id = 'post_images' 
  AND auth.role() = 'authenticated' 
);

CREATE POLICY "Users can update their own images" 
ON storage.objects FOR UPDATE 
USING ( 
  bucket_id = 'post_images' 
  AND auth.uid() = owner 
);

CREATE POLICY "Users can delete their own images" 
ON storage.objects FOR DELETE 
USING ( 
  bucket_id = 'post_images' 
  AND auth.uid() = owner 
);

-- Insert Mock Data for Jobs (using placeholder images for now, replace with your Supabase URLs later)
INSERT INTO jobs (title, description, company_id, location, reward, thumbnail_url, status)
VALUES 
(
  'Organic Farming Experience', 
  'Help us harvest seasonal vegetables! You will learn about organic farming methods and get to take home a basket of fresh produce.',
  (SELECT id FROM profiles LIMIT 1), -- Assign to the first user found as a placeholder
  'Green Valley Farm',
  'Fresh Vegetables Basket',
  'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=800&q=80',
  'open'
),
(
  'Traditional Pottery Workshop', 
  'Learn the basics of pottery from a master craftsman. Create your own cup or bowl.',
  (SELECT id FROM profiles LIMIT 1),
  'Artisan District',
  'Your own pottery creation',
  'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=800&q=80',
  'open'
),
(
  'Community Cafe Helper', 
  'Join our friendly team for a day! Serve coffee and chat with locals.',
  (SELECT id FROM profiles LIMIT 1),
  'Sunrise Cafe',
  'Free Lunch & Coffee',
  'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&q=80',
  'open'
);
