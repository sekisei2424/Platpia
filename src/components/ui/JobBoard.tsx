import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Database } from '@/types/database';
import JobDetailModal from './JobDetailModal';
import { MapPin, Gift } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabaseService } from '@/services/supabaseService';

type Job = Database['public']['Tables']['jobs']['Row'];

export default function JobBoard() {
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedJob, setSelectedJob] = useState<Job | null>(null);
    const router = useRouter();

    useEffect(() => {
        async function fetchJobs() {
            const { data, error } = await supabase
                .from('jobs')
                .select('*')
                .eq('status', 'open')
                .order('created_at', { ascending: false });

            if (data) {
                setJobs(data);
            }
            setLoading(false);
        }

        fetchJobs();
    }, []);

    const handleApply = async (jobId: string) => {
        if (!selectedJob?.company_id) return;

        try {
            // Get current user
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                // Prompt login if not authenticated
                // For now, just alert or redirect
                alert("応募するにはログインしてください。");
                return;
            }

            if (user.id === selectedJob.company_id) {
                alert("自分の募集した体験には応募できません。");
                return;
            }

            // Check for unposted completed jobs
            const unpostedJobs = await supabaseService.fetchUnpostedCompletedJobs(user.id);
            if (unpostedJobs.length > 0) {
                alert("未投稿の完了体験があります。次の体験に応募する前に、感想を投稿してください！");
                return;
            }

            // Create Job Application Record
            await supabaseService.applyForJob(selectedJob.id, user.id);

            // Send initial application message (if company_id exists)
            if (selectedJob.company_id) {
                try {
                    const { id: conversationId } = await supabaseService.createConversation(user.id, selectedJob.company_id);
                    await supabaseService.sendMessage(
                        conversationId,
                        user.id,
                        `[JOB_LINK:${selectedJob.id}] 「${selectedJob.title}」の体験に応募しました。`,
                        'booking_request'
                    );
                    router.push(`/messages/${conversationId}`);
                    return;
                } catch (msgError) {
                    console.error("Error sending message:", msgError);
                    // Fall through to success alert
                }
            }

            alert("応募が完了しました。");
            setSelectedJob(null);

        } catch (error: any) {
            console.error("Error applying:", error);
            if (error.code === '23505' || error.message?.includes('duplicate')) {
                alert("すでに応募済みです。");
            } else {
                alert(`応募に失敗しました: ${error.message || 'Unknown error'}`);
            }
        }
    };

    if (loading) return <div className="text-center py-8 text-gray-500">体験を読み込み中...</div>;

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {jobs.length === 0 ? (
                    <div className="col-span-full text-center py-12 bg-white rounded-xl shadow-sm">
                        <p className="text-gray-400">現在募集中の体験はありません。</p>
                    </div>
                ) : (
                    jobs.map((job) => (
                        <div 
                            key={job.id} 
                            className="bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer border border-transparent hover:border-village-accent group"
                            onClick={() => setSelectedJob(job)}
                        >
                            {job.thumbnail_url && (
                                <div className="h-32 mb-4 bg-gray-100 rounded-lg overflow-hidden">
                                    <img src={job.thumbnail_url} alt={job.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                </div>
                            )}
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="font-bold text-gray-800 line-clamp-1">{job.title}</h3>
                                <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 font-medium">
                                    {job.status}
                                </span>
                            </div>
                            
                            <p className="text-sm text-gray-500 mb-4 line-clamp-2 h-10">
                                {job.description || 'No description available.'}
                            </p>

                            <div className="flex items-center gap-4 text-xs text-gray-400">
                                <div className="flex items-center gap-1">
                                    <MapPin size={14} />
                                    <span>{job.location || 'Remote'}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Gift size={14} />
                                    <span>{job.reward || 'Volunteer'}</span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <JobDetailModal 
                job={selectedJob} 
                isOpen={!!selectedJob} 
                onClose={() => setSelectedJob(null)}
                onApply={handleApply}
            />
        </>
    );
}
