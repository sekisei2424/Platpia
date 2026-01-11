'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/ui/Sidebar';
import PostForm from '@/components/ui/PostForm';
import Modal from '@/components/ui/Modal';
import AvatarBuilder from '@/components/avatar/AvatarBuilder';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabaseService } from '@/services/supabaseService';

export default function ProfilePage() {
    const [isPostFormOpen, setIsPostFormOpen] = useState(false);
    const { user, loading } = useAuth();
    const router = useRouter();
    const [profile, setProfile] = useState<any>(null);
    const [pageLoading, setPageLoading] = useState(true);

    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({ username: '', bio: '' });
    const [isAvatarEditing, setIsAvatarEditing] = useState(false);

    // ログイン状態をチェック：未認証なら /auth にリダイレクト
    useEffect(() => {
        if (!loading && !user) {
            router.push('/auth');
        }
    }, [user, loading, router]);

    useEffect(() => {
        const loadProfile = async () => {
            if (user) {
                const data = await supabaseService.fetchProfile(user.id);
                setProfile(data);
                setEditForm({ username: data?.username || '', bio: data?.bio || '' });
            }
            setPageLoading(false);
        };
        loadProfile();
    }, [user]);

    const reloadProfile = async () => {
        if (user) {
            const data = await supabaseService.fetchProfile(user.id);
            setProfile(data);
            setEditForm({ username: data?.username || '', bio: data?.bio || '' });
        }
    };

    const handleSave = async () => {
        if (!user) return;
        try {
            const updated = await supabaseService.updateProfile(user.id, editForm);
            setProfile(updated);
            setIsEditing(false);
        } catch (error) {
            console.error('Error updating profile:', error);
            alert('Failed to update profile');
        }
    };

    if (loading || pageLoading) return <div className="flex items-center justify-center h-screen bg-white text-gray-900 font-pixel">Loading...</div>;

    return (
        <main className="flex w-full h-screen bg-white overflow-hidden flex-col md:flex-row font-pixel text-gray-900 select-none">
            {/* Sidebar Layer */}
            <div className="flex-shrink-0 z-20">
                <Sidebar onPostClick={() => setIsPostFormOpen(true)} />
            </div>

            {/* Content Layer */}
            <div className="flex-grow relative z-0 overflow-y-auto bg-white pb-20 md:pb-0">
                {/* Header */}
                <div className="bg-white border-b-2 border-gray-900">
                    <div className="flex items-center justify-center py-6 text-center">
                        <h1 className="text-2xl font-black text-gray-900 tracking-tighter uppercase">My Profile</h1>
                    </div>
                </div>

                <div className="pt-8 px-6 pb-8 h-full overflow-hidden">
                    <div className="flex flex-col lg:flex-row gap-8 h-full">
                        {/* Left: Avatar + Builder - 拡大版 */}
                        <div className="lg:w-3/5 flex flex-col">
                            <div className="text-xs font-bold text-gray-600 tracking-widest uppercase mb-4">Character</div>
                            
                            {!isAvatarEditing ? (
                                <div className="flex-grow flex items-center justify-center min-h-0">
                                    <div className="w-full h-full max-w-2xl max-h-2xl bg-white border-2 border-gray-900 overflow-hidden flex items-center justify-center shadow-[4px_4px_0px_rgba(0,0,0,0.1)]">
                                        {profile?.avatar_type ? (
                                            <img src={profile.avatar_type} alt={profile.username} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="text-8xl text-white bg-gray-900 w-full h-full flex items-center justify-center font-black">{profile?.username?.[0]?.toUpperCase() || 'A'}</div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="flex-grow flex items-center justify-center min-h-0 overflow-y-auto">
                                    <div className="w-full">
                                        <AvatarBuilder onSaved={async () => { await reloadProfile(); setIsAvatarEditing(false); }} />
                                    </div>
                                </div>
                            )}
                            
                            <div className="flex justify-center gap-3 mt-4">
                                {!isAvatarEditing ? (
                                    <button
                                        onClick={() => setIsAvatarEditing(true)}
                                        className={`
                                            px-6 py-3 border-2 border-gray-900 font-bold transition-all text-sm uppercase tracking-widest
                                            bg-white text-gray-900 shadow-[inset_-2px_-2px_0px_rgba(0,0,0,0.1),inset_2px_2px_0px_#ffffff,2px_2px_0px_#000] hover:bg-gray-50 active:shadow-none active:translate-y-[2px]
                                        `}
                                    >
                                        Edit Avatar
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => setIsAvatarEditing(false)}
                                        className={`
                                            px-6 py-3 border-2 border-gray-900 font-bold transition-all text-sm uppercase tracking-widest
                                            bg-white text-gray-900 shadow-[inset_-2px_-2px_0px_rgba(0,0,0,0.1),inset_2px_2px_0px_#ffffff,2px_2px_0px_#000] hover:bg-gray-50 active:shadow-none active:translate-y-[2px]
                                        `}
                                    >
                                        Cancel
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Right: Profile Information */}
                        <div className="lg:w-2/5 space-y-6 overflow-y-auto">
                            <div className="relative bg-white border-2 border-gray-900 p-6 shadow-[4px_4px_0px_rgba(0,0,0,0.1)]">
                                <div className="absolute top-1 left-1 w-3 h-3 border-t-2 border-l-2 border-gray-900"></div>
                                <div className="absolute top-1 right-1 w-3 h-3 border-t-2 border-r-2 border-gray-900"></div>
                                <div className="absolute bottom-1 left-1 w-3 h-3 border-b-2 border-l-2 border-gray-900"></div>
                                <div className="absolute bottom-1 right-1 w-3 h-3 border-b-2 border-r-2 border-gray-900"></div>
                                
                                <h3 className="text-xs font-bold text-gray-600 tracking-widest uppercase mb-4">Profile</h3>

                                {isEditing ? (
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-xs font-bold text-gray-600 uppercase tracking-widest block mb-2">Name</label>
                                            <input
                                                type="text"
                                                value={editForm.username}
                                                onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                                                className="w-full h-10 px-3 text-gray-900 border-2 border-gray-900 bg-white shadow-[inset_2px_2px_0px_rgba(0,0,0,0.1)] outline-none font-bold text-sm placeholder:text-gray-400 focus:bg-green-50/50 transition-colors"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-gray-600 uppercase tracking-widest block mb-2">Bio</label>
                                            <textarea
                                                value={editForm.bio}
                                                onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                                                rows={3}
                                                className="w-full px-3 py-2 text-gray-900 border-2 border-gray-900 bg-white shadow-[inset_2px_2px_0px_rgba(0,0,0,0.1)] outline-none font-bold text-sm placeholder:text-gray-400 focus:bg-green-50/50 transition-colors"
                                            />
                                        </div>
                                        <div className="flex gap-2 justify-end pt-2">
                                            <button
                                                onClick={handleSave}
                                                className={`px-4 py-2 border-2 border-gray-900 font-bold transition-all text-sm bg-gray-900 text-white shadow-[inset_2px_2px_0px_rgba(50,50,50,1)] translate-y-[2px]`}
                                            >
                                                Save
                                            </button>
                                            <button
                                                onClick={() => setIsEditing(false)}
                                                className={`px-4 py-2 border-2 border-gray-900 font-bold transition-all text-sm bg-white text-gray-900 shadow-[inset_-2px_-2px_0px_rgba(0,0,0,0.1),inset_2px_2px_0px_#ffffff,2px_2px_0px_#000] hover:bg-gray-50 active:shadow-none active:translate-y-[2px]`}
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div>
                                        <div className="flex items-start justify-between mb-4">
                                            <div>
                                                <h1 className="text-xl font-black text-gray-900 tracking-tighter uppercase">{profile?.username || 'Anonymous'}</h1>
                                                <p className="text-gray-500 text-xs mt-1 font-bold">@{profile?.id?.substring(0, 8)}</p>
                                            </div>
                                            <span className={`px-2 py-1 text-xs font-bold uppercase tracking-widest border-2 ${
                                                profile?.user_type === 'company'
                                                    ? 'border-purple-600 bg-purple-100 text-purple-700'
                                                    : 'border-blue-600 bg-blue-100 text-blue-700'
                                            }`}>
                                                {profile?.user_type === 'company' ? '法人' : '個人'}
                                            </span>
                                        </div>
                                        {profile?.bio && (
                                            <p className="text-gray-700 text-sm leading-relaxed mb-4">{profile.bio}</p>
                                        )}
                                        <button
                                            onClick={() => setIsEditing(true)}
                                            className={`px-4 py-2 border-2 border-gray-900 font-bold transition-all text-sm bg-white text-gray-900 shadow-[inset_-2px_-2px_0px_rgba(0,0,0,0.1),inset_2px_2px_0px_#ffffff,2px_2px_0px_#000] hover:bg-gray-50 active:shadow-none active:translate-y-[2px]`}
                                        >
                                            Edit
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="relative bg-white border-2 border-gray-900 p-6 shadow-[4px_4px_0px_rgba(0,0,0,0.1)]">
                                <div className="absolute top-1 left-1 w-3 h-3 border-t-2 border-l-2 border-gray-900"></div>
                                <div className="absolute top-1 right-1 w-3 h-3 border-t-2 border-r-2 border-gray-900"></div>
                                <div className="absolute bottom-1 left-1 w-3 h-3 border-b-2 border-l-2 border-gray-900"></div>
                                <div className="absolute bottom-1 right-1 w-3 h-3 border-b-2 border-r-2 border-gray-900"></div>
                                
                                <h3 className="text-xs font-bold text-gray-600 tracking-widest uppercase mb-4">Details</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-white border-2 border-gray-900 p-3 shadow-[2px_2px_0px_rgba(0,0,0,0.1)]">
                                        <div className="text-xs font-bold text-gray-600 uppercase tracking-widest mb-1">Location</div>
                                        <div className="text-sm font-bold text-gray-900">({profile?.current_location_x || 0}, {profile?.current_location_y || 0})</div>
                                    </div>
                                    <div className="bg-white border-2 border-gray-900 p-3 shadow-[2px_2px_0px_rgba(0,0,0,0.1)]">
                                        <div className="text-xs font-bold text-gray-600 uppercase tracking-widest mb-1">Type</div>
                                        <div className="text-sm font-bold text-gray-900">{profile?.user_type === 'company' ? '法人' : '個人'}</div>
                                    </div>
                                    <div className="bg-white border-2 border-gray-900 p-3 shadow-[2px_2px_0px_rgba(0,0,0,0.1)]">
                                        <div className="text-xs font-bold text-gray-600 uppercase tracking-widest mb-1">Joined</div>
                                        <div className="text-xs font-bold text-gray-700">{new Date(profile?.created_at).toLocaleDateString('ja-JP')}</div>
                                    </div>
                                    <div className="bg-white border-2 border-gray-900 p-3 shadow-[2px_2px_0px_rgba(0,0,0,0.1)]">
                                        <div className="text-xs font-bold text-gray-600 uppercase tracking-widest mb-1">Member ID</div>
                                        <div className="text-xs font-bold text-gray-700">{profile?.id?.substring(0, 6)}</div>
                                    </div>
                                </div>
                            </div>

                            <div className="relative bg-white border-2 border-gray-900 p-6 shadow-[4px_4px_0px_rgba(0,0,0,0.1)]">
                                <div className="absolute top-1 left-1 w-3 h-3 border-t-2 border-l-2 border-gray-900"></div>
                                <div className="absolute top-1 right-1 w-3 h-3 border-t-2 border-r-2 border-gray-900"></div>
                                <div className="absolute bottom-1 left-1 w-3 h-3 border-b-2 border-l-2 border-gray-900"></div>
                                <div className="absolute bottom-1 right-1 w-3 h-3 border-b-2 border-r-2 border-gray-900"></div>
                                
                                <h3 className="text-xs font-bold text-gray-600 tracking-widest uppercase mb-3">About</h3>
                                <p className="text-gray-700 text-sm leading-relaxed font-medium">
                                    {profile?.description || 'No description yet.'}
                                </p>
                            </div>

                            <div className="relative bg-white border-2 border-gray-900 p-6 shadow-[4px_4px_0px_rgba(0,0,0,0.1)]">
                                <div className="absolute top-1 left-1 w-3 h-3 border-t-2 border-l-2 border-gray-900"></div>
                                <div className="absolute top-1 right-1 w-3 h-3 border-t-2 border-r-2 border-gray-900"></div>
                                <div className="absolute bottom-1 left-1 w-3 h-3 border-b-2 border-l-2 border-gray-900"></div>
                                <div className="absolute bottom-1 right-1 w-3 h-3 border-b-2 border-r-2 border-gray-900"></div>
                                
                                <h3 className="text-xs font-bold text-gray-600 tracking-widest uppercase mb-4">Stats</h3>
                                <div className="space-y-4">
                                    <div>
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-xs font-bold text-gray-600 uppercase tracking-widest">Level</span>
                                            <span className="text-lg font-black text-gray-900">1</span>
                                        </div>
                                        <div className="w-full h-3 bg-gray-200 border-2 border-gray-900 overflow-hidden shadow-[inset_1px_1px_0px_rgba(0,0,0,0.1)]">
                                            <div className="w-1/10 h-full bg-blue-600"></div>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-xs font-bold text-gray-600 uppercase tracking-widest">Reputation</span>
                                            <span className="text-lg font-black text-gray-900">0</span>
                                        </div>
                                        <div className="w-full h-3 bg-gray-200 border-2 border-gray-900 overflow-hidden shadow-[inset_1px_1px_0px_rgba(0,0,0,0.1)]">
                                            <div className="w-0 h-full bg-orange-500"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="relative bg-white border-2 border-gray-900 p-6 shadow-[4px_4px_0px_rgba(0,0,0,0.1)]">
                                <div className="absolute top-1 left-1 w-3 h-3 border-t-2 border-l-2 border-gray-900"></div>
                                <div className="absolute top-1 right-1 w-3 h-3 border-t-2 border-r-2 border-gray-900"></div>
                                <div className="absolute bottom-1 left-1 w-3 h-3 border-b-2 border-l-2 border-gray-900"></div>
                                <div className="absolute bottom-1 right-1 w-3 h-3 border-b-2 border-r-2 border-gray-900"></div>
                                
                                <h3 className="text-xs font-bold text-gray-600 tracking-widest uppercase mb-4">Activity</h3>
                                <p className="text-gray-500 text-center text-xs font-bold">
                                    No recent activity
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals */}
            {isPostFormOpen && (
                <Modal
                    isOpen={isPostFormOpen}
                    onClose={() => setIsPostFormOpen(false)}
                    title="Share Experience"
                >
                    <PostForm onClose={() => setIsPostFormOpen(false)} />
                </Modal>
            )}
        </main>
    );
}

