'use client';

import { useState } from 'react';
import { X, MessageCircle, Briefcase, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabaseService } from '@/services/supabaseService';
import { useRouter } from 'next/navigation';
import JobDetailModal from './JobDetailModal';

interface PostDetailModalProps {
    post: any;
    onClose: () => void;
    onNext?: () => void;
    onPrev?: () => void;
}

export default function PostDetailModal({ post, onClose, onNext, onPrev }: PostDetailModalProps) {
    const { user } = useAuth();
    const router = useRouter();
    const [selectedJob, setSelectedJob] = useState<any>(null);
    const [isJobModalOpen, setIsJobModalOpen] = useState(false);

    const handleMessage = async () => {
        if (!user) {
            alert('Please sign in to message');
            return;
        }
        if (user.id === post.id) return; 
    };

    const startConversation = async () => {
        if (!user) return;
        try {
            const targetUserId = post.user_id;

            if (!targetUserId) {
                console.error('No user_id found on post');
                return;
            }

            const convo = await supabaseService.createConversation(user.id, targetUserId);
            router.push(`/messages/${convo.id}`);
        } catch (error) {
            console.error('Error starting conversation:', error);
            alert('Could not start conversation');
        }
    };

    const handleJobClick = async () => {
        if (post.job_id) {
            try {
                const job = await supabaseService.fetchJob(post.job_id);
                setSelectedJob(job);
                setIsJobModalOpen(true);
            } catch (error) {
                console.error("Error fetching job:", error);
            }
        }
    };

    const handleApply = async (jobId: string) => {
        if (!user) {
            alert("応募するにはログインしてください。");
            return;
        }

        if (!selectedJob) return;
        
        try {
            // 1. Apply for job
            await supabaseService.applyForJob(jobId, user.id);
            
            // 2. Send message (if company_id exists)
            if (selectedJob.company_id) {
                try {
                    const { id: conversationId } = await supabaseService.createConversation(user.id, selectedJob.company_id);
                    
                    if (!conversationId) {
                        throw new Error("Failed to create conversation: No ID returned");
                    }

                    await supabaseService.sendMessage(
                        conversationId,
                        user.id,
                        `[JOB_LINK:${selectedJob.id}] 「${selectedJob.title}」の体験に応募しました。`,
                        'booking_request'
                    );
                    
                    setIsJobModalOpen(false);
                    onClose();
                    router.push(`/messages/${conversationId}`);
                    return;
                } catch (msgError) {
                    console.error("Error sending message:", msgError);
                    if (typeof msgError === 'object' && msgError !== null) {
                        console.error("Error details:", JSON.stringify(msgError, null, 2));
                    }
                    // Fall through to success alert
                }
            }

            alert("応募が完了しました。");
            setIsJobModalOpen(false);
            onClose();

        } catch (error: any) {
            console.error("Error applying:", error);
            if (error.code === '23505' || error.message?.includes('duplicate')) {
                alert("すでに応募済みです。");
            } else {
                alert(`応募に失敗しました: ${error.message || 'Unknown error'}`);
            }
        }
    };

    return (
        <>
            <div 
                className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8"
                onPointerDown={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
            >
                {/* Backdrop to close */}
                <div
                    className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                    onClick={(e) => {
                        e.stopPropagation();
                        onClose();
                    }}
                />

                <div className="relative w-full h-full flex flex-col md:flex-row gap-4 md:gap-8 pointer-events-none justify-center items-center">
                    {/* Avatar (Bottom Left on Desktop, Hidden on Mobile for space) */}
                    <div className="hidden md:block mt-auto pointer-events-auto animate-in zoom-in-50 fade-in duration-300 z-50">
                        <div
                            className="w-64 h-64 lg:w-80 lg:h-80 rounded-3xl shadow-2xl border-8 border-white flex items-center justify-center transform hover:scale-105 transition-transform overflow-hidden bg-white"
                        >
                            {post.avatarPath ? (
                                <img
                                    src={post.avatarPath}
                                    alt={post.username}
                                    className="w-full h-full object-contain p-4"
                                />
                            ) : (
                                <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400">
                                    No Image
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Content (Right Side - Larger) */}
                    <div className="flex-grow w-full md:w-auto h-full md:h-auto flex items-center justify-center pointer-events-auto animate-in zoom-in-95 fade-in duration-200">
                        
                        <div className="relative w-full max-w-4xl h-full md:h-[80vh]">
                            {/* Navigation Buttons */}
                            {onPrev && (
                                <button 
                                    onClick={(e) => { e.stopPropagation(); onPrev(); }}
                                    className="absolute left-2 xl:-left-16 top-1/2 transform -translate-y-1/2 p-2 md:p-4 bg-[#FDFBF7] border border-stone-200 rounded-full shadow-xl hover:bg-white hover:scale-110 transition-all z-50 text-gray-700"
                                    aria-label="Previous post"
                                >
                                    <ChevronLeft size={24} className="md:w-8 md:h-8" />
                                </button>
                            )}

                            {onNext && (
                                <button 
                                    onClick={(e) => { e.stopPropagation(); onNext(); }}
                                    className="absolute right-2 xl:-right-16 top-1/2 transform -translate-y-1/2 p-2 md:p-4 bg-[#FDFBF7] border border-stone-200 rounded-full shadow-xl hover:bg-white hover:scale-110 transition-all z-50 text-gray-700"
                                    aria-label="Next post"
                                >
                                    <ChevronRight size={24} className="md:w-8 md:h-8" />
                                </button>
                            )}

                            <div className="w-full h-full bg-[#FDFBF7] rounded-3xl shadow-2xl p-6 md:p-12 border border-stone-200 relative flex flex-col overflow-hidden">
                                <button
                                    onClick={onClose}
                                    className="absolute top-4 right-4 md:top-6 md:right-6 text-gray-400 hover:text-gray-800 transition-colors z-10"
                                >
                                    <X size={24} className="md:w-8 md:h-8" />
                                </button>

                                <div className="flex items-center gap-4 md:gap-6 mb-6 md:mb-8 border-b border-gray-100 pb-4 md:pb-6 flex-shrink-0">
                                    <div className="w-12 h-12 md:w-16 md:h-16 rounded-full shadow-md overflow-hidden bg-gray-100 flex-shrink-0">
                                        {post.avatarPath && (
                                            <img
                                                src={post.avatarPath}
                                                alt={post.username}
                                                className="w-full h-full object-cover"
                                            />
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <h2 className="text-2xl md:text-4xl font-bold text-gray-800 truncate">{post.username}</h2>
                                        <span className="text-gray-500 text-sm md:text-lg">Just now • Plaza</span>
                                    </div>
                                </div>

                                <div className="prose prose-lg md:prose-xl max-w-none flex-grow overflow-y-auto pr-2 md:pr-4 custom-scrollbar">
                                    <p className="text-lg md:text-2xl text-gray-700 leading-relaxed whitespace-pre-wrap break-words">
                                        {post.content}
                                    </p>

                                    {/* Post Image */}
                                    {post.image_url && (
                                        <div className="mt-4 md:mt-6 rounded-2xl overflow-hidden shadow-md">
                                        <img 
                                            src={post.image_url} 
                                            alt="Post content" 
                                            className="w-full h-auto object-cover max-h-60 md:max-h-96"
                                        />
                                    </div>
                                )}
                                
                                {/* Job Attachment */}
                                {post.job_id && (
                                    <div 
                                        onClick={handleJobClick}
                                        className="mt-6 md:mt-8 p-4 md:p-6 bg-blue-50 rounded-2xl border border-blue-100 cursor-pointer hover:bg-blue-100 transition-colors group"
                                    >
                                        <div className="flex items-center gap-2 md:gap-3 mb-2 text-blue-600 font-bold">
                                            <Briefcase size={20} className="md:w-6 md:h-6" />
                                            <span className="text-sm md:text-base">関連する体験</span>
                                        </div>
                                        <h3 className="text-lg md:text-xl font-bold text-gray-800 group-hover:text-blue-700 transition-colors">
                                            {post.job_title || '体験の詳細を見る'}
                                        </h3>
                                        <p className="text-gray-500 mt-1 text-sm md:text-base">クリックして詳細を確認・応募する</p>
                                    </div>
                                )}
                            </div>

                            <div className="mt-6 md:mt-8 pt-4 md:pt-6 border-t border-gray-100 flex gap-4 md:gap-6 flex-shrink-0">
                                <button className="flex-1 py-3 md:py-4 bg-gray-100 text-gray-700 rounded-2xl font-bold text-lg md:text-xl hover:bg-gray-200 transition-colors">
                                    Like
                                </button>
                                {user && user.id !== post.user_id && (
                                    <button
                                        onClick={startConversation}
                                        className="flex-1 py-3 md:py-4 bg-blue-500 text-white rounded-2xl font-bold text-lg md:text-xl shadow-lg hover:bg-blue-600 hover:shadow-xl transition-all transform hover:-translate-y-1 flex items-center justify-center gap-2"
                                    >
                                        <MessageCircle size={20} className="md:w-6 md:h-6" />
                                        Message
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                    </div>
                </div>
            </div>

            <JobDetailModal 
                job={selectedJob} 
                isOpen={isJobModalOpen} 
                onClose={() => setIsJobModalOpen(false)}
                onApply={handleApply}
            />
        </>
    );
}
