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

            // Create conversation
            const { id: conversationId } = await supabaseService.createConversation(user.id, selectedJob.company_id);

            // Send initial application message
            await supabaseService.sendMessage(
                conversationId,
                user.id,
                `「${selectedJob.title}」の体験に興味があります。`,
                'booking_request'
            );

            // Redirect to the conversation
            router.push(`/messages/${conversationId}`);
        } catch (error) {
            console.error("Error applying:", error);
            alert("応募に失敗しました。もう一度お試しください。");
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
