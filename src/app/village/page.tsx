'use client';

import { useState } from 'react';
import PhaserGame from '@/components/game/PhaserGame';
import Sidebar from '@/components/ui/Sidebar';
import Modal from '@/components/ui/Modal';
import JobBoard from '@/components/ui/JobBoard';
import PostForm from '@/components/ui/PostForm';

export default function VillagePage() {
    const [isJobBoardOpen, setIsJobBoardOpen] = useState(false);
    const [isPostFormOpen, setIsPostFormOpen] = useState(false);

    return (
        <main className="flex w-full h-screen bg-village-base overflow-hidden flex-col md:flex-row">
            {/* Sidebar Layer */}
            <div className="flex-shrink-0 z-20">
                <Sidebar onPostClick={() => setIsPostFormOpen(true)} />
            </div>

            {/* Game Layer */}
            <div className="flex-grow relative z-0 pb-16 md:pb-0">
                <PhaserGame
                    currentScene="village"
                    onOpenJobBoard={() => setIsJobBoardOpen(true)}
                    onOpenPost={() => { }} // No posts in village for now
                />
            </div>

            {/* Modals */}
            <Modal
                isOpen={isJobBoardOpen}
                onClose={() => setIsJobBoardOpen(false)}
                title="Village Jobs"
            >
                <JobBoard />
            </Modal>

            <Modal
                isOpen={isPostFormOpen}
                onClose={() => setIsPostFormOpen(false)}
                title="Share Experience"
            >
                <PostForm onClose={() => setIsPostFormOpen(false)} />
            </Modal>
        </main>
    );
}
