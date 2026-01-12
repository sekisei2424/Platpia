'use client';

import { useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import ChatWindow from '@/components/messages/ChatWindow';
import { useAuth } from '@/components/auth/AuthProvider';
import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import PostForm from '@/components/ui/PostForm';

export default function ConversationPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { user, loading } = useAuth();
    const [isPostFormOpen, setIsPostFormOpen] = useState(false);
    const router = useRouter();
    const resolvedParams = use(params);

    useEffect(() => {
        if (!loading && !user) {
            router.push('/auth');
        }
    }, [user, loading, router]);

    return (
        // 外部のlayout.tsxでSidebarが既に定義されている前提で、Sidebarを削除
        <main className="flex-grow relative z-0 bg-gray-100/50 flex flex-col h-screen font-pixel text-gray-900 select-none">
            {/* Main Chat Area */}
            <div className="flex-grow flex flex-col overflow-hidden">
                <ChatWindow conversationId={resolvedParams.id} />
            </div>

            {/* Global Post Modal - Sidebarの投稿ボタン用 */}
            <Modal isOpen={isPostFormOpen} onClose={() => setIsPostFormOpen(false)} title="Share Experience">
                <PostForm onClose={() => setIsPostFormOpen(false)} />
            </Modal>
        </main>
    );
}