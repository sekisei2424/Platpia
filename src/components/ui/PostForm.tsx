import { useState } from 'react';
import { X, Send, Image as ImageIcon, LogIn } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabaseService } from '@/services/supabaseService';
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

        if (!content.trim() && !imageFile) return;

        setIsSubmitting(true);
        try {
            let imageUrl = undefined;
            if (imageFile) {
                const url = await supabaseService.uploadImage(imageFile);
                if (url) imageUrl = url;
            }

            const newPost = await supabaseService.createPost(content, user.id, imageUrl);
            if (newPost) {
                console.log('Post created:', newPost);
                onClose();
                window.location.reload();
            }
        } catch (error) {
            console.error('Failed to create post:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="w-full max-w-2xl mx-auto">
            <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />

            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                <div className="relative">
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder={user ? "村での出来事をシェアしよう！" : "投稿するにはログインしてください..."}
                        disabled={!user}
                        className="w-full h-32 bg-white/50 backdrop-blur-sm rounded-2xl p-6 text-lg text-gray-800 placeholder-gray-500 border border-white/50 focus:outline-none focus:ring-2 focus:ring-village-accent/50 resize-none shadow-inner transition-all disabled:opacity-50"
                    />
                    
                    {previewUrl && (
                        <div className="mt-4 relative w-full h-48 bg-gray-100 rounded-xl overflow-hidden">
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

                    <div className="absolute bottom-4 right-4 text-gray-500 text-sm">
                        {content.length}/280
                    </div>
                </div>

                <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 px-4 py-2 rounded-xl text-gray-600 hover:bg-white/50 transition-colors cursor-pointer">
                        <ImageIcon size={20} />
                        <span>写真を追加</span>
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
                                disabled={(!content.trim() && !imageFile) || isSubmitting}
                                className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-village-accent to-green-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Send size={18} />
                                {isSubmitting ? '投稿中...' : '投稿する'}
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
