import React from 'react';
import { Profile, Post } from './types';

interface ProfileViewProps {
  profile: Profile;
  posts: Post[];
  isOwnProfile: boolean;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ profile, posts, isOwnProfile }) => {
  return (
    <div className="profile-container">
      <div className="profile-header">
        <img src={profile.avatar_url || '/default-avatar.png'} alt={profile.username} className="avatar" />
        <h1>{profile.username}</h1>
        <p>{profile.bio}</p>
      </div>
      <div className="profile-posts">
        <h2>Posts</h2>
        {posts.map(post => (
          <div key={post.id} className="post-item">
            <p>{post.content}</p>
            {/* Add Like/Bookmark buttons here */}
          </div>
        ))}
      </div>
      {isOwnProfile && (
        <div className="bookmarks-section">
          <h2>Bookmarks</h2>
          {/* List bookmarked posts */}
        </div>
      )}
    </div>
  );
};
