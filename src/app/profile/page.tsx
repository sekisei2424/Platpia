'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/ui/Sidebar';
import PostForm from '@/components/ui/PostForm';
import Modal from '@/components/ui/Modal';
import AuthModal from '@/components/auth/AuthModal';
import AvatarBuilder from '@/components/avatar/AvatarBuilder';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabaseService } from '@/services/supabaseService';

export default function ProfilePage() {
    const [isPostFormOpen, setIsPostFormOpen] = useState(false);
    const { user } = useAuth();
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({ username: '', bio: '' });
    const [isAvatarEditing, setIsAvatarEditing] = useState(false);

    useEffect(() => {
        const loadProfile = async () => {
            if (user) {
                const data = await supabaseService.fetchProfile(user.id);
                setProfile(data);
                setEditForm({ username: data?.username || '', bio: data?.bio || '' });
            }
            setLoading(false);
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

    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

    if (loading) return <div className="flex items-center justify-center h-screen bg-village-base text-white">Loading...</div>;

    if (!user) {
        return (
            <div className="flex items-center justify-center h-screen bg-village-base">
                <div className="text-center text-white space-y-6">
                    <h1 className="text-3xl font-bold">Welcome to Village</h1>
                    <p className="text-gray-300 text-lg">Join our community to create your profile and share your story.</p>

                    <div className="flex flex-col gap-4 items-center">
                        <div className="flex gap-4">
                            <button
                                onClick={() => setIsAuthModalOpen(true)}
                                className="px-8 py-3 bg-village-accent hover:bg-blue-600 text-white rounded-xl font-bold transition-all shadow-lg hover:shadow-blue-500/25"
                            >
                                Sign In / Sign Up
                            </button>
                            <a href="/" className="px-8 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition-all backdrop-blur-sm">
                                Back to Home
                            </a>
                        </div>
                    </div>
                </div>
                <AuthModal
                    isOpen={isAuthModalOpen}
                    onClose={() => setIsAuthModalOpen(false)}
                />
            </div>
        );
    }

    return (
        <main className="flex w-full h-screen bg-village-base overflow-hidden flex-col md:flex-row">
            {/* Sidebar Layer */}
            <div className="flex-shrink-0 z-20">
                <Sidebar onPostClick={() => setIsPostFormOpen(true)} />
            </div>

            {/* Content Layer */}
            <div className="flex-grow relative z-0 overflow-y-auto bg-black pb-20 md:pb-0">
                {/* Header */}
                <div className="bg-black border-b border-white/10 backdrop-blur-sm">
                    <div className="flex items-center justify-center py-8 text-center">
                        <h1 className="text-3xl font-light text-white tracking-tight">My Profile</h1>
                    </div>
                </div>

                <div className="pt-8 px-6 pb-8 max-w-6xl mx-auto">
                    <div className="flex flex-col lg:flex-row gap-12">
                        {/* Left: Avatar + Builder */}
                        <div className="lg:w-2/5">
                            <div className="space-y-6">
                                <div className="text-center">
                                    <h2 className="text-sm font-semibold text-white/60 tracking-tight uppercase mb-4">Character</h2>
                                    <div className="flex items-center justify-center">
                                        <div className="w-80 h-80 bg-gradient-to-b from-gray-800 to-gray-900 rounded-2xl overflow-hidden flex items-center justify-center border border-white/10">
                                            {profile?.avatar_type ? (
                                                <img src={profile.avatar_type} alt={profile.username} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="text-6xl text-white bg-gradient-to-br from-blue-600 to-blue-700 w-full h-full flex items-center justify-center font-bold">{profile?.username?.[0]?.toUpperCase() || 'A'}</div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-center">
                                    {!isAvatarEditing ? (
                                        <button
                                            onClick={() => setIsAvatarEditing(true)}
                                            className="px-6 py-2.5 bg-white/10 text-white rounded-lg font-medium hover:bg-white/20 transition-colors border border-white/20"
                                        >
                                            Edit Avatar
                                        </button>
                                    ) : (
                                        <div className="w-full">
                                            <div className="mb-4 flex justify-end">
                                                <button
                                                    onClick={() => setIsAvatarEditing(false)}
                                                    className="px-4 py-2 text-white/70 text-sm hover:text-white transition-colors"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                            <AvatarBuilder onSaved={async () => { await reloadProfile(); setIsAvatarEditing(false); }} />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Right: Profile Information */}
                        <div className="lg:w-3/5 space-y-6">
                            <div className="bg-gradient-to-b from-gray-900/50 to-black/50 p-8 rounded-2xl border border-white/10 backdrop-blur-sm">
                                <h3 className="text-xs font-semibold text-white/40 tracking-wider uppercase mb-4">Profile</h3>

                                {isEditing ? (
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-medium text-white/60 mb-2">NAME</label>
                                            <input
                                                type="text"
                                                value={editForm.username}
                                                onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                                                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-white/30 focus:outline-none focus:border-white/30 focus:bg-white/10 transition-colors"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-white/60 mb-2">BIO</label>
                                            <textarea
                                                value={editForm.bio}
                                                onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                                                rows={3}
                                                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-white/30 focus:outline-none focus:border-white/30 focus:bg-white/10 transition-colors"
                                            />
                                        </div>
                                        <div className="flex gap-2 justify-end pt-2">
                                            <button
                                                onClick={handleSave}
                                                className="px-4 py-2 bg-white text-black rounded-lg text-sm font-medium hover:bg-white/90 transition-colors"
                                            >
                                                Save
                                            </button>
                                            <button
                                                onClick={() => setIsEditing(false)}
                                                className="px-4 py-2 bg-white/10 text-white rounded-lg text-sm font-medium hover:bg-white/20 transition-colors border border-white/10"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div>
                                        <div className="flex items-start justify-between mb-6">
                                            <div>
                                                <h1 className="text-2xl font-light text-white tracking-tight">{profile?.username || 'Anonymous'}</h1>
                                                <p className="text-white/40 text-sm mt-1">@{profile?.id?.substring(0, 8)}</p>
                                            </div>
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                                profile?.user_type === 'company'
                                                    ? 'bg-purple-500/20 text-purple-300'
                                                    : 'bg-blue-500/20 text-blue-300'
                                            }`}>
                                                {profile?.user_type === 'company' ? 'Company' : 'Villager'}
                                            </span>
                                        </div>
                                        {profile?.bio && (
                                            <p className="text-white/70 text-sm leading-relaxed mb-6">{profile.bio}</p>
                                        )}
                                        <button
                                            onClick={() => setIsEditing(true)}
                                            className="px-4 py-2 bg-white/10 text-white rounded-lg text-sm font-medium hover:bg-white/20 transition-colors border border-white/20"
                                        >
                                            Edit
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="bg-gradient-to-b from-gray-900/50 to-black/50 p-8 rounded-2xl border border-white/10 backdrop-blur-sm">
                                <h3 className="text-xs font-semibold text-white/40 tracking-wider uppercase mb-6">Details</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                                        <div className="text-xs font-medium text-white/50 uppercase tracking-wide mb-2">Location</div>
                                        <div className="text-lg font-light text-white">({profile?.current_location_x || 0}, {profile?.current_location_y || 0})</div>
                                    </div>
                                    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                                        <div className="text-xs font-medium text-white/50 uppercase tracking-wide mb-2">Type</div>
                                        <div className="text-lg font-light text-white">{profile?.user_type === 'company' ? 'Company' : 'Villager'}</div>
                                    </div>
                                    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                                        <div className="text-xs font-medium text-white/50 uppercase tracking-wide mb-2">Joined</div>
                                        <div className="text-sm font-light text-white/80">{new Date(profile?.created_at).toLocaleDateString()}</div>
                                    </div>
                                    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                                        <div className="text-xs font-medium text-white/50 uppercase tracking-wide mb-2">Member ID</div>
                                        <div className="text-sm font-light text-white/80">{profile?.id?.substring(0, 6)}</div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gradient-to-b from-gray-900/50 to-black/50 p-8 rounded-2xl border border-white/10 backdrop-blur-sm">
                                <h3 className="text-xs font-semibold text-white/40 tracking-wider uppercase mb-4">About</h3>
                                <p className="text-white/70 leading-relaxed text-sm">
                                    {profile?.description || 'No description yet.'}
                                </p>
                            </div>

                            <div className="bg-gradient-to-b from-gray-900/50 to-black/50 p-8 rounded-2xl border border-white/10 backdrop-blur-sm">
                                <h3 className="text-xs font-semibold text-white/40 tracking-wider uppercase mb-6">Stats</h3>
                                <div className="space-y-6">
                                    <div>
                                        <div className="flex justify-between items-center mb-3">
                                            <span className="text-xs font-medium text-white/60 uppercase tracking-wide">Level</span>
                                            <span className="text-xl font-light text-white">1</span>
                                        </div>
                                        <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                                            <div className="w-1/10 h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"></div>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex justify-between items-center mb-3">
                                            <span className="text-xs font-medium text-white/60 uppercase tracking-wide">Reputation</span>
                                            <span className="text-xl font-light text-white">0</span>
                                        </div>
                                        <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                                            <div className="w-0 h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gradient-to-b from-gray-900/50 to-black/50 p-8 rounded-2xl border border-white/10 backdrop-blur-sm">
                                <h3 className="text-xs font-semibold text-white/40 tracking-wider uppercase mb-4">Activity</h3>
                                <p className="text-white/50 text-center text-sm">
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

