import { useState, useEffect } from 'react';
import { X, Send, Image as ImageIcon, LogIn, Briefcase, MessageSquare } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabaseService, JobApplication, JobApplicationWithJob } from '@/services/supabaseService';
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
    const [jobs, setJobs] = useState<JobApplicationWithJob[]>([]);
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
        <div className="w-full bg-white border-4 border-gray-900 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)] p-4 md:p-6">
            <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />

            {isCompany && ( // ...existing code...

                <div className="flex gap-4 mb-6 border-b-4 border-gray-900 pb-4">
                    <button
                        type="button"
                        onClick={() => setMode('post')}
                        className={`flex-1 py-3 border-2 border-gray-900 font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
                            mode === 'post' 
                            ? 'bg-gray-900 text-white shadow-[4px_4px_0px_0px_#000]' 
                            : 'bg-white text-gray-900 hover:bg-gray-100 shadow-[2px_2px_0px_0px_#000]'
                        }`}
                    >
                        <MessageSquare size={16} />
                        NORMAL POST
                    </button>
                    <button
                        type="button"
                        onClick={() => setMode('job')}
                        className={`flex-1 py-3 border-2 border-gray-900 font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
                            mode === 'job' 
                            ? 'bg-gray-900 text-white shadow-[4px_4px_0px_0px_#000]' 
                            : 'bg-white text-gray-900 hover:bg-gray-100 shadow-[2px_2px_0px_0px_#000]'
                        }`}
                    >
                        <Briefcase size={16} />
                        CREATE JOB
                    </button>
                </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                {mode === 'post' ? (
                    <div className="relative space-y-4">
                        {/* Individual User: Select Completed Job */}
                        {!isCompany && selectedJobId && jobs.length > 0 && (
                            <div className="p-3 bg-blue-50 border-2 border-gray-900 text-gray-900 text-sm flex items-center gap-2 font-bold">
                                <span className="uppercase tracking-wider">EXPERIENCE:</span>
                                <select 
                                    value={selectedJobId} 
                                    onChange={(e) => {
                                        setSelectedJobId(e.target.value);
                                        const job = jobs.find(j => j.job_id === e.target.value);
                                        if (job) setContent(`「${job.jobs?.title}」を体験しました！`);
                                    }}
                                    className="bg-transparent border-none focus:ring-0 font-bold cursor-pointer w-full text-ellipsis outline-none"
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
                            <div className="p-3 bg-green-50 border-2 border-gray-900 text-gray-900 text-sm flex items-center gap-2 font-bold">
                                <span className="uppercase tracking-wider">PROMOTE:</span>
                                <select 
                                    value={selectedJobId || ''} 
                                    onChange={(e) => {
                                        setSelectedJobId(e.target.value || null);
                                        const job = companyJobs.find(j => j.id === e.target.value);
                                        if (job && !content) setContent(`【募集中】${job.title}\n\n${job.description?.substring(0, 50)}...`);
                                    }}
                                    className="bg-transparent border-none focus:ring-0 font-bold cursor-pointer w-full text-ellipsis outline-none"
                                >
                                    <option value="">NO SELECTION</option>
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
                            placeholder={user ? "SHARE YOUR VILLA LIFE..." : "Please login to post..."}
                            disabled={!user}
                            className="w-full h-40 bg-white border-2 border-gray-900 p-4 text-lg font-bold text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-yellow-50 resize-none shadow-inner transition-all disabled:opacity-50 disabled:bg-gray-100"
                        />
                        <div className="text-right text-xs font-bold text-gray-400 uppercase tracking-widest">
                            {content.length}/280 CHARS
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Job Title</label>
                            <input
                                type="text"
                                value={jobTitle}
                                onChange={(e) => setJobTitle(e.target.value)}
                                placeholder="E.g. VILLAGE CLEANUP"
                                className="w-full bg-white border-2 border-gray-900 p-3 font-bold text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-yellow-50"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Description</label>
                            <textarea
                                value={jobDescription}
                                onChange={(e) => setJobDescription(e.target.value)}
                                placeholder="DETAILS ABOUT THE JOB..."
                                className="w-full h-32 bg-white border-2 border-gray-900 p-3 font-bold text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-yellow-50 resize-none"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Location</label>
                                <input
                                    type="text"
                                    value={jobLocation}
                                    onChange={(e) => setJobLocation(e.target.value)}
                                    placeholder="E.g. PLAZA"
                                    className="w-full bg-white border-2 border-gray-900 p-3 font-bold text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-yellow-50"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Reward</label>
                                <input
                                    type="text"
                                    value={jobReward}
                                    onChange={(e) => setJobReward(e.target.value)}
                                    placeholder="E.g. 500 COINS"
                                    className="w-full bg-white border-2 border-gray-900 p-3 font-bold text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-yellow-50"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {previewUrl && (
                    <div className="relative w-full h-48 bg-gray-100 border-2 border-gray-900 overflow-hidden group">
                        <div className="absolute inset-0 pattern-dots opacity-20 pointer-events-none"></div>
                        <img src={previewUrl} alt="Preview" className="w-full h-full object-cover relative z-10" />
                        <button 
                            type="button"
                            onClick={() => { setImageFile(null); setPreviewUrl(null); }}
                            className="absolute top-2 right-2 bg-white border-2 border-gray-900 text-gray-900 p-1 hover:bg-red-500 hover:text-white transition-colors z-20 shadow-[2px_2px_0px_0px_#000]"
                        >
                            <X size={16} />
                        </button>
                    </div>
                )}

                <div className="flex flex-col gap-4 border-t-4 border-gray-100 pt-6">
                    <label className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-gray-900 bg-white text-gray-900 font-bold uppercase tracking-widest hover:bg-gray-50 transition-all cursor-pointer shadow-[4px_4px_0px_0px_#000] active:translate-y-[1px] active:shadow-none">
                        <ImageIcon size={20} />
                        <span>{mode === 'job' ? 'THUMBNAIL' : 'ADD IMAGE'}</span>
                        <input 
                            type="file" 
                            accept="image/*" 
                            onChange={handleImageSelect} 
                            className="hidden" 
                        />
                    </label>

                    <div className="flex gap-3 w-full">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-6 py-3 border-2 border-transparent font-bold text-gray-500 hover:text-gray-900 uppercase tracking-widest transition-colors text-center"
                        >
                            CANCEL
                        </button>
                        {user ? (
                            <button
                                type="submit"
                                disabled={isSubmitting || (mode === 'post' && !content.trim() && !imageFile) || (mode === 'job' && (!jobTitle.trim() || !jobDescription.trim()))}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 border-gray-900 bg-yellow-400 text-gray-900 font-black uppercase tracking-widest shadow-[4px_4px_0px_0px_#000] hover:bg-yellow-300 active:translate-y-[1px] active:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none min-w-0"
                            >
                                <Send size={18} className="flex-shrink-0" />
                                <span className="truncate">{isSubmitting ? 'SENDING...' : (mode === 'job' ? 'PUBLISH JOB' : 'POST')}</span>
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={() => setShowAuthModal(true)}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 border-gray-900 bg-gray-900 text-white font-black uppercase tracking-widest shadow-[4px_4px_0px_0px_#000] hover:bg-gray-800 active:translate-y-[1px] active:shadow-none transition-all min-w-0"
                            >
                                <LogIn size={18} className="flex-shrink-0" />
                                <span className="truncate">LOGIN</span>
                            </button>
                        )}
                    </div>
                </div>
            </form>
        </div>
    );
}

