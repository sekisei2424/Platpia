export interface Profile {
  id: string;
  username: string;
  bio: string | null;
  avatar_url: string | null;
  // Add other necessary fields
}

export interface Post {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  likes_count: number;
  // Add other necessary fields
}
