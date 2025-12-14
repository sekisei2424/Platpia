'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/ui/Sidebar';
import PostForm from '@/components/ui/PostForm';
import Modal from '@/components/ui/Modal';
import AuthModal from '@/components/auth/AuthModal';
import { MapPin, Briefcase, Calendar } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabaseService } from '@/services/supabaseService';

export default function ProfilePage() {
    const [isPostFormOpen, setIsPostFormOpen] = useState(false);
    const { user } = useAuth();
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({ username: '', bio: '' });

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
            <div className="flex-grow relative z-0 overflow-y-auto bg-gray-50 pb-20 md:pb-0">
                {/* Header / Cover */}
                <div className="h-64 bg-gradient-to-r from-village-accent to-green-400 relative">
                    <div className="absolute -bottom-16 left-8">
                        <div className="w-32 h-32 bg-white rounded-full p-1 shadow-xl">
                            <div className="w-full h-full bg-blue-500 rounded-full flex items-center justify-center text-4xl text-white font-bold">
                                {profile?.username?.[0]?.toUpperCase() || 'A'}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="pt-20 px-8 pb-8 max-w-5xl mx-auto">
                    <div className="flex justify-between items-start mb-8">
                        <div className="flex-grow">
                            {isEditing ? (
                                <div className="space-y-4 max-w-md">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Username</label>
                                        <input
                                            type="text"
                                            value={editForm.username}
                                            onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-village-accent focus:ring-village-accent sm:text-sm p-2 border text-gray-900 bg-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Bio</label>
                                        <textarea
                                            value={editForm.bio}
                                            onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                                            rows={3}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-village-accent focus:ring-village-accent sm:text-sm p-2 border text-gray-900 bg-white"
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleSave}
                                            className="px-4 py-2 bg-village-accent text-white rounded-md hover:bg-green-700"
                                        >
                                            Save
                                        </button>
                                        <button
                                            onClick={() => setIsEditing(false)}
                                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <h1 className="text-4xl font-bold text-gray-800">{profile?.username || 'Anonymous'}</h1>
                                    <p className="text-gray-500 text-lg">@{profile?.id?.substring(0, 8)}</p>
                                    <span className={`inline-block mt-2 px-3 py-1 rounded-full text-sm font-medium ${profile?.user_type === 'company'
                                        ? 'bg-purple-100 text-purple-800'
                                        : 'bg-blue-100 text-blue-800'
                                        }`}>
                                        {profile?.user_type === 'company' ? 'Company' : 'Individual'}
                                    </span>
                                    {profile?.bio && (
                                        <p className="mt-4 text-gray-700 whitespace-pre-wrap">{profile.bio}</p>
                                    )}
                                </>
                            )}
                        </div>
                        {!isEditing && (
                            <button 
                                onClick={() => setIsEditing(true)}
                                className="px-6 py-2 border-2 border-gray-300 rounded-full font-bold text-gray-600 hover:bg-gray-50 transition-colors"
                            >
                                Edit Profile
                            </button>
                        )}
                    </div>

                    <div className="flex gap-6 mb-8 text-gray-600">
                        <div className="flex items-center gap-2">
                            <MapPin size={20} />
                            <span>({profile?.current_location_x || 0}, {profile?.current_location_y || 0})</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Briefcase size={20} />
                            <span>{profile?.user_type === 'company' ? 'Organization' : 'Villager'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Calendar size={20} />
                            <span>Joined {new Date(profile?.created_at).toLocaleDateString()}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Left Column: Stats/Bio */}
                        <div className="space-y-6">
                            <div className="bg-white p-6 rounded-2xl shadow-sm">
                                <h3 className="font-bold text-gray-800 mb-4">Bio</h3>
                                <p className="text-gray-600 leading-relaxed">
                                    {profile?.description || "No bio yet."}
                                </p>
                            </div>

                            <div className="bg-white p-6 rounded-2xl shadow-sm">
                                <h3 className="font-bold text-gray-800 mb-4">Stats</h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Level</span>
                                        <span className="font-bold text-village-accent">1</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Reputation</span>
                                        <span className="font-bold text-village-accent">0</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Posts/Activity */}
                        <div className="lg:col-span-2 space-y-6">
                            <h3 className="font-bold text-2xl text-gray-800">Recent Activity</h3>
                            <div className="bg-white p-6 rounded-2xl shadow-sm text-center text-gray-500">
                                No recent activity.
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
