'use client';

import { useState } from 'react';
import Sidebar from '@/components/ui/Sidebar';
import PostForm from '@/components/ui/PostForm';
import Modal from '@/components/ui/Modal';
import JobBoard from '@/components/ui/JobBoard';
import { Search as SearchIcon } from 'lucide-react';

export default function SearchPage() {
    const [isPostFormOpen, setIsPostFormOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    return (
        <main className="flex w-full h-screen bg-village-base overflow-hidden flex-col md:flex-row">
            {/* Sidebar Layer */}
            <div className="flex-shrink-0 z-20">
                <Sidebar onPostClick={() => setIsPostFormOpen(true)} />
            </div>

            {/* Content Layer */}
            <div className="flex-grow relative z-0 overflow-y-auto bg-gray-50 pb-20 md:pb-0">
                <div className="max-w-4xl mx-auto p-8">
                    <h1 className="text-3xl font-bold text-gray-800 mb-8">村を探索</h1>

                    {/* Search Bar */}
                    <div className="relative mb-12">
                        <input
                            type="text"
                            placeholder="人、仕事、投稿を検索..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full p-4 pl-12 rounded-2xl border-none shadow-lg bg-white text-lg text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-village-accent outline-none transition-all"
                        />
                        <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={24} />
                    </div>

                    {/* Categories / Tags */}
                    <div className="flex gap-4 mb-12 overflow-x-auto pb-4">
                        {['すべて', '農業', '職人', 'イベント', '依頼'].map((tag) => (
                            <button key={tag} className="px-6 py-2 bg-white rounded-full shadow-sm hover:shadow-md hover:bg-village-accent hover:text-white transition-all text-gray-600 font-medium whitespace-nowrap">
                                {tag}
                            </button>
                        ))}
                    </div>

                    {/* Job Board Integration */}
                    <div className="mb-8">
                        <h2 className="text-xl font-bold text-gray-800 mb-4">募集中の体験</h2>
                        <JobBoard />
                    </div>
                </div>
            </div>

            {/* Modals */}
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
