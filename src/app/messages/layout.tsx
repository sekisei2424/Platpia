'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabaseService } from '@/services/supabaseService';
import { supabase } from '@/lib/supabase/client';
import Sidebar from '@/components/ui/Sidebar';
import { User } from 'lucide-react';
import { getAvatarUrl } from '@/lib/avatar';

export default function MessagesLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user } = useAuth();
    const pathname = usePathname();
    const [conversations, setConversations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const isConversationOpen = pathname !== '/messages';

    useEffect(() => {
        if (user) {
            loadConversations();
            
            // Subscribe to any message insertion to update list order/unread count
            // This is a broad subscription, ideally filtering by user participation would be better
            const channel = supabase
                .channel('public:messages_list_update')
                .on(
                    'postgres_changes',
                    { event: 'INSERT', schema: 'public', table: 'messages' },
                    () => {
                        loadConversations();
                    }
                )
                .on(
                    'postgres_changes',
                    { 
                        event: 'UPDATE', 
                        schema: 'public', 
                        table: 'conversation_participants',
                        filter: `user_id=eq.${user.id}`
                    },
                    () => {
                        loadConversations();
                    }
                )
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        }
    }, [user]);

    const loadConversations = async () => {
        if (!user) return;
        const data = await supabaseService.fetchConversations(user.id);
        setConversations(data);
        setLoading(false);
    };

    return (
        <div className="flex h-[100dvh] flex-col md:flex-row font-pixel overflow-hidden">
            {/* Main Sidebar (Navigation) */}
            <div className={`flex-shrink-0 z-20 hidden md:block`}>
                <Sidebar onPostClick={() => { }} />
            </div>

            {/* Mobile Bottom Navigation (Only visible on mobile) */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 z-30">
                <Sidebar onPostClick={() => { }} />
            </div>

            {/* Messages Sidebar (Conversation List) */}
            <div className={`
                w-full md:w-80 bg-white border-r border-gray-200 flex-col h-full
                ${isConversationOpen ? 'hidden md:flex' : 'flex'}
                pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0
            `}>
                <div className="p-4 border-b border-gray-200 bg-gray-50 flex-shrink-0">
                    <h1 className="text-xl font-black text-gray-900 uppercase tracking-tighter">Messages</h1>
                </div>

                <div className="flex-grow overflow-y-auto custom-scrollbar">
                    {loading ? (
                        <div className="p-8 text-gray-400 font-bold text-center text-sm">LOADING...</div>
                    ) : conversations.length === 0 ? (
                        <div className="p-8 text-gray-400 font-bold text-center text-sm">
                            NO CONVERSATIONS YET
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {conversations.map((convo) => (
                                <Link
                                    key={convo.conversation_id}
                                    href={`/messages/${convo.conversation_id}`}
                                    className={`block p-4 hover:bg-yellow-50 transition-colors ${pathname === `/messages/${convo.conversation_id}` ? 'bg-yellow-50 border-l-4 border-gray-900' : 'border-l-4 border-transparent'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 border-2 border-gray-900 bg-white flex items-center justify-center flex-shrink-0 overflow-hidden shadow-[2px_2px_0px_#000]">
                                            {convo.other_user?.avatar_type ? (
                                                <img
                                                    src={getAvatarUrl(convo.other_user.avatar_type)}
                                                    alt={convo.other_user.username}
                                                    className="w-full h-full object-cover object-top"
                                                />
                                            ) : (
                                                <User size={20} />
                                            )}
                                        </div>
                                        <div className="min-w-0 flex-grow">
                                            <div className="flex justify-between items-baseline mb-1">
                                                <p className="font-black text-gray-900 truncate uppercase tracking-tight text-sm">
                                                    {convo.other_user?.username || 'UNKNOWN'}
                                                </p>
                                                {convo.last_message && (
                                                    <span className="text-[10px] font-bold text-gray-400 flex-shrink-0 ml-2">
                                                        {new Date(convo.last_message.created_at).toLocaleDateString()}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <p className={`text-xs truncate font-bold ${convo.is_unread ? 'text-gray-900' : 'text-gray-400'}`}>
                                                    {convo.last_message?.content || 'No messages'}
                                                </p>
                                                {convo.is_unread && (
                                                    <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0 ml-2 shadow-[1px_1px_0px_#000]"></div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div className={`
                flex-grow bg-gray-50 overflow-hidden relative
                ${!isConversationOpen ? 'hidden md:block' : 'block h-full'}
                pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0 
            `}>
                {children}
            </div>
        </div>
    );
}
