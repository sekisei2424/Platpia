'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Database } from '@/types/database';
import JobDetailModal from './JobDetailModal';
import { MapPin, Gift, Search, Image as ImageIcon, ClipboardList, ChevronRight, Briefcase } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabaseService } from '@/services/supabaseService';
import { getAvatarUrl } from '@/lib/avatar';

type Job = Database['public']['Tables']['jobs']['Row'];
type ProfileData = {
    id: string;
    username: string;
    avatar_type: string | null;
};

interface JobBoardProps {
    searchQuery?: string;
    filterLocation?: string[];
    filterIndustries?: string[];
}

export default function JobBoard({ searchQuery = '', filterLocation = [], filterIndustries = [] }: JobBoardProps) {
    const [jobs, setJobs] = useState<Job[]>([]);
    const [profiles, setProfiles] = useState<Record<string, ProfileData>>({});
    const [loading, setLoading] = useState(true);
    const [selectedJob, setSelectedJob] = useState<Job | null>(null);
    const router = useRouter();

    useEffect(() => {
        async function fetchJobs() {
            const { data: jobsData } = await supabase
                .from('jobs')
                .select('*')
                .eq('status', 'open')
                .order('created_at', { ascending: false });

            if (jobsData) {
                setJobs(jobsData);
                const companyIds = Array.from(new Set(jobsData.map(j => j.company_id).filter(id => id !== null))) as string[];

                if (companyIds.length > 0) {
                    const { data: profilesData } = await supabase
                        .from('profiles')
                        .select('id, username, avatar_type')
                        .in('id', companyIds);

                    if (profilesData) {
                        const profileMap: Record<string, ProfileData> = {};
                        profilesData.forEach(p => {
                            profileMap[p.id] = {
                            ...p,
                            username: p.username ?? "不明なユーザー" // nullの場合は代わりの文字を入れる
                            };
                        });
                        setProfiles(profileMap);
                    }
                }
            }
            setLoading(false);
        }

        fetchJobs();
    }, []);

    const handleApply = async (jobId: string) => {
        if (!selectedJob?.company_id) return;
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { alert("ログインが必要です。"); return; }
            if (user.id === selectedJob.company_id) { alert("自分が出した募集には応募できません。"); return; }
            
            const unpostedJobs = await supabaseService.fetchUnpostedCompletedJobs(user.id);
            if (unpostedJobs.length > 0) { alert("未投稿の感想があります。先に感想を投稿してください。"); return; }
            
            await supabaseService.applyForJob(selectedJob.id, user.id);
            
            if (selectedJob.company_id) {
                const { id: conversationId } = await supabaseService.createConversation(user.id, selectedJob.company_id);
                await supabaseService.sendMessage(conversationId, user.id, `[JOB_LINK:${selectedJob.id}] 「${selectedJob.title}」の体験に応募しました。`, 'booking_request');
                router.push(`/messages/${conversationId}`);
                return;
            }
            alert("応募が完了しました。");
            setSelectedJob(null);
        } catch (error: any) {
            console.error("Error applying:", error);
            alert(`応募に失敗しました: ${error.message || '不明なエラー'}`);
        }
    };

    const filteredJobs = jobs.filter((job) => {
        const matchesSearch = searchQuery
            ? (job.title && job.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
              (job.description && job.description.toLowerCase().includes(searchQuery.toLowerCase()))
            : true;

        const matchesLocation = filterLocation.length === 0
            ? true
            : job.location && filterLocation.includes(job.location);

        const jobCategory = (job as any).category;
        const matchesIndustry = filterIndustries.length === 0
            ? true
            : jobCategory && filterIndustries.includes(jobCategory);

        return matchesSearch && matchesLocation && matchesIndustry;
    });

    if (loading) return (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="text-gray-500 text-xl animate-pulse font-black font-pixel">
                読み込み中...
            </div>
        </div>
    );

    return (
        <div className="w-full font-pixel select-none p-4 md:p-8 bg-transparent min-h-screen">
            <div className="mb-8 flex items-center gap-4 border-b-2 border-gray-900 pb-4">
                <div className="bg-gray-900 p-2 border-2 border-gray-900 shadow-[3px_3px_0px_0px_rgba(0,0,0,0.1)]">
                    <ClipboardList className="text-white" size={28} strokeWidth={2} />
                </div>
                <div>
                    <h2 className="text-3xl font-black text-gray-900 tracking-tighter drop-shadow-[2px_2px_0px_#fff]">
                        掲示板
                    </h2>
                    <p className="text-xs font-bold text-gray-500 mt-1 uppercase tracking-widest">
                        Job Board / Requests
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredJobs.length === 0 ? (
                    <div className="col-span-full flex flex-col items-center justify-center py-20 bg-white border-2 border-dashed border-gray-400">
                        <Search className="text-gray-300 mb-4" size={64} />
                        <p className="text-gray-500 text-lg font-bold font-pixel">
                            条件に合う依頼はありません
                        </p>
                    </div>
                ) : (
                    filteredJobs.map((job) => {
                        const owner = job.company_id ? profiles[job.company_id] : null;
                        const jobCategory = (job as any).category;

                        return (
                            <div
                                key={job.id}
                                className="
                                    group relative bg-white border-2 border-gray-900 p-3 
                                                                        
                                    hover:ring-2 hover:ring-gray-500 
                                    
                                    hover:bg-gray-50
                                    
                                    transition-all duration-100 cursor-pointer flex flex-col h-full
                                "
                                onClick={() => setSelectedJob(job)}
                            >
                                <div className="absolute top-1 left-1 w-1 h-1 bg-gray-300"></div>
                                <div className="absolute top-1 right-1 w-1 h-1 bg-gray-300"></div>
                                <div className="absolute bottom-1 left-1 w-1 h-1 bg-gray-300"></div>
                                <div className="absolute bottom-1 right-1 w-1 h-1 bg-gray-300"></div>

                                <div className="relative h-44 w-full mb-4 bg-gray-100 border-2 border-gray-900 overflow-hidden flex-shrink-0">
                                    {job.thumbnail_url ? (
                                        <img
                                            src={job.thumbnail_url}
                                            alt={job.title}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 bg-gray-50 pattern-dots">
                                            <ImageIcon size={32} strokeWidth={1.5} />
                                        </div>
                                    )}
                                    
                                    <div className="absolute top-0 right-0">
                                        <div className="bg-red-600 text-white text-[10px] px-3 py-1 font-black border-l-2 border-b-2 border-gray-900 shadow-sm z-10">
                                            募集中
                                        </div>
                                    </div>
                                </div>

                                <div className="inline-flex items-center gap-1.5 mb-3 px-2 py-1 bg-white border-2 border-gray-900 text-[10px] font-bold w-fit shadow-[2px_2px_0px_0px_#e5e7eb]">
                                    <Briefcase size={14} className="text-gray-900" strokeWidth={2.5} />
                                    <span className="text-gray-900 uppercase tracking-tight">{jobCategory || 'その他'}</span>
                                </div>

                                <h3 className="font-black text-lg text-gray-900 mb-4 leading-tight line-clamp-2 min-h-[3.5rem] group-hover:underline decoration-2 underline-offset-4 decoration-gray-500">
                                    {job.title}
                                </h3>

                                <div 
                                    className="flex items-center gap-3 mb-4 px-2 py-2 bg-gray-50 border-y-2 border-dotted border-gray-300 hover:bg-gray-100 transition-colors z-30" 
                                    onClick={(e) => {
                                        if (job.company_id) {
                                            e.stopPropagation();
                                            router.push(`/profile/${job.company_id}`);
                                        }
                                    }}
                                >
                                    <div className="w-12 h-12 border-2 border-gray-900 bg-white flex-shrink-0 overflow-hidden rounded-full shadow-sm">
                                        {owner?.avatar_type ? (
                                            <img
                                                src={getAvatarUrl(owner.avatar_type)}
                                                alt="Owner"
                                                className="w-full h-full object-cover object-top"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold text-xs bg-gray-200">?</div>
                                        )}
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <span className="text-[9px] text-gray-500 font-bold leading-none uppercase tracking-wider">掲載者</span>
                                        <span className="text-sm font-black truncate text-gray-900 leading-tight mt-0.5 underline decoration-gray-400 underline-offset-2">
                                            {owner?.username || '不明なユーザー'}
                                        </span>
                                    </div>
                                </div>

                                <div className="mt-auto flex flex-col gap-2 pointer-events-none">
                                    <div className="flex items-center justify-between gap-2 text-xs font-bold w-full">
                                        <div className="shrink-0 flex items-center gap-1 text-gray-600 bg-white px-1 py-0.5 border border-transparent">
                                            <MapPin size={14} className="shrink-0 text-gray-900" />
                                            <span className="truncate max-w-[80px]">
                                                {job.location || '不明'}
                                            </span>
                                        </div>
                                        
                                        <div className="max-w-[60%] flex items-center gap-1.5 bg-white text-gray-900 px-3 py-1 border-2 border-gray-900 shadow-[2px_2px_0px_0px_#e5e7eb]">
                                            <Gift size={14} className="shrink-0 text-red-600" />
                                            <span className="truncate font-black tracking-tight">
                                                {job.reward || '要相談'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* カーソル合わせると矢印が出る */}
                                <div className="absolute top-1/2 -left-3 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-20 group-hover:-left-6">
                                    <ChevronRight size={32} strokeWidth={3} className="text-gray-900 drop-shadow-[2px_2px_0px_#fff]" />
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            <JobDetailModal
                job={selectedJob}
                isOpen={!!selectedJob}
                onClose={() => setSelectedJob(null)}
                onApply={handleApply}
            />
        </div>
    );
}