'use client';

import { useEffect, useState } from 'react';
import { Database } from '@/types/database';
import { MapPin, Gift, User, X, ClipboardList, Check, AlertCircle } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabaseService } from '@/services/supabaseService';
import { supabase } from '@/lib/supabase/client';

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
    const [ownerProfile, setOwnerProfile] = useState<{ username: string | null, avatar_type: string | null } | null>(null);

    useEffect(() => {
        if (job && user) {
            setIsOwner(job.company_id === user.id);
            if (job.company_id === user.id) {
                fetchApplicants();
            } else {
                checkUserApplication();
            }
            fetchOwnerProfile();
        }
    }, [job, user]);

    const fetchOwnerProfile = async () => {
        if (!job?.company_id) return;
        const { data } = await supabase
            .from('profiles')
            .select('username, avatar_type')
            .eq('id', job.company_id)
            .single();
        if (data) setOwnerProfile(data);
    };

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
            fetchApplicants();
            if (updatedApp) {
                const applicantId = updatedApp.applicant_id;
                const { id: conversationId } = await supabaseService.createConversation(user!.id, applicantId);
                let message = "";
                if (newStatus === 'approved') message = `「${job?.title}」への応募が承認されました。詳細の打ち合わせを開始してください。`;
                else if (newStatus === 'completed') message = `「${job?.title}」の体験が完了しました。お疲れ様でした！今回の体験の感想を投稿して共有しましょう。\n\n[POST_FEEDBACK:${job?.id}]`;

                if (message) await supabaseService.sendMessage(conversationId, user!.id, message, 'system');
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-600/40 backdrop-blur-sm font-pixel" onClick={onClose}>
            <div
                className={`
                    relative w-full ${isOwner ? 'max-w-5xl' : 'max-w-2xl'} 
                    bg-white flex flex-col max-h-[85vh]
                    border-2 border-gray-600 shadow-[4px_4px_0px_0px_#9ca3af]
                `}
                onClick={e => e.stopPropagation()}
            >
                 {/* 四隅の装飾ピン */}
                 <div className="absolute top-1 left-1 w-1 h-1 bg-gray-400 z-30"></div>
                 <div className="absolute top-1 right-1 w-1 h-1 bg-gray-400 z-30"></div>
                 <div className="absolute bottom-1 left-1 w-1 h-1 bg-gray-400 z-30"></div>
                 <div className="absolute bottom-1 right-1 w-1 h-1 bg-gray-400 z-30"></div>

                {/* Header */}
                <div className="flex justify-between items-center px-5 py-3 border-b-2 border-gray-600 bg-white sticky top-0 z-20">
                    <div className="flex items-center gap-2">
                        <div className="bg-gray-700 text-white p-1">
                            <ClipboardList size={18} strokeWidth={2} />
                        </div>
                        <h2 className="text-base font-black text-gray-800 tracking-tight">
                            募集詳細
                        </h2>
                    </div>

                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-gray-700 hover:text-white transition-all text-gray-600 border-2 border-transparent hover:border-gray-700 rounded-none"
                    >
                        <X size={20} strokeWidth={2.5} />
                    </button>
                </div>

                <div className="flex flex-col md:flex-row flex-1 overflow-hidden bg-gray-50">

                    <div className="flex-1 overflow-y-auto p-5 md:p-6 custom-scrollbar">
                        <div className="space-y-6">

                            <div>
                                <div className="flex items-center gap-3 mb-3">
                                    <span className={`
                                        inline-block border-2 text-xs px-3 py-1 font-black shadow-sm
                                        ${job.status === 'open' 
                                            ? 'bg-red-600 text-white border-gray-600' 
                                            : 'bg-gray-300 text-gray-600 border-gray-400'}
                                    `}>
                                        {job.status === 'open' ? '募集中' : '募集終了'}
                                    </span>
                                    
                                    <span className="text-[10px] font-mono text-gray-400 font-bold">
                                        ID: {job.id.slice(0, 8)}
                                    </span>
                                </div>
                                <h1 className="text-2xl font-black text-gray-800 leading-tight">
                                    {job.title}
                                </h1>
                            </div>

                            <div className="space-y-4">
                                {job.thumbnail_url && (
                                    <div className="w-full aspect-video bg-white border-2 border-gray-600 shadow-[3px_3px_0px_0px_#cbd5e1] overflow-hidden relative">
                                        <img
                                            src={job.thumbnail_url}
                                            alt={job.title}
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute inset-0 bg-black opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)', backgroundSize: '4px 4px' }}></div>
                                    </div>
                                )}

                                {/* 掲載者情報 */}
                                <div className="bg-white p-3 border-2 border-gray-600 shadow-[2px_2px_0px_0px_#e5e7eb] flex items-center gap-3">
                                    {/* アイコンを丸く変更: rounded-full を追加 */}
                                    <div className="w-10 h-10 border-2 border-gray-600 bg-gray-100 flex-shrink-0 overflow-hidden rounded-full">
                                        {ownerProfile?.avatar_type ? (
                                            <img src={`/images/${ownerProfile.avatar_type}`} alt="Owner" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold">
                                                {ownerProfile?.username?.[0] || '?'}
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <div className="text-[10px] text-gray-400 font-bold">掲載者</div>
                                        <div className="text-sm font-black text-gray-700">
                                            {ownerProfile?.username || '不明なユーザー'}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <h3 className="text-xs font-black text-gray-700 flex items-center gap-2 border-l-4 border-gray-600 pl-2">
                                    依頼の概要
                                </h3>
                                <div className="bg-white p-4 border-2 border-gray-600 shadow-[2px_2px_0px_0px_#e5e7eb]">
                                    <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed font-medium">
                                        {job.description || '詳細な記述はありません。'}
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-white p-3 border-2 border-gray-600 shadow-[2px_2px_0px_0px_#e5e7eb]">
                                    <div className="flex items-center gap-1.5 mb-1">
                                        <MapPin size={16} className="text-gray-600" strokeWidth={2.5} />
                                        <span className="text-[10px] font-black text-gray-400">実施場所</span>
                                    </div>
                                    <span className="text-sm font-bold text-gray-800 block pl-5 truncate">{job.location || 'エリア未定'}</span>
                                </div>
                                <div className="bg-white p-3 border-2 border-gray-600 shadow-[2px_2px_0px_0px_#e5e7eb]">
                                    <div className="flex items-center gap-1.5 mb-1">
                                        <Gift size={16} className="text-gray-600" strokeWidth={2.5} />
                                        <span className="text-[10px] font-black text-gray-400">報酬・特典</span>
                                    </div>
                                    <span className="text-sm font-bold text-gray-800 block pl-5 truncate">{job.reward || '要確認'}</span>
                                </div>
                            </div>

                            {!isOwner && (
                                <div className="pt-4 border-t-2 border-dashed border-gray-300">
                                    {userApplication ? (
                                        <button disabled className="w-full py-3 bg-gray-100 border-2 border-gray-300 text-gray-400 font-black cursor-not-allowed flex items-center justify-center gap-2 shadow-none">
                                            <Check size={20} strokeWidth={3} />
                                            応募済み
                                        </button>
                                    ) : (
                                        <button
                                            onClick={handleApplyClick}
                                            className="w-full py-3 bg-gray-700 text-white border-2 border-gray-700 font-black tracking-widest shadow-[4px_4px_0px_0px_#9ca3af] hover:bg-emerald-600 hover:text-white hover:border-emerald-700 active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_#9ca3af] transition-all flex items-center justify-center gap-2"
                                        >
                                            <ClipboardList size={20} strokeWidth={2.5} />
                                            この依頼に応募する
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column (Owner Only) */}
                    {isOwner && (
                        <div className="w-full md:w-80 border-t-2 md:border-t-0 md:border-l-2 border-gray-600 bg-white flex flex-col h-full">
                            <div className="p-3 border-b-2 border-gray-600 bg-gray-50 flex justify-between items-center">
                                <h3 className="font-black text-gray-700 text-xs flex items-center gap-2">
                                    <User size={16} strokeWidth={2.5} /> 応募者一覧
                                </h3>
                                <span className="bg-gray-600 text-white text-[10px] px-2 py-0.5 font-bold border border-gray-600">{applicants.length}</span>
                            </div>

                            <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar bg-gray-50">
                                {applicants.length === 0 ? (
                                    <div className="text-center py-8 text-gray-400 border-2 border-dashed border-gray-300 m-2 font-bold">
                                        <AlertCircle size={32} className="mx-auto mb-2 opacity-50" />
                                        <p className="text-xs">まだ応募者はいません</p>
                                    </div>
                                ) : (
                                    applicants.map(app => (
                                        <div key={app.id} className="bg-white border-2 border-gray-600 p-3 shadow-[2px_2px_0px_0px_#cbd5e1]">
                                            <div className="flex items-center gap-2 mb-2 pb-2 border-b-2 border-gray-100">
                                                {/* 応募者アイコンを丸く変更: rounded-full を追加 */}
                                                <div className="w-8 h-8 border-2 border-gray-600 bg-gray-100 overflow-hidden shrink-0 rounded-full">
                                                    {app.profiles?.avatar_type ? (
                                                        <img src={`/images/${app.profiles.avatar_type}`} alt="Avatar" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                            <User size={16} />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="font-black text-xs text-gray-800 truncate">{app.profiles?.username || '名称未設定'}</p>
                                                    <span className={`inline-block text-[9px] px-1.5 py-0.5 font-black border-2 mt-1 rounded-none ${
                                                        app.status === 'completed' ? 'bg-green-100 text-green-800 border-green-700' :
                                                        app.status === 'approved' ? 'bg-blue-100 text-blue-800 border-blue-700' :
                                                        app.status === 'rejected' ? 'bg-red-100 text-red-800 border-red-700' :
                                                                'bg-gray-100 text-gray-600 border-gray-400'
                                                    }`}>
                                                        {app.status === 'pending' ? '検討中' :
                                                            app.status === 'approved' ? '進行中' :
                                                                app.status === 'completed' ? '完了' : '見送り'}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex gap-1.5">
                                                {app.status === 'pending' && (
                                                    <>
                                                        <button
                                                            onClick={() => handleStatusUpdate(app.id, 'approved')}
                                                            className="flex-1 py-1 bg-gray-700 text-white text-[9px] font-black border-2 border-gray-700 hover:bg-emerald-600 hover:text-white hover:border-emerald-700 active:translate-y-[1px] transition-all"
                                                        >
                                                            承認
                                                        </button>
                                                        <button
                                                            onClick={() => handleStatusUpdate(app.id, 'rejected')}
                                                            className="flex-1 py-1 bg-white text-gray-600 text-[9px] font-black border-2 border-gray-600 hover:bg-gray-200 active:translate-y-[1px] transition-all"
                                                        >
                                                            見送り
                                                        </button>
                                                    </>
                                                )}
                                                {app.status === 'approved' && (
                                                    <button
                                                        onClick={() => handleStatusUpdate(app.id, 'completed')}
                                                        className="w-full py-1 bg-blue-500 text-white text-[9px] font-black border-2 border-blue-600 hover:bg-blue-400 active:translate-y-[1px] transition-all"
                                                    >
                                                        完了を記録
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