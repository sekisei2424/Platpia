import { useState, useEffect } from 'react';
import { X, Send, Image as ImageIcon, LogIn, Briefcase, MessageSquare } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabaseService, JobApplication } from '@/services/supabaseService';
import AuthModal from '@/components/auth/AuthModal';

interface PostFormProps {
    onClose: () => void;
}

export default function PostForm({ onClose }: PostFormProps) {
    const [content, setContent] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { user } = useAuth();
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [jobs, setJobs] = useState<JobApplication[]>([]);
    const [companyJobs, setCompanyJobs] = useState<any[]>([]); // For companies to select their own jobs
    const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
    
    // Job Creation State
    const [isCompany, setIsCompany] = useState(false);
    const [mode, setMode] = useState<'post' | 'job'>('post');
    const [jobTitle, setJobTitle] = useState('');
    const [jobDescription, setJobDescription] = useState('');
    const [jobLocation, setJobLocation] = useState('');
    const [jobReward, setJobReward] = useState('');

    useEffect(() => {
        if (user) {
            checkUserType();
        }
    }, [user]);

    const checkUserType = async () => {
        if (!user) return;
        const profile = await supabaseService.fetchProfile(user.id);
        if (profile && profile.user_type === 'company') {
            setIsCompany(true);
            fetchCompanyJobs(user.id);
        } else {
            fetchJobs();
        }
    };

    const fetchCompanyJobs = async (userId: string) => {
        try {
            const jobs = await supabaseService.fetchCompanyJobs(userId);
            setCompanyJobs(jobs || []);
        } catch (error) {
            console.error("Error fetching company jobs:", error);
        }
    };

    const fetchJobs = async () => {
        if (!user) return;
        const unpostedJobs = await supabaseService.fetchUnpostedCompletedJobs(user.id);
        setJobs(unpostedJobs);
        if (unpostedJobs.length > 0) {
            setSelectedJobId(unpostedJobs[0].job_id);
            setContent(`「${unpostedJobs[0].jobs?.title}」を体験しました！`);
        }
    };

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setImageFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) {
            setShowAuthModal(true);
            return;
        }

        setIsSubmitting(true);
        try {
            let imageUrl = undefined;
            if (imageFile) {
                const url = await supabaseService.uploadImage(imageFile);
                if (url) imageUrl = url;
            }

            if (mode === 'post') {
                if (!content.trim() && !imageFile) return;
                const newPost = await supabaseService.createPost(content, user.id, imageUrl, selectedJobId || undefined);
                if (newPost) {
                    console.log('Post created:', newPost);
                    onClose();
                    window.location.reload();
                }
            } else {
                // Create Job
                if (!jobTitle.trim() || !jobDescription.trim()) return;
                const newJob = await supabaseService.createJob({
                    company_id: user.id,
                    title: jobTitle,
                    description: jobDescription,
                    location: jobLocation,
                    reward: jobReward,
                    thumbnail_url: imageUrl
                });
                if (newJob) {
                    console.log('Job created:', newJob);
                    onClose();
                    window.location.reload();
                }
            }
        } catch (error) {
            console.error('Failed to submit:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="w-full max-w-2xl mx-auto">
            <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />

            {isCompany && (
                <div className="flex gap-2 mb-4 bg-gray-100 p-1 rounded-xl">
                    <button
                        type="button"
                        onClick={() => setMode('post')}
                        className={`flex-1 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${mode === 'post' ? 'bg-white shadow text-village-accent' : 'text-gray-500 hover:bg-gray-200'}`}
                    >
                        <MessageSquare size={16} />
                        通常投稿
                    </button>
                    <button
                        type="button"
                        onClick={() => setMode('job')}
                        className={`flex-1 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${mode === 'job' ? 'bg-white shadow text-village-accent' : 'text-gray-500 hover:bg-gray-200'}`}
                    >
                        <Briefcase size={16} />
                        体験募集を作成
                    </button>
                </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                {mode === 'post' ? (
                    <div className="relative">
                        {/* Individual User: Select Completed Job */}
                        {!isCompany && selectedJobId && jobs.length > 0 && (
                            <div className="mb-2 p-2 bg-blue-50 text-blue-700 rounded-lg text-sm flex items-center gap-2">
                                <span className="font-bold whitespace-nowrap">体験:</span>
                                <select 
                                    value={selectedJobId} 
                                    onChange={(e) => {
                                        setSelectedJobId(e.target.value);
                                        const job = jobs.find(j => j.job_id === e.target.value);
                                        if (job) setContent(`「${job.jobs?.title}」を体験しました！`);
                                    }}
                                    className="bg-transparent border-none focus:ring-0 font-medium cursor-pointer w-full text-ellipsis"
                                >
                                    {jobs.map(job => (
                                        <option key={job.id} value={job.job_id}>
                                            {job.jobs?.title}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Company User: Select Active Job to Promote */}
                        {isCompany && companyJobs.length > 0 && (
                            <div className="mb-2 p-2 bg-green-50 text-green-700 rounded-lg text-sm flex items-center gap-2">
                                <span className="font-bold whitespace-nowrap">案件宣伝:</span>
                                <select 
                                    value={selectedJobId || ''} 
                                    onChange={(e) => {
                                        setSelectedJobId(e.target.value || null);
                                        const job = companyJobs.find(j => j.id === e.target.value);
                                        if (job && !content) setContent(`【募集中】${job.title}\n\n${job.description?.substring(0, 50)}...`);
                                    }}
                                    className="bg-transparent border-none focus:ring-0 font-medium cursor-pointer w-full text-ellipsis"
                                >
                                    <option value="">案件を選択しない</option>
                                    {companyJobs.map(job => (
                                        <option key={job.id} value={job.id}>
                                            {job.title}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder={user ? "村での出来事をシェアしよう！" : "投稿するにはログインしてください..."}
                            disabled={!user}
                            className="w-full h-32 bg-white/50 backdrop-blur-sm rounded-2xl p-6 text-lg text-gray-800 placeholder-gray-500 border border-white/50 focus:outline-none focus:ring-2 focus:ring-village-accent/50 resize-none shadow-inner transition-all disabled:opacity-50"
                        />
                        <div className="absolute bottom-4 right-4 text-gray-500 text-sm">
                            {content.length}/280
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        <input
                            type="text"
                            value={jobTitle}
                            onChange={(e) => setJobTitle(e.target.value)}
                            placeholder="体験のタイトル（例：村の清掃活動）"
                            className="w-full bg-white/50 backdrop-blur-sm rounded-xl p-4 text-lg font-bold text-gray-800 placeholder-gray-500 border border-white/50 focus:outline-none focus:ring-2 focus:ring-village-accent/50"
                        />
                        <textarea
                            value={jobDescription}
                            onChange={(e) => setJobDescription(e.target.value)}
                            placeholder="体験の詳細説明..."
                            className="w-full h-32 bg-white/50 backdrop-blur-sm rounded-xl p-4 text-base text-gray-800 placeholder-gray-500 border border-white/50 focus:outline-none focus:ring-2 focus:ring-village-accent/50 resize-none"
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <input
                                type="text"
                                value={jobLocation}
                                onChange={(e) => setJobLocation(e.target.value)}
                                placeholder="場所（例：中央広場）"
                                className="w-full bg-white/50 backdrop-blur-sm rounded-xl p-4 text-sm text-gray-800 placeholder-gray-500 border border-white/50 focus:outline-none focus:ring-2 focus:ring-village-accent/50"
                            />
                            <input
                                type="text"
                                value={jobReward}
                                onChange={(e) => setJobReward(e.target.value)}
                                placeholder="リワード（例：ありがとうカード）"
                                className="w-full bg-white/50 backdrop-blur-sm rounded-xl p-4 text-sm text-gray-800 placeholder-gray-500 border border-white/50 focus:outline-none focus:ring-2 focus:ring-village-accent/50"
                            />
                        </div>
                    </div>
                )}

                {previewUrl && (
                    <div className="relative w-full h-48 bg-gray-100 rounded-xl overflow-hidden">
                        <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                        <button 
                            type="button"
                            onClick={() => { setImageFile(null); setPreviewUrl(null); }}
                            className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full hover:bg-black/70"
                        >
                            <X size={16} />
                        </button>
                    </div>
                )}

                <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 px-4 py-2 rounded-xl text-gray-600 hover:bg-white/50 transition-colors cursor-pointer">
                        <ImageIcon size={20} />
                        <span>{mode === 'job' ? 'サムネイル画像' : '写真を追加'}</span>
                        <input 
                            type="file" 
                            accept="image/*" 
                            onChange={handleImageSelect} 
                            className="hidden" 
                        />
                    </label>

                    <div className="flex gap-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-3 rounded-xl text-gray-600 hover:bg-gray-100/50 transition-colors font-medium"
                        >
                            キャンセル
                        </button>
                        {user ? (
                            <button
                                type="submit"
                                disabled={isSubmitting || (mode === 'post' && !content.trim() && !imageFile) || (mode === 'job' && (!jobTitle.trim() || !jobDescription.trim()))}
                                className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-village-accent to-green-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Send size={18} />
                                {isSubmitting ? '送信中...' : (mode === 'job' ? '募集を開始' : '投稿する')}
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={() => setShowAuthModal(true)}
                                className="flex items-center gap-2 px-8 py-3 bg-village-base text-white rounded-xl font-bold shadow-lg hover:bg-gray-800 transition-all"
                            >
                                <LogIn size={18} />
                                ログインして投稿
                            </button>
                        )}
                    </div>
                </div>
            </form>
        </div>
    );
}

