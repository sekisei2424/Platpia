import { X } from 'lucide-react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    maxWidth?: string;
}

export default function Modal({ isOpen, onClose, title, children, maxWidth = 'max-w-md' }: ModalProps) {
    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" 
            onClick={(e) => {
                e.stopPropagation();
                onClose();
            }}
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
        >
            <div 
                className={`bg-[#FDFBF7] w-full ${maxWidth} rounded-xl shadow-2xl overflow-hidden transition-all duration-300`}
                onClick={e => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-white/50">
                    <h2 className="text-xl font-bold text-gray-800">{title}</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800 transition-colors p-1 hover:bg-gray-100 rounded-full">
                        <X size={24} />
                    </button>
                </div>
                <div className="p-4 text-gray-800">
                    {children}
                </div>
            </div>
        </div>
    );
}
