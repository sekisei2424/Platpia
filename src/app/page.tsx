'use client';

import { useState } from 'react';
import PhaserGame from '@/components/game/PhaserGame';
import Sidebar from '@/components/ui/Sidebar';
import Modal from '@/components/ui/Modal';
import JobBoard from '@/components/ui/JobBoard';
import PostForm from '@/components/ui/PostForm';
import PostDetailModal from '@/components/ui/PostDetailModal';
import { X } from 'lucide-react';

export default function Home() {
  const [isJobBoardOpen, setIsJobBoardOpen] = useState(false);
  const [isPostFormOpen, setIsPostFormOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);

  const handleNextPost = () => {
    if (!selectedPost || posts.length === 0) return;
    const currentIndex = posts.findIndex(p => p.id === selectedPost.id);
    if (currentIndex === -1) return;
    const nextIndex = (currentIndex + 1) % posts.length;
    setSelectedPost(posts[nextIndex]);
  };

  const handlePrevPost = () => {
    if (!selectedPost || posts.length === 0) return;
    const currentIndex = posts.findIndex(p => p.id === selectedPost.id);
    if (currentIndex === -1) return;
    const prevIndex = (currentIndex - 1 + posts.length) % posts.length;
    setSelectedPost(posts[prevIndex]);
  };

  return (
    <main className="flex w-full h-screen bg-village-base overflow-hidden flex-col md:flex-row">
      {/* Sidebar Layer */}
      <div className="flex-shrink-0 z-20">
        <Sidebar
          onPostClick={() => setIsPostFormOpen(true)}
        />
      </div>

      {/* Game Layer */}
      <div className="flex-grow relative z-0 pb-16 md:pb-0">
        <PhaserGame
          currentScene="plaza"
          onOpenJobBoard={() => setIsJobBoardOpen(true)}
          onOpenPost={(post) => setSelectedPost(post)}
          onPostsLoaded={(loadedPosts) => setPosts(loadedPosts)}
        />
      </div>

      {/* Modals */}
      <Modal
        isOpen={isJobBoardOpen}
        onClose={() => setIsJobBoardOpen(false)}
        title="Village Jobs"
        maxWidth="max-w-5xl"
      >
        <JobBoard />
      </Modal>

      <Modal
        isOpen={isPostFormOpen}
        onClose={() => setIsPostFormOpen(false)}
        title="Share Experience"
        maxWidth="max-w-2xl"
      >
        <PostForm onClose={() => setIsPostFormOpen(false)} />
      </Modal>

      {/* Post Detail Overlay */}
      {selectedPost && (
        <PostDetailModal
          post={selectedPost}
          onClose={() => setSelectedPost(null)}
          onNext={posts.length > 1 ? handleNextPost : undefined}
          onPrev={posts.length > 1 ? handlePrevPost : undefined}
        />
      )}
    </main>
  );
}
