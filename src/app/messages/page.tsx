'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';

export default function MessagesPage() {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.push('/auth');
        }
    }, [user, loading, router]);

    return (
        <div className="h-full flex items-center justify-center text-gray-400">
            <div className="text-center">
                <p className="text-lg">Select a conversation to start chatting</p>
            </div>
        </div>
    );
}
