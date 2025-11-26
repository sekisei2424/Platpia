import { Database } from '@/types/database';
import Modal from './Modal';
import { MapPin, Gift, Building2 } from 'lucide-react';

type Job = Database['public']['Tables']['jobs']['Row'];

interface JobDetailModalProps {
    job: Job | null;
    isOpen: boolean;
    onClose: () => void;
    onApply: (jobId: string) => void;
}

export default function JobDetailModal({ job, isOpen, onClose, onApply }: JobDetailModalProps) {
    if (!job) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={job.title}>
            <div className="space-y-6">
                {/* Thumbnail */}
                {job.thumbnail_url && (
                    <div className="w-full h-48 bg-gray-200 rounded-lg overflow-hidden">
                        <img 
                            src={job.thumbnail_url} 
                            alt={job.title} 
                            className="w-full h-full object-cover"
                        />
                    </div>
                )}

                {/* Company Info (Placeholder for now as we need to fetch profile) */}
                <div className="flex items-center gap-3 text-gray-600">
                    <Building2 size={20} />
                    <span className="font-medium">Company Name (ID: {job.company_id?.slice(0, 8)}...)</span>
                </div>

                {/* Description */}
                <div className="prose max-w-none">
                    <h3 className="text-lg font-semibold mb-2">この体験について</h3>
                    <p className="text-gray-600 whitespace-pre-wrap">{job.description || '詳細はありません。'}</p>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-start gap-2">
                        <MapPin className="text-village-accent mt-1" size={18} />
                        <div>
                            <span className="block text-xs text-gray-500 font-bold uppercase">場所</span>
                            <span className="text-sm text-gray-700">{job.location || 'オンライン / リモート'}</span>
                        </div>
                    </div>
                    <div className="flex items-start gap-2">
                        <Gift className="text-village-accent mt-1" size={18} />
                        <div>
                            <span className="block text-xs text-gray-500 font-bold uppercase">リワード（報酬）</span>
                            <span className="text-sm text-gray-700">{job.reward || 'ボランティア'}</span>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t">
                    <button 
                        onClick={onClose}
                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        キャンセル
                    </button>
                    <button 
                        onClick={() => onApply(job.id)}
                        className="flex-1 px-4 py-2 bg-village-accent text-white rounded-lg hover:bg-green-600 transition-colors font-medium shadow-sm"
                    >
                        応募する
                    </button>
                </div>
            </div>
        </Modal>
    );
}
