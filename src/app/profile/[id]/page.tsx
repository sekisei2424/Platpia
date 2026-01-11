'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Sidebar from '@/components/ui/Sidebar';
import PostForm from '@/components/ui/PostForm';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabaseService, Post } from '@/services/supabaseService';
import { getAvatarUrl } from '@/lib/avatar'; // Ensure this utility exists or use equivalent logic
import { MessageCircle, Heart, Bookmark } from 'lucide-react';
import PostDetailModal from '@/components/ui/PostDetailModal'; // Assuming we reuse this for viewing posts
import Modal from '@/components/ui/Modal';
import AvatarBuilder from '@/components/avatar/AvatarBuilder';

export default function UserProfilePage() {
    const params = useParams();
    const userId = params.id as string;
    const { user: currentUser } = useAuth();
    const router = useRouter();

    const [profile, setProfile] = useState<any>(null);
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'posts' | 'bookmarks' | 'memories'>('posts');
    const [selectedPost, setSelectedPost] = useState<Post | null>(null);
    const [isPostFormOpen, setIsPostFormOpen] = useState(false);
    const [isAvatarEditing, setIsAvatarEditing] = useState(false);
    const [isProfileEditing, setIsProfileEditing] = useState(false);
    const [editForm, setEditForm] = useState({ username: '', bio: '', user_type: 'individual' });

    useEffect(() => {
        const fetchData = async () => {
            if (!userId) return;
            setLoading(true);
            try {
                const profileData = await supabaseService.fetchProfile(userId);
                setProfile(profileData);
                setEditForm({ 
                    username: profileData?.username || '', 
                    bio: profileData?.bio || '', 
                    user_type: profileData?.user_type || 'individual'
                });

                const postsData = await supabaseService.fetchUserPosts(userId);
                setPosts(postsData);
            } catch (error) {
                console.error("Error loading profile:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [userId]);

    const handleMessage = async () => {
        if (!currentUser) return;
        try {
            const convo = await supabaseService.createConversation(currentUser.id, userId);
            router.push(`/messages/${convo.id}`);
        } catch (error) {
            console.error("Error creating conversation:", error);
        }
    };

    if (loading) return <div className="flex h-screen items-center justify-center font-pixel">Loading...</div>;
    if (!profile) return <div className="flex h-screen items-center justify-center font-pixel">User not found</div>;

    const isOwnProfile = currentUser?.id === userId;

    const reloadProfile = async () => {
        const profileData = await supabaseService.fetchProfile(userId);
        setProfile(profileData);
        setIsAvatarEditing(false);
    };

    const handleProfileSave = async () => {
        if (!currentUser) return;
        try {
            const updated = await supabaseService.updateProfile(currentUser.id, editForm);
            setProfile(updated);
            setIsProfileEditing(false);
        } catch (error) {
            console.error('Error updating profile:', error);
            alert('Failed to update profile');
        }
    };

    return (
        <div className="flex h-screen bg-gray-50 font-pixel flex-col md:flex-row">
            <Sidebar onPostClick={() => setIsPostFormOpen(true)} />
            
            {/* Mobile Header (Only visible on small screens) */}
            <div className="md:hidden bg-white border-b-4 border-gray-900 p-4 sticky top-0 z-30 flex items-center justify-between shadow-[0px_4px_0px_0px_rgba(0,0,0,0.1)]">
                <div className="text-xl font-black uppercase tracking-tighter truncate max-w-[200px] text-gray-900">{profile.username}</div>
                {isOwnProfile && (
                     <button
                        onClick={() => setIsAvatarEditing(!isAvatarEditing)}
                        className="text-xs font-bold border-2 border-gray-900 px-2 py-1 bg-yellow-400 text-gray-900 shadow-[2px_2px_0px_0px_#000] active:translate-y-[1px] active:shadow-none"
                    >
                        {isAvatarEditing ? 'CLOSE EDIT' : 'AVATAR'}
                    </button>
                )}
            </div>

            <div className="flex-1 overflow-hidden h-full flex flex-col md:flex-row relative">
                
                {/* Left Side: Avatar Display & Customization */}
                {/* Mobile: Hidden by default, shown when editing or as a small header. 
                    Desktop: Always visible sidebar */}
                <div className={`
                    w-full md:w-2/5 md:p-8 bg-gray-100 md:border-r-4 border-gray-900 md:overflow-y-auto overflow-hidden flex-col gap-6 md:justify-center
                    ${isAvatarEditing ? 'flex fixed inset-0 z-[60] pt-20 md:static md:flex md:pt-8' : 'hidden md:flex'}
                `}>
                    {/* Mobile Close Button for Avatar Editor */}
                    <div className="md:hidden absolute top-4 right-4 z-50">
                         <button
                            onClick={() => setIsAvatarEditing(false)}
                            className="p-2 bg-white text-gray-900 border-2 border-gray-900 rounded-full shadow-[2px_2px_0px_0px_#000]"
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6L6 18M6 6l12 12"></path></svg>
                        </button>
                    </div>

                    <div className="bg-white border-4 border-gray-900 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)] p-6 flex flex-col items-center h-full md:h-auto overflow-hidden">
                        <div className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 w-full text-center border-b-2 border-gray-100 pb-2">AVATAR</div>
                        
                        {!isAvatarEditing ? (
                            <div className="w-full aspect-square max-w-[300px] border-4 border-gray-900 bg-white mb-6 relative group overflow-hidden">
                                <div className="absolute inset-0 pattern-dots opacity-10"></div>
                                <img 
                                    src={getAvatarUrl(profile.avatar_type)} 
                                    alt={profile.username} 
                                    className="w-full h-full object-cover object-top relative z-10"
                                />
                            </div>
                        ) : (
                            <div className="w-full flex-1 min-h-0 md:mb-6 md:h-[500px]">
                                <AvatarBuilder 
                                    onSaved={reloadProfile} 
                                />
                            </div>
                        )}

                        {isOwnProfile && !isAvatarEditing && (
                            <button
                                onClick={() => setIsAvatarEditing(true)}
                                className="w-full py-3 border-2 border-gray-900 font-bold bg-white text-gray-900 hover:bg-yellow-400 hover:text-gray-900 transition-colors shadow-[4px_4px_0px_0px_#000] active:translate-y-[2px] active:shadow-none"
                            >
                                CUSTOMIZE AVATAR
                            </button>
                        )}
                         {/* Cancel button is now inside AvatarBuilder, but for desktop view logic consistency with variable state toggling, we keep clean structure */}
                    </div>

                    <div className="hidden md:block text-center text-xs text-gray-400 font-bold">
                        PLATPIA RESIDENT ID: {profile.id.substring(0, 8)}
                    </div>
                </div>

                {/* Right Side: Profile Info, Tabs, Content */}
                <div className="flex-1 flex flex-col overflow-hidden bg-white">
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        
                        {/* Profile Info Section */}
                        <div className="mb-0 p-6 md:p-8 md:mb-10">

                             {/* Mobile Avatar (Visible only when sidebar is hidden on mobile) */}
                             <div className="md:hidden flex justify-center mb-6">
                                <div className="w-32 h-32 border-4 border-gray-900 rounded-full overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] bg-gray-100">
                                     <img 
                                        src={getAvatarUrl(profile.avatar_type)} 
                                        alt={profile.username} 
                                        className="w-full h-full object-cover object-top"
                                    />
                                </div>
                             </div>

                            {isProfileEditing && isOwnProfile ? (
                                <div className="bg-white border-4 border-gray-900 p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)] space-y-4">
                                    <h2 className="text-xl font-black uppercase mb-4 text-gray-900">Edit Profile</h2>
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Display Name</label>
                                        <input 
                                            type="text" 
                                            value={editForm.username}
                                            onChange={(e) => setEditForm({...editForm, username: e.target.value})}
                                            className="w-full px-4 py-2 border-2 border-gray-900 font-bold focus:bg-green-50 outline-none text-gray-900 bg-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Account Type</label>
                                        <select
                                            value={editForm.user_type}
                                            onChange={(e) => setEditForm({...editForm, user_type: e.target.value as any})}
                                            className="w-full px-4 py-2 border-2 border-gray-900 font-bold focus:bg-green-50 outline-none bg-white text-gray-900"
                                        >
                                            <option value="individual">Individual (Resident)</option>
                                            <option value="company">Corporate (Company)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Bio</label>
                                        <textarea 
                                            value={editForm.bio}
                                            onChange={(e) => setEditForm({...editForm, bio: e.target.value})}
                                            rows={4}
                                            className="w-full px-4 py-2 border-2 border-gray-900 font-bold focus:bg-green-50 outline-none resize-none text-gray-900 bg-white"
                                        />
                                    </div>
                                    <div className="flex justify-end gap-3 pt-2">
                                        <button 
                                            onClick={() => setIsProfileEditing(false)}
                                            className="px-6 py-2 border-2 border-gray-900 font-bold hover:bg-gray-100 text-gray-900"
                                        >
                                            Cancel
                                        </button>
                                        <button 
                                            onClick={handleProfileSave}
                                            className="px-6 py-2 border-2 border-gray-900 bg-gray-900 text-white font-bold hover:bg-gray-800 shadow-[4px_4px_0px_0px_#000] active:translate-y-[1px] active:shadow-none transition-all"
                                        >
                                            Save Changes
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-white">
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <h1 className="text-4xl md:text-5xl font-black text-gray-900 uppercase tracking-tighter mb-2">
                                                {profile.username}
                                            </h1>
                                            <div className={`
                                                inline-block px-3 py-1 text-xs font-bold uppercase tracking-wider border-2 
                                                ${profile.user_type === 'company' ? 'bg-purple-100 border-purple-900 text-purple-900' : 'bg-green-100 border-green-900 text-green-900'}
                                            `}>
                                                {profile.user_type === 'company' ? 'CORPORATE ACCOUNT' : 'RESIDENT'}
                                            </div>
                                        </div>
                                        
                                        {isOwnProfile ? (
                                             <button 
                                                onClick={() => setIsProfileEditing(true)}
                                                className="px-4 py-2 border-2 border-gray-900 text-xs font-bold uppercase bg-white text-gray-900 hover:bg-gray-900 hover:text-white transition-colors"
                                            >
                                                Edit Profile
                                            </button>
                                        ) : (
                                            <button 
                                                onClick={handleMessage}
                                                className="px-6 py-3 bg-gray-900 text-white font-bold border-2 border-transparent hover:bg-white hover:text-gray-900 hover:border-gray-900 hover:shadow-[4px_4px_0px_0px_#000] transition-all active:translate-y-[1px] active:shadow-none flex items-center gap-2"
                                            >
                                                <MessageCircle size={18} />
                                                <span>MESSAGE</span>
                                            </button>
                                        )}
                                    </div>
                                    
                                    <p className="text-lg text-gray-700 leading-relaxed max-w-2xl whitespace-pre-wrap border-l-4 border-gray-200 pl-4 py-1">
                                        {profile.bio || "No introduction provided."}
                                    </p>
                                </div>
                            )}
                        </div>

                         {/* Tabs */}
                        <div className="sticky top-0 z-20 bg-white px-6 md:px-8 pt-2">
                            <div className="flex border-b-4 border-gray-900 mb-8 bg-white">
                                <button 
                                    onClick={() => setActiveTab('posts')}
                                    className={`flex-1 py-4 font-black transition-colors flex items-center justify-center gap-2 border-r-2 border-gray-100 ${activeTab === 'posts' ? 'bg-gray-900 text-white' : 'hover:bg-gray-50 text-gray-400'}`}
                                >
                                    <span>POSTS</span>
                                    <span className={`text-xs px-2 py-0.5 rounded-full border ${activeTab === 'posts' ? 'bg-white text-gray-900 border-gray-900' : 'bg-gray-200 text-gray-500 border-transparent'}`}>{posts.length}</span>
                                </button>
                                {isOwnProfile && (
                                    <button 
                                        onClick={() => setActiveTab('bookmarks')}
                                        className={`flex-1 py-4 font-black transition-colors flex items-center justify-center gap-2 border-r-2 border-gray-100 ${activeTab === 'bookmarks' ? 'bg-gray-900 text-white' : 'hover:bg-gray-50 text-gray-400'}`}
                                    >
                                        <Bookmark size={18} />
                                        <span>BOOKMARKS</span>
                                    </button>
                                )}
                                {isOwnProfile && (
                                    <button 
                                        onClick={() => setActiveTab('memories')}
                                        className={`flex-1 py-4 font-black transition-colors flex items-center justify-center gap-2 ${activeTab === 'memories' ? 'bg-gray-900 text-white' : 'hover:bg-gray-50 text-gray-400'}`}
                                    >
                                        <span>MEMORIES</span>
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Content Area */}
                        <div className="px-6 md:px-8 pb-24 md:pb-8">
                             {activeTab === 'posts' && (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {posts.map((post) => (
                                        <div 
                                            key={post.id} 
                                            onClick={() => setSelectedPost(post)}
                                            className="bg-white border-4 border-gray-900 p-4 shadow-[4px_4px_0px_0px_#000] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_#000] transition-all cursor-pointer h-56 flex flex-col group"
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="text-xs font-bold text-gray-400">{new Date(post.created_at).toLocaleDateString()}</div>
                                                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                                </div>
                                            </div>
                                            <p className="text-gray-800 font-medium line-clamp-3 mb-4 flex-1 text-sm">{post.content}</p>
                                            {post.image_url && (
                                                <div className="h-24 w-full bg-gray-100 border-2 border-gray-200 mt-auto overflow-hidden relative">
                                                    <img src={post.image_url} alt="Attachment" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    {posts.length === 0 && (
                                        <div className="col-span-full py-20 text-center border-4 border-dashed border-gray-300 rounded-lg">
                                            <p className="text-gray-400 font-bold mb-4">NO POSTS YET</p>
                                            {isOwnProfile && (
                                                <button 
                                                    onClick={() => setIsPostFormOpen(true)}
                                                    className="text-sm font-bold text-gray-900 underline hover:text-green-600"
                                                >
                                                    CREATE YOUR FIRST POST
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'bookmarks' && (
                               <BookmarksList userId={currentUser!.id} />
                            )}

                            {activeTab === 'memories' && (
                                <div className="border-4 border-gray-900 bg-gray-100 p-12 text-center shadow-[4px_4px_0px_0px_#000]">
                                    <h3 className="text-2xl font-black text-gray-900 mb-2">MEMORIES</h3>
                                    <p className="text-gray-600 font-bold mb-8">Coming Soon...</p>
                                    <div className="flex justify-center gap-4 opacity-50">
                                        <div className="w-20 h-24 bg-white border-4 border-gray-900 shadow-[2px_2px_0px_0px_#000] -rotate-6"></div>
                                        <div className="w-20 h-24 bg-white border-4 border-gray-900 shadow-[2px_2px_0px_0px_#000] rotate-3 z-10"></div>
                                        <div className="w-20 h-24 bg-white border-4 border-gray-900 shadow-[2px_2px_0px_0px_#000] -rotate-3"></div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {selectedPost && (
                <PostDetailModal 
                    post={selectedPost} 
                    onClose={() => setSelectedPost(null)} 
                />
            )}

            {isPostFormOpen && (
                <Modal
                    isOpen={isPostFormOpen}
                    onClose={() => setIsPostFormOpen(false)}
                    title="Share Experience"
                >
                    <PostForm onClose={() => setIsPostFormOpen(false)} />
                </Modal>
            )}
        </div>
    );
}

function BookmarksList({ userId }: { userId: string }) {
    const [bookmarks, setBookmarks] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPost, setSelectedPost] = useState<Post | null>(null);

    useEffect(() => {
        const fetchBookmarks = async () => {
            const data = await supabaseService.fetchBookmarkedPosts(userId);
            setBookmarks(data);
            setLoading(false);
        };
        fetchBookmarks();
    }, [userId]);

    if (loading) return <div className="p-8 text-center text-gray-400 font-bold">Loading bookmarks...</div>;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bookmarks.map((post) => (
                <div 
                    key={post.id} 
                    onClick={() => setSelectedPost(post)}
                    className="bg-white border-4 border-gray-900 p-4 shadow-[4px_4px_0px_0px_#000] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_#000] transition-all cursor-pointer h-64 flex flex-col relative"
                >
                     <div className="absolute top-2 right-2 text-yellow-500">
                         <Bookmark size={20} fill="currentColor" />
                     </div>
                    <div className="text-xs font-bold text-gray-400 mb-2">{new Date(post.created_at).toLocaleDateString()}</div>
                    <div className="flex items-center gap-2 mb-2 pb-2 border-b-2 border-gray-100">
                         <div className="w-6 h-6 rounded-full bg-gray-200 overflow-hidden shrink-0">
                             {/* Small User Icon */}
                             <img src={getAvatarUrl(post.profiles?.avatar_type)} className="w-full h-full object-cover" />
                         </div>
                         <div className="text-xs font-bold truncate">{post.profiles?.username}</div>
                    </div>
                    <p className="text-gray-800 font-medium line-clamp-3 mb-4 flex-1">{post.content}</p>
                </div>
            ))}
             {bookmarks.length === 0 && (
                <div className="col-span-full text-center py-20 text-gray-400 font-bold border-4 border-dashed border-gray-300">
                    NO BOOKMARKS YET
                </div>
            )}
            
            {selectedPost && (
                <PostDetailModal 
                    post={selectedPost} 
                    onClose={() => setSelectedPost(null)} 
                />
            )}
        </div>
    );
}
