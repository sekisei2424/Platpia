'use client';

import { useState } from 'react';
import Image from 'next/image';
import AuthModal from '@/components/auth/AuthModal';
import { useAuth } from '@/components/auth/AuthProvider';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthPage() {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        // ログイン済みならプロフィールにリダイレクト
        if (!loading && user) {
            router.push('/profile');
        }
    }, [user, loading, router]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-100 text-white font-pixel">
                Loading...
            </div>
        );
    }

    return (
        <main className="flex w-full h-screen bg-white overflow-hidden flex-col md:flex-row font-pixel text-gray-900 select-none">
            {/* 背景層 - Search ページと同じ構造 */}
            <div className="flex-grow relative z-0 overflow-y-auto pb-20 md:pb-0 bg-white flex items-center justify-center p-4">
                <div className="w-full max-w-md flex flex-col items-center justify-center gap-8">
                    {/* ロゴ */}
                    <Image
                        src="/images/Platpia_logo.png"
                        alt="Platpia Logo"
                        width={120}
                        height={120}
                        className="w-32 h-auto filter drop-shadow-lg"
                    />
                    
                    {/* ログインモーダル */}
                    <AuthModal
                        isOpen={true}
                        onClose={() => {
                            // ログイン後はプロフィールへ
                            router.push('/profile');
                        }}
                    />
                </div>
            </div>
        </main>
    );
}
