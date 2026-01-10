import { useEffect, useState } from 'react';
import { Database } from '@/types/database';
import { MapPin, Gift, Building2, User, CheckCircle, XCircle, Clock, X } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabaseService } from '@/services/supabaseService';

type Job = Database['public']['Tables']['jobs']['Row'];
type Applicant = Database['public']['Tables']['job_applications']['Row'] & {
    profiles: {
        username: string | null;
        avatar_type: string | null;
    } | null;
};

interface JobDetailModalProps {
    job: Job | null;
    isOpen: boolean;
    onClose: () => void;
    onApply: (jobId: string) => void;
}

export default function JobDetailModal({ job, isOpen, onClose, onApply }: JobDetailModalProps) {
    const { user } = useAuth();
    const [applicants, setApplicants] = useState<Applicant[]>([]);
    const [isOwner, setIsOwner] = useState(false);
    const [userApplication, setUserApplication] = useState<Applicant | null>(null);

    useEffect(() => {
        if (job && user) {
            setIsOwner(job.company_id === user.id);
            if (job.company_id === user.id) {
                fetchApplicants();
            } else {
                checkUserApplication();
            }
        }
    }, [job, user]);

    const checkUserApplication = async () => {
        if (!job || !user) return;
        const app = await supabaseService.fetchUserApplication(job.id, user.id);
        setUserApplication(app as Applicant);
    };

    const fetchApplicants = async () => {
        if (!job) return;
        try {
            const data = await supabaseService.fetchJobApplicants(job.id);
            setApplicants(data as Applicant[]);
        } catch (error) {
            console.error("Error fetching applicants:", error);
        }
    };

    const handleStatusUpdate = async (applicationId: string, newStatus: 'approved' | 'rejected' | 'completed') => {
        try {
            const updatedApp = await supabaseService.updateApplicationStatus(applicationId, newStatus);
            fetchApplicants(); // Refresh list

            // Send automated message based on status
            if (updatedApp) {
                const applicantId = updatedApp.applicant_id;
                // Create/Get conversation
                const { id: conversationId } = await supabaseService.createConversation(user!.id, applicantId);
                
                let message = "";
                let type: 'system' | 'text' = 'system';

                if (newStatus === 'approved') {
                    message = `「${job?.title}」への応募が承認されました！体験を開始してください。`;
                } else if (newStatus === 'completed') {
                    message = `「${job?.title}」の体験が完了しました！感想を投稿して、村のみんなにシェアしましょう。\n\n[POST_FEEDBACK:${job?.id}]`;
                }

                if (message) {
                    await supabaseService.sendMessage(conversationId, user!.id, message, type);
                }
            }

        } catch (error) {
            console.error("Error updating status:", error);
            alert("ステータスの更新に失敗しました。");
        }
    };

    const handleApplyClick = () => {
        if (!job) return;
        if (window.confirm(`「${job.title}」に応募しますか？`)) {
            onApply(job.id);
        }
    };

    if (!isOpen || !job) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div 
                className={`bg-[#FDFBF7] w-full ${isOwner ? 'max-w-5xl' : 'max-w-2xl'} rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] transition-all duration-300`}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-white/50">
                    <h2 className="text-xl font-bold text-gray-800 truncate pr-4">{job.title}</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800 transition-colors p-1 hover:bg-gray-100 rounded-full">
                        <X size={24} />
                    </button>
                </div>

                {/* Content Body */}
                <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
                    
                    {/* Left Column: Job Details */}
                    <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                        <div className="space-y-6">
                            {/* Thumbnail */}
                            {job.thumbnail_url && (
                                <div className="w-full h-48 sm:h-64 bg-gray-200 rounded-lg overflow-hidden shadow-sm">
                                    <img 
                                        src={job.thumbnail_url} 
                                        alt={job.title} 
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            )}

                            {/* Company Info */}
                            <div className="flex items-center gap-3 text-gray-600 bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                                <div className="p-2 bg-gray-100 rounded-full">
                                    <Building2 size={20} />
                                </div>
                                <span className="font-medium">Company Name (ID: {job.company_id?.slice(0, 8)}...)</span>
                            </div>

                            {/* Description */}
                            <div className="prose max-w-none">
                                <h3 className="text-lg font-bold text-gray-800 mb-2 flex items-center gap-2">
                                    <span className="w-1 h-6 bg-village-accent rounded-full"></span>
                                    この体験について
                                </h3>
                                <p className="text-gray-600 whitespace-pre-wrap leading-relaxed">{job.description || '詳細はありません。'}</p>
                            </div>

                            {/* Details Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="flex items-start gap-3 bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
                                    <div className="p-2 bg-orange-50 text-orange-500 rounded-lg">
                                        <MapPin size={20} />
                                    </div>
                                    <div>
                                        <span className="block text-xs text-gray-500 font-bold uppercase tracking-wider">場所</span>
                                        <span className="text-sm font-medium text-gray-800">{job.location || 'オンライン / リモート'}</span>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
                                    <div className="p-2 bg-green-50 text-green-500 rounded-lg">
                                        <Gift size={20} />
                                    </div>
                                    <div>
                                        <span className="block text-xs text-gray-500 font-bold uppercase tracking-wider">リワード</span>
                                        <span className="text-sm font-medium text-gray-800">{job.reward || 'ボランティア'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons (Hide Apply if Owner) */}
                            {!isOwner && (
                                <div className="flex gap-3 pt-6 border-t border-gray-200">
                                    <button 
                                        onClick={onClose}
                                        className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                                    >
                                        キャンセル
                                    </button>
                                    {userApplication ? (
                                        <button 
                                            disabled
                                            className="flex-1 px-4 py-3 bg-gray-100 text-gray-400 rounded-xl font-medium cursor-not-allowed border border-gray-200"
                                        >
                                            応募済み
                                        </button>
                                    ) : (
                                        <button 
                                            onClick={handleApplyClick}
                                            className="flex-1 px-4 py-3 bg-village-accent text-white rounded-xl hover:bg-[#2a8a55] transition-colors font-bold shadow-md hover:shadow-lg transform hover:-translate-y-0.5 duration-200"
                                        >
                                            応募する
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Applicants (Only for Owner) */}
                    {isOwner && (
                        <div className="w-full md:w-96 border-t md:border-t-0 md:border-l border-gray-200 bg-gray-50/80 flex flex-col h-full">
                            <div className="p-4 border-b border-gray-200 bg-white/50 backdrop-blur-sm sticky top-0 z-10">
                                <h3 className="font-bold text-gray-700 flex items-center gap-2">
                                    <User size={18} className="text-village-accent" />
                                    応募者リスト 
                                    <span className="bg-gray-200 text-gray-600 text-xs px-2 py-0.5 rounded-full">{applicants.length}</span>
                                </h3>
                            </div>
                            
                            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                                {applicants.length === 0 ? (
                                    <div className="text-center py-10 text-gray-400">
                                        <User size={48} className="mx-auto mb-2 opacity-20" />
                                        <p className="text-sm">まだ応募者はいません。</p>
                                    </div>
                                ) : (
                                    applicants.map(app => (
                                        <div key={app.id} className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm hover:shadow-md transition-shadow">
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-200">
                                                    {app.profiles?.avatar_type ? (
                                                        <img src={`/images/${app.profiles.avatar_type}`} alt="Avatar" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <User size={20} className="text-gray-400" />
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-bold text-sm text-gray-800 truncate">{app.profiles?.username || 'Unknown User'}</p>
                                                    <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-medium mt-0.5 ${
                                                        app.status === 'completed' ? 'bg-green-100 text-green-700' :
                                                        app.status === 'approved' ? 'bg-blue-100 text-blue-700' :
                                                        app.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                                        'bg-yellow-100 text-yellow-700'
                                                    }`}>
                                                        {app.status === 'pending' ? '承認待ち' : 
                                                         app.status === 'approved' ? '承認済み' :
                                                         app.status === 'completed' ? '完了' : '却下'}
                                                    </span>
                                                </div>
                                            </div>
                                            
                                            <div className="flex gap-2 justify-end">
                                                {app.status === 'pending' && (
                                                    <>
                                                        <button 
                                                            onClick={() => handleStatusUpdate(app.id, 'approved')}
                                                            className="flex-1 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1"
                                                        >
                                                            <CheckCircle size={14} />
                                                            承認
                                                        </button>
                                                        <button 
                                                            onClick={() => handleStatusUpdate(app.id, 'rejected')}
                                                            className="flex-1 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1"
                                                        >
                                                            <XCircle size={14} />
                                                            却下
                                                        </button>
                                                    </>
                                                )}
                                                {app.status === 'approved' && (
                                                    <button 
                                                        onClick={() => handleStatusUpdate(app.id, 'completed')}
                                                        className="w-full py-1.5 bg-green-500 text-white text-xs rounded-lg hover:bg-green-600 transition-colors font-medium shadow-sm"
                                                    >
                                                        完了にする
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
