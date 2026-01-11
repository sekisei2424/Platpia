'use client';

import { useState, useEffect } from 'react';
import { X, MessageCircle, Briefcase, ChevronLeft, ChevronRight, Heart, Bookmark } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabaseService } from '@/services/supabaseService';
import { useRouter } from 'next/navigation';
import JobDetailModal from './JobDetailModal';
import { getAvatarUrl } from '@/lib/avatar';

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

        // Start conversation logic
        try {
            const targetUserId = post.user_id;
            if (!targetUserId) return;
            
            const convo = await supabaseService.createConversation(user.id, targetUserId);
            // Close modal and navigate
            onClose();
            router.push(`/messages/${convo.id}`);
        } catch (error) {
            console.error('Error starting conversation:', error);
            alert('Could not start conversation');
        }
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

    const handleJobClick = async (e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
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

    const handleAvatarClick = () => {
        if (post.user_id) {
            onClose(); // Close the modal
            router.push(`/profile/${post.user_id}`);
        }
    };

    if (!post) return null;

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm font-pixel" 
            onClick={onClose}
            onMouseDown={(e) => e.stopPropagation()} 
            onPointerDown={(e) => e.stopPropagation()}
        >
            <div 
                className="relative flex items-center justify-center pointer-events-none md:pointer-events-auto w-full max-w-4xl"
            >
                {/* Left Navigation Button - Relative to Modal */}
                {onPrev && (
                    <button 
                        onClick={(e) => { 
                            e.stopPropagation(); 
                            onPrev(); 
                        }}
                        onMouseDown={(e) => e.stopPropagation()}
                        onPointerDown={(e) => e.stopPropagation()}
                        className="pointer-events-auto absolute left-2 lg:-left-14 top-1/2 -translate-y-1/2 z-[60] p-3 bg-white border-4 border-gray-900 shadow-[4px_4px_0px_0px_#000] hover:bg-gray-100 active:shadow-none transition-all rounded-lg flex items-center justify-center w-12 h-12 md:w-auto md:h-auto"
                        aria-label="Previous"
                    >
                        <ChevronLeft size={24} strokeWidth={3} className="text-gray-900 md:w-8 md:h-8" />
                    </button>
                )}

                <div 
                    className="bg-white w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col md:flex-row border-4 border-gray-900 shadow-[8px_8px_0px_0px_#000] relative z-50 mx-4 md:mx-0"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Close Button (Mobile Only: Absolute Top-Right) */}
                    <button 
                        onClick={onClose}
                        className="md:hidden absolute top-2 right-2 z-[70] p-2 bg-white border-2 border-gray-900 shadow-[2px_2px_0px_0px_#000] active:translate-y-0.5 active:shadow-none text-gray-900"
                        aria-label="Close"
                    >
                        <X size={20} strokeWidth={3} />
                    </button>
                    
                    {/* Decorative Corners */}
                    <div className="absolute top-0 left-0 w-4 h-4 border-r-4 border-b-4 border-gray-900 bg-white z-20"></div>
                    <div className="hidden md:block absolute top-0 right-0 w-4 h-4 border-l-4 border-b-4 border-gray-900 bg-white z-20"></div>
                    <div className="absolute bottom-0 left-0 w-4 h-4 border-r-4 border-t-4 border-gray-900 bg-white z-20"></div>
                    <div className="absolute bottom-0 right-0 w-4 h-4 border-l-4 border-t-4 border-gray-900 bg-white z-20"></div>

                    {/* Left Side: Avatar & Basic Info */}
                    <div className="w-full md:w-1/3 bg-green-50/50 md:border-r-4 border-gray-900 p-6 flex flex-col items-center justify-center relative shrink-0">
                        <div className="absolute top-0 left-0 w-full h-full opacity-10 pattern-dots pointer-events-none"></div>
                        
                        {/* User Badge */}
                        <div className="absolute top-4 left-4 bg-white border-2 border-gray-900 px-2 py-1 shadow-[2px_2px_0px_0px_#000]">
                             <span className="text-xs font-black text-gray-900 uppercase">
                                 {post.user_type === 'company' ? 'CORP' : 'USER'}
                             </span>
                        </div>

                        <div className="w-32 h-32 md:w-56 md:h-56 bg-white border-4 border-gray-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] rounded-full overflow-hidden mb-4 md:mb-6 relative group cursor-pointer" onClick={handleAvatarClick}>
                            <img
                                src={getAvatarUrl(post.avatar_type || post.avatarPath)}
                                alt={post.username}
                                className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-110"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                    (e.target as HTMLImageElement).parentElement!.innerText = 'No Image';
                                }}
                            />
                        </div>
                        
                        <h2 className="text-xl md:text-2xl font-black text-gray-900 text-center mb-2 tracking-tight">
                            {post.username}
                        </h2>
                        
                        <div className="flex gap-2 mt-4">
                            {(!user || user.id !== post.user_id) && (
                                <button 
                                    onClick={handleMessage}
                                    className="p-3 bg-white border-2 border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white transition-all shadow-[2px_2px_0px_0px_#000] active:translate-y-[2px] active:shadow-none"
                                    title="Message"
                                >
                                    <MessageCircle size={20} />
                                </button>
                            )}
                            {post.job_id && (
                                <button
                                    onClick={handleJobClick}
                                    className="px-4 py-2 bg-yellow-400 border-2 border-gray-900 text-gray-900 font-bold hover:bg-yellow-300 transition-all shadow-[2px_2px_0px_0px_#000] active:translate-y-[2px] active:shadow-none flex items-center gap-2"
                                >
                                    <Briefcase size={18} />
                                    <span className="text-sm">案件を見る</span>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Right Side: Content */}
                    <div className="flex-1 flex flex-col relative bg-white min-h-0">
                        {/* Header Bar - Desktop Only */}
                        <div className="hidden md:flex h-14 border-b-4 border-gray-900 items-center justify-end px-4 bg-gray-50 shrink-0 gap-4">
                            <LikeButton post={post} />
                            <BookmarkButton post={post} />
                            <div className="w-px h-6 bg-gray-300 mx-2"></div>
                            <button 
                                onClick={onClose}
                                className="w-8 h-8 flex items-center justify-center bg-red-500 text-white border-2 border-gray-900 hover:bg-red-600 shadow-[2px_2px_0px_0px_#000] active:translate-y-[2px] active:shadow-none transition-all"
                            >
                                <X size={20} strokeWidth={3} />
                            </button>
                        </div>

                        {/* Scrollable Content */}
                        <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
                            <div className="mb-2 text-xs font-bold text-gray-400 uppercase tracking-widest pt-12 md:pt-0 pl-10 md:pl-0">
                                {new Date(post.created_at || Date.now()).toLocaleDateString()}
                            </div>
                            
                            {/* Mobile Like/Bookmark Actions (Inserted here for mobile view) */}
                            <div className="md:hidden flex items-center justify-end gap-4 mb-4">
                                <LikeButton post={post} />
                                <BookmarkButton post={post} />
                            </div>

                            <p className="text-base md:text-lg text-gray-800 leading-relaxed font-medium whitespace-pre-wrap mb-8">
                                {post.content}
                            </p>

                            {post.image_url && (
                                <div className="w-full border-4 border-gray-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] p-2 bg-white -rotate-1 hover:rotate-0 transition-transform duration-300">
                                    <img 
                                        src={post.image_url} 
                                        alt="Post content" 
                                        className="w-full h-auto max-h-80 object-cover border-2 border-gray-100"
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Navigation Button - Relative to Modal */}
                {onNext && (
                    <button 
                        onClick={(e) => { 
                            e.stopPropagation(); 
                            onNext(); 
                        }}
                        onMouseDown={(e) => e.stopPropagation()}
                        onPointerDown={(e) => e.stopPropagation()}
                        className="pointer-events-auto absolute right-2 lg:-right-14 top-1/2 -translate-y-1/2 z-[60] p-3 bg-white border-4 border-gray-900 shadow-[4px_4px_0px_0px_#000] hover:bg-gray-100 active:shadow-none transition-all rounded-lg flex items-center justify-center w-12 h-12 md:w-auto md:h-auto"
                        aria-label="Next"
                    >
                        <ChevronRight size={24} strokeWidth={3} className="text-gray-900 md:w-8 md:h-8" />
                    </button>
                )}
            </div>

            <JobDetailModal 
                isOpen={isJobModalOpen}
                job={selectedJob}
                onClose={() => setIsJobModalOpen(false)}
                onApply={handleApply}
            />
        </div>
    );
};

