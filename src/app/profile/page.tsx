'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';

export default function ProfileRedirect() {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && user) {
            router.replace(`/profile/${user.id}`);
        } else if (!loading && !user) {
             router.replace('/'); 
        }
    }, [user, loading, router]);

    return <div className="flex items-center justify-center h-screen bg-white text-gray-900 font-pixel">Loading...</div>;
}
