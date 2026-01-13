'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseService } from '@/services/supabaseService';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/lib/supabase/client';
import { getAvatarUrl } from '@/lib/avatar';
import { Send, User, ChevronLeft } from 'lucide-react';
import PostForm from '@/components/ui/PostForm';
import JobDetailModal from '@/components/ui/JobDetailModal';
import Modal from '@/components/ui/Modal';

interface Message {
    id: string;
    content: string;
    sender_id: string;
    created_at: string;
    message_type: 'text' | 'booking_request' | 'system';
}

interface ChatWindowProps {
    conversationId: string;
}

export default function ChatWindow({ conversationId }: ChatWindowProps) {
    const { user } = useAuth();
    const router = useRouter();
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    
    const [isPostFormOpen, setIsPostFormOpen] = useState(false);
    const [feedbackJobId, setFeedbackJobId] = useState<string | null>(null);
    const [selectedJob, setSelectedJob] = useState<any>(null);
    const [isJobModalOpen, setIsJobModalOpen] = useState(false);
    const [otherUser, setOtherUser] = useState<any>(null);

    useEffect(() => {
        loadMessages();
        markAsRead();
        const unsubscribe = subscribeToMessages();
        return () => unsubscribe();
    }, [conversationId]);

    useEffect(() => {
        if (!user) return;
        loadConversationDetails();
    }, [conversationId, user]);

    const markAsRead = async () => {
        await supabaseService.markAsRead(conversationId);
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const loadMessages = async () => {
        const data = await supabaseService.fetchMessages(conversationId);
        setMessages(data as Message[]);
    };

    const loadConversationDetails = async () => {
        if (!user) return;
        const details = await supabaseService.fetchConversationDetails(conversationId, user.id);
        setOtherUser(details);
    };

    const subscribeToMessages = () => {
        const channel = supabase
            .channel(`conversation:${conversationId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `conversation_id=eq.${conversationId}`
                },
                (payload) => {
                    const newMessage = payload.new as Message;
                    setMessages((prev) => {
                        if (prev.some(msg => msg.id === newMessage.id)) return prev;
                        return [...prev, newMessage];
                    });
                    markAsRead();
                }
            )
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !user) return;

        const tempId = crypto.randomUUID();
        const tempMessage: Message = {
            id: tempId,
            content: newMessage,
            sender_id: user.id,
            created_at: new Date().toISOString(),
            message_type: 'text'
        };

        setMessages((prev) => [...prev, tempMessage]);
        setNewMessage('');

        try {
            const sentMessage = await supabaseService.sendMessage(conversationId, user.id, tempMessage.content);
            setMessages((prev) => prev.map(msg => msg.id === tempId ? (sentMessage as Message) : msg));
        } catch (error) {
            setMessages((prev) => prev.filter(msg => msg.id !== tempId));
            alert('Failed to send message');
        }
    };

    const parseContent = (content: string) => {
        const feedbackMatch = content.match(/\[POST_FEEDBACK:(.+?)\]/);
        if (feedbackMatch) {
            const jobId = feedbackMatch[1];
            const text = content.replace(feedbackMatch[0], '').trim();
            return { text, action: 'post_feedback', jobId };
        }
        const jobLinkMatch = content.match(/\[JOB_LINK:(.+?)\]/);
        if (jobLinkMatch) {
            const jobId = jobLinkMatch[1];
            const text = content.replace(jobLinkMatch[0], '').trim();
            return { text, action: 'view_job', jobId };
        }
        return { text: content, action: null };
    };

    const handlePostFeedback = (jobId: string) => {
        setFeedbackJobId(jobId);
        setIsPostFormOpen(true);
    };

    const handleViewJob = async (jobId: string) => {
        try {
            const job = await supabaseService.fetchJob(jobId);
            setSelectedJob(job);
            setIsJobModalOpen(true);
        } catch (error) {
            alert("案件情報の取得に失敗しました。");
        }
    };

    if (!user) return null;

    return (
        <div className="flex flex-col h-full bg-white border-l-4 border-gray-900 font-pixel">
            {/* Header */}
            <div className="bg-white border-b-4 border-gray-900 p-4 flex items-center justify-between shadow-[0_4px_0_rgba(0,0,0,0.05)] shrink-0 z-10 sticky top-0">
                <div className="flex items-center gap-3">
                    {/* Back Button for Mobile */}
                    <button 
                        onClick={() => router.push('/messages')}
                        className="md:hidden p-2 -ml-2 text-gray-900 hover:bg-gray-100 rounded-full"
                    >
                        <ChevronLeft size={24} />
                    </button>
                    
                    {otherUser ? (
                        <div 
                            className="flex items-center gap-3 cursor-pointer group" 
                            onClick={() => router.push(`/profile/${otherUser.id}`)}
                        >
                            <div className="w-10 h-10 border-2 border-gray-900 rounded-full overflow-hidden shadow-[2px_2px_0px_#000] relative bg-white">
                                {otherUser.avatar_type ? (
                                    <img src={getAvatarUrl(otherUser.avatar_type)} alt={otherUser.username} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gray-100">
                                        <User size={20} />
                                    </div>
                                )}
                            </div>
                            <div>
                                <h2 className="text-lg font-black uppercase tracking-tighter group-hover:underline decoration-2 underline-offset-2">
                                    {otherUser.username}
                                </h2>
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                                    {otherUser.user_type === 'company' ? 'CORPORATE' : 'RESIDENT'}
                                </span>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 border-2 border-gray-900 flex items-center justify-center bg-gray-50 shadow-[2px_2px_0px_#000]">
                                <User size={20} />
                            </div>
                            <h2 className="text-xl font-black uppercase tracking-tighter">Conversation</h2>
                        </div>
                    )}
                </div>
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-grow overflow-y-auto p-6 space-y-6 bg-gray-50/30">
                {messages.map((msg) => {
                    const isMe = msg.sender_id === user.id;
                    const isSystem = msg.message_type === 'system';
                    const { text, action, jobId } = parseContent(msg.content);

                    if (isSystem) {
                        return (
                            <div key={msg.id} className="flex justify-center my-6">
                                <div className="bg-gray-100 border-2 border-gray-900 px-6 py-3 text-center max-w-[85%] shadow-[4px_4px_0_#000]">
                                    <p className="text-[10px] font-bold text-gray-500 uppercase mb-1">Notice</p>
                                    <p className="text-xs font-bold leading-relaxed">{text}</p>
                                    {action === 'post_feedback' && jobId && (
                                        <button 
                                            onClick={() => handlePostFeedback(jobId)} 
                                            className="mt-3 w-full py-1.5 bg-gray-900 text-white border-2 border-gray-900 text-[10px] font-black hover:bg-white hover:text-gray-900 transition-all shadow-[2px_2px_0_#000] active:translate-y-[1px] active:shadow-none"
                                        >
                                            POST EXPERIENCE
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    }

                    return (
                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] relative group`}>
                                <div className={`
                                    px-4 py-3 border-2 border-gray-900 shadow-[4px_4px_0_#000]
                                    ${isMe ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}
                                `}>
                                    <p className="text-sm font-bold leading-relaxed whitespace-pre-wrap">{text}</p>
                                    
                                    {action === 'view_job' && jobId && (
                                        <button 
                                            onClick={() => handleViewJob(jobId)}
                                            className={`mt-3 w-full border-2 py-1 text-[10px] font-black tracking-widest uppercase transition-all
                                                ${isMe ? 'border-white bg-white text-gray-900 hover:bg-gray-200' : 'border-gray-900 bg-gray-900 text-white hover:bg-gray-800'}
                                            `}
                                        >
                                            View Job Detail
                                        </button>
                                    )}
                                </div>
                                <div className={`text-[9px] font-bold mt-2 uppercase tracking-tighter ${isMe ? 'text-right' : 'text-left'} text-gray-400`}>
                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div className="p-5 bg-white border-t-4 border-gray-900 shadow-[0_-4px_0_rgba(0,0,0,0.05)]">
                <form onSubmit={handleSend} className="flex gap-3">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="TYPE MESSAGE..."
                        className="flex-grow h-12 px-4 bg-white border-2 border-gray-900 shadow-[inset_2px_2px_0_rgba(0,0,0,0.1)] outline-none font-bold text-sm focus:bg-gray-50 transition-colors placeholder:text-gray-300"
                    />
                    <button
                        type="submit"
                        disabled={!newMessage.trim()}
                        className="w-12 h-12 flex items-center justify-center bg-gray-900 text-white border-2 border-gray-900 shadow-[4px_4px_0_#000] hover:bg-gray-800 active:translate-y-[2px] active:shadow-none disabled:opacity-30 disabled:translate-y-0 transition-all"
                    >
                        <Send size={18} strokeWidth={3} />
                    </button>
                </form>
            </div>

            {/* Modals */}
            {isPostFormOpen && (
                <Modal isOpen={isPostFormOpen} onClose={() => setIsPostFormOpen(false)} title="Share Experience">
                    <PostForm onClose={() => setIsPostFormOpen(false)} />
                </Modal>
            )}

            <JobDetailModal 
                job={selectedJob} 
                isOpen={isJobModalOpen} 
                onClose={() => setIsJobModalOpen(false)}
                onApply={() => {}}
            />
        </div>
    );
}