function LikeButton({ post }: { post: any }) {
    const { user } = useAuth();
    const [liked, setLiked] = useState(false);
    const [likesCount, setLikesCount] = useState(post.likes_count || 0);

    useEffect(() => {
        if (user) {
            supabaseService.getLikeStatus(user.id, post.id).then(setLiked);
        }
    }, [user, post.id]);

    const handleToggle = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!user) return alert("Please sign in");
        
        // Optimistic UI
        setLiked(!liked);
        setLikesCount((prev: number) => liked ? prev - 1 : prev + 1);
        
        try {
            const result = await supabaseService.toggleLike(user.id, post.id);
            // Sync with server result just in case
            setLikesCount(result.count);
            setLiked(result.liked);
        } catch (err) {
            console.error(err);
             // Revert logic would go here
        }
    };

    return (
        <button 
            onClick={handleToggle}
            className={`flex items-center gap-1.5 px-3 py-1.5 border-2 border-gray-900 shadow-[2px_2px_0px_0px_#000] active:translate-y-[2px] active:shadow-none transition-all ${liked ? 'bg-pink-100 text-pink-600' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
        >
            <Heart size={18} fill={liked ? "currentColor" : "none"} strokeWidth={3} />
            <span className="font-black text-sm">{likesCount}</span>
        </button>
    );
}

function BookmarkButton({ post }: { post: any }) {
    const { user } = useAuth();
    const [bookmarked, setBookmarked] = useState(false);

    useEffect(() => {
        if (user) {
            supabaseService.getBookmarkStatus(user.id, post.id).then(setBookmarked);
        }
    }, [user, post.id]);

    const handleToggle = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!user) return alert("Please sign in");
        
        setBookmarked(!bookmarked);
        await supabaseService.toggleBookmark(user.id, post.id);
    };

    return (
        <button 
            onClick={handleToggle}
            className={`p-1.5 border-2 border-gray-900 shadow-[2px_2px_0px_0px_#000] active:translate-y-[2px] active:shadow-none transition-all ${bookmarked ? 'bg-yellow-100 text-yellow-600' : 'bg-white text-gray-400 hover:bg-gray-50'}`}
        >
            <Bookmark size={20} fill={bookmarked ? "currentColor" : "none"} strokeWidth={3} />
        </button>
    );
}
