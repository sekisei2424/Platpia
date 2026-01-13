"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Sidebar from "@/components/ui/Sidebar";
import PostForm from "@/components/ui/PostForm";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabaseService, Post } from "@/services/supabaseService";
import { getAvatarUrl } from "@/lib/avatar";
import {
  MessageCircle,
  Heart,
  Bookmark,
  Calendar,
  User,
  Briefcase,
  Palette,
} from "lucide-react";
import PostDetailModal from "@/components/ui/PostDetailModal";
import Modal from "@/components/ui/Modal";
import AvatarBuilder from "@/components/avatar/AvatarBuilder";

export default function UserProfilePage() {
  const params = useParams();
  const userId = params.id as string;
  const { user: currentUser, loading: authLoading } = useAuth();
  const router = useRouter();

  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "posts" | "bookmarks" | "memories" | "jobs"
  >("posts");
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isPostFormOpen, setIsPostFormOpen] = useState(false);
  const [isAvatarEditing, setIsAvatarEditing] = useState(false);
  const [isProfileEditing, setIsProfileEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    username: "",
    bio: "",
    user_type: "individual",
  });

  // 【重要】ログアウト検知用：currentUserがnullになったら profile/page.tsx へ戻す
  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.replace("/profile");
    }
  }, [currentUser, authLoading, router]);

  useEffect(() => {
    const fetchData = async () => {
      if (!userId || authLoading || !currentUser) return;
      setLoading(true);
      try {
        const profileData = await supabaseService.fetchProfile(userId);
        setProfile(profileData);
        setEditForm({
          username: profileData?.username || "",
          bio: profileData?.bio || "",
          user_type: profileData?.user_type || "individual",
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
  }, [userId, currentUser, authLoading]);

  const handleMessage = async () => {
    if (!currentUser) return;
    try {
      const convo = await supabaseService.createConversation(
        currentUser.id,
        userId
      );
      router.push(`/messages/${convo.id}`);
    } catch (error) {
      console.error("Error creating conversation:", error);
    }
  };

  // 認証待ち、またはログアウト後の遷移中は何も表示しない（バグ防止）
  if (authLoading || !currentUser) {
    return (
      <div className="flex h-screen items-center justify-center font-pixel bg-white">
        Loading...
      </div>
    );
  }

  if (loading && !profile)
    return (
      <div className="flex h-screen items-center justify-center font-pixel bg-white">
        Loading Profile...
      </div>
    );
  if (!profile)
    return (
      <div className="flex h-screen items-center justify-center font-pixel bg-white">
        User not found
      </div>
    );

  const isOwnProfile = currentUser?.id === userId;

  const reloadProfile = async () => {
    const profileData = await supabaseService.fetchProfile(userId);
    setProfile(profileData);
    setIsAvatarEditing(false);
  };

  const handleProfileSave = async () => {
    if (!currentUser) return;
    try {
      const updated = await supabaseService.updateProfile(
        currentUser.id,
        editForm
      );
      setProfile(updated);
      setIsProfileEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile");
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 font-pixel flex-col md:flex-row text-gray-900">
      <Sidebar onPostClick={() => setIsPostFormOpen(true)} />

      <div className="flex-1 overflow-hidden h-full flex flex-col md:flex-row relative">
        {/* Left Side: Avatar Display & Customization */}
        <div
          className={`
                    w-full md:w-2/5 md:p-8 bg-gray-100 md:border-r-4 border-gray-900 md:overflow-y-auto overflow-y-auto flex-col gap-6 md:justify-center
                    ${
                      isAvatarEditing
                        ? "flex fixed inset-0 z-[60] pt-20 md:static md:flex md:pt-8"
                        : "hidden md:flex"
                    }
                `}
        >
          <div className="bg-white border-4 border-gray-900 shadow-[8px_8px_0px_0px_#000] p-6 flex flex-col items-center">
            <div className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 w-full text-center border-b-2 border-gray-100 pb-2">
              RESIDENT
            </div>

            {!isAvatarEditing ? (
              <div className="w-full aspect-square max-w-[300px] border-4 border-gray-900 bg-white mb-6 relative group overflow-hidden shadow-[inset_4px_4px_0px_rgba(0,0,0,0.05)]">
                <img
                  src={getAvatarUrl(profile.avatar_type)}
                  alt={profile.username}
                  className="w-full h-full object-cover object-top relative z-10"
                />
              </div>
            ) : (
              <div className="w-full flex-1 min-h-0 md:mb-6 md:h-[500px]">
                <AvatarBuilder onSaved={reloadProfile} />
              </div>
            )}

            {isOwnProfile && !isAvatarEditing && (
              <button
                onClick={() => setIsAvatarEditing(true)}
                className="w-full py-3 border-2 border-gray-900 font-bold bg-white text-gray-900 hover:bg-yellow-400 shadow-[4px_4px_0px_0px_#000] active:translate-y-[2px] active:shadow-none transition-all"
              >
                CUSTOMIZE AVATAR
              </button>
            )}
          </div>
        </div>

        {/* Right Side: Profile Info, Tabs, Content */}
        <div className="flex-1 flex flex-col overflow-hidden bg-white">
          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-10">
            <div className="mb-10">
              {/* Mobile Avatar Display */}
              <div className="md:hidden flex items-center gap-4 mb-6">
                 <div className="relative">
                    <div className="w-24 h-24 border-4 border-gray-900 bg-white shadow-[4px_4px_0_#000] overflow-hidden">
                        <img 
                            src={getAvatarUrl(profile.avatar_type)} 
                            alt={profile.username}
                            className="w-full h-full object-cover object-top"
                        />
                    </div>
                 </div>
                 {isOwnProfile && (
                     <button 
                        onClick={() => setIsAvatarEditing(true)}
                        className="flex items-center gap-2 px-4 py-2 border-2 border-gray-900 bg-yellow-400 font-bold text-xs uppercase shadow-[2px_2px_0_#000] active:translate-y-[1px] active:shadow-none"
                     >
                        <Palette size={16} />
                        Customize
                     </button>
                 )}
              </div>

              {isProfileEditing ? (
                <div className="bg-white border-4 border-gray-900 p-6 shadow-[8px_8px_0px_0px_#000] space-y-4">
                  <h2 className="text-xl font-black uppercase mb-4 text-gray-900">
                    Edit Profile
                  </h2>
                  <input
                    type="text"
                    value={editForm.username}
                    onChange={(e) =>
                      setEditForm({ ...editForm, username: e.target.value })
                    }
                    className="w-full px-4 py-2 border-2 border-gray-900 font-bold outline-none text-gray-900 bg-white"
                  />
                  <textarea
                    value={editForm.bio}
                    onChange={(e) =>
                      setEditForm({ ...editForm, bio: e.target.value })
                    }
                    rows={4}
                    className="w-full px-4 py-2 border-2 border-gray-900 font-bold outline-none resize-none text-gray-900 bg-white"
                  />
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => setIsProfileEditing(false)}
                      className="px-6 py-2 border-2 border-gray-900 font-bold hover:bg-gray-100 text-gray-900"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleProfileSave}
                      className="px-6 py-2 border-2 border-gray-900 bg-gray-900 text-white font-bold shadow-[4px_4px_0px_0px_#000] active:translate-y-[1px] active:shadow-none"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex flex-col md:flex-row justify-between md:items-start gap-4 mb-6">
                    <div className="min-w-0">
                      <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter mb-2 text-gray-900 break-words md:whitespace-nowrap overflow-hidden text-ellipsis">
                        {profile.username}
                      </h1>
                      <span className="px-3 py-1 text-xs font-bold border-2 border-gray-900 bg-gray-100 uppercase tracking-widest text-gray-900 inline-block">
                        {profile.user_type === "company"
                          ? "CORPORATE"
                          : "RESIDENT"}
                      </span>
                    </div>
                    {isOwnProfile ? (
                      <button
                        onClick={() => setIsProfileEditing(true)}
                        className="self-start px-4 py-2 border-2 border-gray-900 text-xs font-bold uppercase hover:bg-gray-900 hover:text-white transition-colors text-gray-900 shrink-0"
                      >
                        Edit Profile
                      </button>
                    ) : (
                      <button
                        onClick={handleMessage}
                        className="self-start px-6 py-3 bg-gray-900 text-white font-bold border-2 border-gray-900 shadow-[4px_4px_0px_0px_#000] flex items-center gap-2 active:translate-y-[2px] active:shadow-none transition-all shrink-0"
                      >
                        <MessageCircle size={18} /> MESSAGE
                      </button>
                    )}
                  </div>
                  <p className="text-sm md:text-lg leading-relaxed border-l-8 border-gray-900 pl-6 py-2 bg-gray-50 whitespace-pre-wrap text-gray-700">
                    {profile.bio || "No introduction provided."}
                  </p>
                </div>
              )}
            </div>

            {/* Tabs */}
            <div className="flex border-b-4 border-gray-900 mb-10 overflow-x-auto scrollbar-hide">
              {profile.user_type === 'company' ? (
                 <>
                    <button
                      onClick={() => setActiveTab('posts')}
                      className={`flex-1 min-w-[120px] py-4 font-black uppercase text-sm transition-all border-r-2 border-gray-100
                        ${activeTab === 'posts' ? "bg-gray-900 text-white" : "text-gray-400 hover:bg-gray-50"}`}
                    >
                      POSTS
                    </button>
                    <button
                      onClick={() => setActiveTab('jobs')}
                      className={`flex-1 min-w-[120px] py-4 font-black uppercase text-sm transition-all border-r-2 border-gray-100
                        ${activeTab === 'jobs' ? "bg-gray-900 text-white" : "text-gray-400 hover:bg-gray-50"}`}
                    >
                      JOBS
                    </button>
                 </>
              ) : (
                <>
                    <button
                      onClick={() => setActiveTab('posts')}
                      className={`flex-1 min-w-[120px] py-4 font-black uppercase text-sm transition-all border-r-2 border-gray-100
                        ${activeTab === 'posts' ? "bg-gray-900 text-white" : "text-gray-400 hover:bg-gray-50"}`}
                    >
                      POSTS
                    </button>
                    {isOwnProfile && (
                        <button
                          onClick={() => setActiveTab('bookmarks')}
                          className={`flex-1 min-w-[120px] py-4 font-black uppercase text-sm transition-all border-r-2 border-gray-100
                            ${activeTab === 'bookmarks' ? "bg-gray-900 text-white" : "text-gray-400 hover:bg-gray-50"}`}
                        >
                          BOOKMARKS
                        </button>
                    )}
                    {(isOwnProfile || activeTab === 'memories') && (
                        <button
                          onClick={() => setActiveTab('memories')}
                          className={`flex-1 min-w-[120px] py-4 font-black uppercase text-sm transition-all border-r-2 border-gray-100
                            ${activeTab === 'memories' ? "bg-gray-900 text-white" : "text-gray-400 hover:bg-gray-50"}`}
                        >
                          MEMORIES
                        </button>
                    )}
                </>
              )}
            </div>

            {/* Content Area */}
            <div className="pb-20">
              {activeTab === "posts" && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {posts.map((post) => (
                    <div
                      key={post.id}
                      onClick={() => setSelectedPost(post)}
                      className="bg-white border-4 border-gray-900 p-4 shadow-[6px_6px_0px_0px_#000] cursor-pointer hover:-translate-y-1 transition-all flex flex-col h-full"
                    >
                      {post.image_url && (
                          <div className="w-full h-40 bg-gray-100 border-2 border-gray-900 mb-3 overflow-hidden relative shrink-0 group">
                                <div className="absolute inset-0 pattern-dots opacity-10"></div>
                                <img src={post.image_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="Post Thumbnail" />
                          </div>
                      )}
                      <div className="flex-grow flex flex-col">
                          <div className="text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-widest">
                            {new Date(post.created_at).toLocaleDateString()}
                          </div>
                          <p className="font-bold text-sm line-clamp-3 text-gray-900 leading-relaxed">
                            {post.content}
                          </p>
                      </div>
                    </div>
                  ))}
                  {posts.length === 0 && (
                    <div className="col-span-full border-4 border-dashed border-gray-200 py-10 text-center text-gray-400 font-bold uppercase">
                      No Posts
                    </div>
                  )}
                </div>
              )}

              {activeTab === "bookmarks" && (
                <BookmarksList userId={currentUser.id} />
              )}

              {activeTab === "memories" && <MemoriesList userId={userId} />}

              {activeTab === "jobs" && <JobsList userId={userId} />}
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
      <Modal
        isOpen={isPostFormOpen}
        onClose={() => setIsPostFormOpen(false)}
        title="Share Experience"
      >
        <PostForm onClose={() => setIsPostFormOpen(false)} />
      </Modal>
    </div>
  );
}

function MemoriesList({ userId }: { userId: string }) {
  const [memories, setMemories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMemories = async () => {
      try {
        const data = await supabaseService.fetchCompletedApplications(userId);
        setMemories(data || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchMemories();
  }, [userId]);

  if (loading)
    return (
      <div className="py-20 text-center font-bold text-gray-400 uppercase tracking-widest">
        Loading memories...
      </div>
    );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
      {memories.map((app, index) => (
        <div
          key={app.id}
          className={`bg-white border-4 border-gray-900 p-4 shadow-[8px_8px_0px_0px_#000] transition-all hover:rotate-0
                    ${index % 2 === 0 ? "-rotate-2" : "rotate-2"}`}
        >
          <div className="w-full aspect-square bg-gray-100 border-2 border-gray-900 mb-4 overflow-hidden relative group">
             {/* Thumbnail: Job Image -> Job Placeholder -> Avatar (fallback) */}
            {app.jobs?.thumbnail_url ? (
                 <img
                    src={app.jobs.thumbnail_url}
                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                    alt="Job Memory"
                 />
            ) : (
                <div className="w-full h-full flex items-center justify-center bg-yellow-50 text-yellow-500 font-black text-4xl uppercase tracking-tighter opacity-50 relative overflow-hidden">
                    <div className="absolute inset-0 pattern-dots opacity-20"></div>
                    JOB
                </div>
            )}
            
            <div className="absolute bottom-2 right-2 bg-yellow-400 border-2 border-gray-900 p-1 shadow-[2px_2px_0px_#000]">
              <Briefcase size={14} strokeWidth={3} className="text-gray-900" />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-[10px] font-black text-gray-500 uppercase tracking-widest bg-gray-50 p-1">
              <Calendar size={12} />
              {new Date(app.updated_at).toLocaleDateString()}
            </div>
            <h3 className="font-black text-sm leading-tight uppercase min-h-[3em] text-gray-900 line-clamp-2">
              {app.jobs?.title || 'Unknown Job'}
            </h3>
            <div className="pt-2 border-t-2 border-gray-100 flex items-center justify-between">
              <span className="text-[10px] font-bold text-gray-400 uppercase">
                COMPLETE
              </span>
              <div className="w-2 h-2 bg-green-500 rounded-full border border-gray-900"></div>
            </div>
          </div>
        </div>
      ))}

      {memories.length === 0 && (
        <div className="col-span-full border-4 border-dashed border-gray-200 py-20 text-center">
          <p className="text-gray-400 font-black italic uppercase tracking-widest">
            No Completed Jobs Yet
          </p>
        </div>
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

  if (loading)
    return (
      <div className="p-8 text-center text-gray-400 font-bold tracking-widest uppercase">
        Loading bookmarks...
      </div>
    );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {bookmarks.map((post) => (
        <div
          key={post.id}
          onClick={() => setSelectedPost(post)}
          className="bg-white border-4 border-gray-900 p-6 shadow-[6px_6px_0px_0px_#000] hover:-translate-y-1 transition-all cursor-pointer relative"
        >
          <div className="absolute top-4 right-4 text-yellow-500">
            <Bookmark size={20} fill="currentColor" />
          </div>
          <div className="text-[10px] font-bold text-gray-400 mb-3 uppercase tracking-widest">
            {new Date(post.created_at).toLocaleDateString()}
          </div>
          <p className="text-gray-900 font-bold text-sm line-clamp-3">
            {post.content}
          </p>
        </div>
      ))}
      {bookmarks.length === 0 && (
        <div className="col-span-full border-4 border-dashed border-gray-200 py-10 text-center text-gray-400 font-bold uppercase">
          No Bookmarks
        </div>
      )}
    </div>
  );
}

function JobsList({ userId }: { userId: string }) {
    const [jobs, setJobs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedJob, setSelectedJob] = useState<any>(null);
    const [isJobModalOpen, setIsJobModalOpen] = useState(false);
    const { user } = useAuth(); // Add useAuth to check current user

    useEffect(() => {
        const fetch = async () => {
            const data = await supabaseService.fetchCompanyJobs(userId);
            setJobs(data || []);
            setLoading(false);
        };
        fetch();
    }, [userId]);

    const isOwnProfile = user?.id === userId; // Check if it's correct user

    const handleDelete = async (e: React.MouseEvent, jobId: string) => {
        e.stopPropagation();
        if (!confirm('Are you sure you want to delete this job?')) return;
        try {
            await supabaseService.deleteJob(jobId);
            setJobs(prev => prev.filter(j => j.id !== jobId));
        } catch (error) {
            alert('Failed to delete job');
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {jobs.map(job => (
                <div 
                    key={job.id} 
                    className="bg-white border-4 border-gray-900 p-6 shadow-[6px_6px_0px_0px_#000] relative group hover:-translate-y-1 transition-all"
                >
                    <div className="absolute top-4 right-4 flex gap-2">
                        <span className={`text-[10px] font-black px-2 py-1 uppercase border-2 border-gray-900 ${job.status === 'open' ? 'bg-green-400 text-gray-900' : 'bg-gray-200 text-gray-500'}`}>
                            {job.status}
                        </span>
                        {isOwnProfile && ( // Only show delete button for owner
                            <button 
                                onClick={(e) => handleDelete(e, job.id)}
                                className="bg-white text-red-500 border-2 border-gray-900 p-1 hover:bg-red-500 hover:text-white transition-colors"
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                            </button>
                        )}
                    </div>
                    <h3 className="font-black text-lg mb-2 uppercase">{job.title}</h3>
                    <p className="text-sm font-bold text-gray-500 mb-4 line-clamp-2">{job.description}</p>
                    <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-400">
                        <Briefcase size={14} />
                        <span>{job.reward}</span>
                    </div>
                </div>
            ))}
        </div>
    );
}
