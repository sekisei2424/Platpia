'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseService } from '@/services/supabaseService';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/lib/supabase/client';
import { Send } from 'lucide-react';
import PostForm from '@/components/ui/PostForm';
import JobDetailModal from '@/components/ui/JobDetailModal';

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
    
    // Post Feedback State
    const [isPostFormOpen, setIsPostFormOpen] = useState(false);
    const [feedbackJobId, setFeedbackJobId] = useState<string | null>(null);

    // Job Detail State
    const [selectedJob, setSelectedJob] = useState<any>(null);
    const [isJobModalOpen, setIsJobModalOpen] = useState(false);

    useEffect(() => {
        loadMessages();
        markAsRead();
        const unsubscribe = subscribeToMessages();
        return () => {
            unsubscribe();
        };
    }, [conversationId]);

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
                    // Prevent duplicates from optimistic updates
                    setMessages((prev) => {
                        if (prev.some(msg => msg.id === newMessage.id)) {
                            return prev;
                        }
                        return [...prev, newMessage];
                    });
                    // Mark as read when new message arrives if we are in the chat
                    markAsRead();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
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

        // Optimistic update
        setMessages((prev) => [...prev, tempMessage]);
        setNewMessage('');

        try {
            const sentMessage = await supabaseService.sendMessage(conversationId, user.id, tempMessage.content);
            setMessages((prev) => prev.map(msg => msg.id === tempId ? (sentMessage as Message) : msg));

        } catch (error) {
            console.error('Error sending message:', JSON.stringify(error, null, 2));
            setMessages((prev) => prev.filter(msg => msg.id !== tempId));
            alert('Failed to send message');
        }
    };

    const parseContent = (content: string) => {
        // Check for Post Feedback
        const feedbackMatch = content.match(/\[POST_FEEDBACK:(.+?)\]/);
        if (feedbackMatch) {
            const jobId = feedbackMatch[1];
            const text = content.replace(feedbackMatch[0], '').trim();
            return { text, action: 'post_feedback', jobId };
        }
        
        // Check for Job Link (Applied)
        // Format: [JOB_APPLIED:job_id] Text...
        // Or just detect the standard text if we didn't change the format yet.
        // But we should change the format in PostDetailModal/JobBoard to be robust.
        // For now, let's support a new format we will implement: [JOB_LINK:job_id]
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
            console.error("Error fetching job:", error);
            alert("案件情報の取得に失敗しました。");
        }
    };

    if (!user) return null;

    return (
        <div className="flex flex-col h-full relative">
            {/* Messages Area */}
            <div className="flex-grow overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => {
                    const isMe = msg.sender_id === user.id;
                    const isSystem = msg.message_type === 'system';
                    const isBooking = msg.message_type === 'booking_request';
                    const { text, action, jobId } = parseContent(msg.content);

                    if (isSystem) {
                        return (
                            <div key={msg.id} className="flex justify-center my-6">
                                <div className="bg-gray-100 text-gray-600 text-sm px-6 py-3 rounded-2xl text-center max-w-[85%] shadow-sm border border-gray-200">
                                    <p className="whitespace-pre-wrap font-medium">{text}</p>
                                    {action === 'post_feedback' && jobId && (
                                        <button 
                                            onClick={() => handlePostFeedback(jobId)} 
                                            className="mt-3 px-5 py-2 bg-village-accent text-white rounded-full text-sm font-bold hover:bg-green-600 transition-colors shadow-sm"
                                        >
                                            感想を投稿する
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    }

                    return (
                        <div
                            key={msg.id}
                            className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-[70%] rounded-2xl px-4 py-2 ${isMe
                                    ? 'bg-blue-500 text-white rounded-br-none'
                                    : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none shadow-sm'
                                    } ${isBooking ? 'border-l-4 border-village-accent' : ''}`}
                            >
                                <p className="whitespace-pre-wrap">{text}</p>
                                
                                {action === 'view_job' && jobId && (
                                    <button 
                                        onClick={() => handleViewJob(jobId)}
                                        className="mt-2 text-sm text-blue-600 hover:underline font-bold block bg-blue-50 px-3 py-1 rounded-lg w-full text-center"
                                    >
                                        案件詳細を見る
                                    </button>
                                )}

                                <span className={`text-xs opacity-70 mt-1 block ${isMe ? 'text-blue-100' : 'text-gray-400'}`}>
                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-gray-200">
                <form onSubmit={handleSend} className="flex gap-2">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-grow px-4 py-2 rounded-full border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                        type="submit"
                        disabled={!newMessage.trim()}
                        className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <Send size={20} />
                    </button>
                </form>
            </div>

            {/* Modals */}
            {isPostFormOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white rounded-xl w-full max-w-2xl m-4 max-h-[90vh] overflow-y-auto">
                        <PostForm onClose={() => setIsPostFormOpen(false)} />
                    </div>
                </div>
            )}

            <JobDetailModal 
                job={selectedJob} 
                isOpen={isJobModalOpen} 
                onClose={() => setIsJobModalOpen(false)}
                onApply={() => {}} // Already applied if viewing from chat usually
            />
        </div >
    );
}
