'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ChatWindow from '@/components/messages/ChatWindow';
import { useAuth } from '@/components/auth/AuthProvider';

export default function ConversationPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.push('/auth');
        }
    }, [user, loading, router]);

    return (
        <div className="h-full">
            <ChatWindow conversationId="" />
        </div>
    );
}
