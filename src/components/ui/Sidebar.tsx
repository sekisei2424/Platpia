import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, PlusSquare, User, MapPin, LogIn, LogOut, MessageCircle } from 'lucide-react';
import AuthModal from '@/components/auth/AuthModal';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabaseService } from '@/services/supabaseService';
import { supabase } from '@/lib/supabase/client';

interface SidebarProps {
    onPostClick: () => void;
}

export default function Sidebar({ onPostClick }: SidebarProps) {
    const pathname = usePathname();
    const { user, signOut } = useAuth();
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [canPost, setCanPost] = useState(false);

    const isPlaza = pathname === '/' || pathname === '/plaza';
    const isSearch = pathname === '/search';
    const isProfile = pathname.startsWith('/profile');
    const isMessages = pathname.startsWith('/messages');

    useEffect(() => {
        if (user) {
            fetchUnreadCount();
            checkPostEligibility();
            const unsubscribe = subscribeToUnread();
            return () => {
                unsubscribe();
            };
        } else {
            setUnreadCount(0);
            setCanPost(false);
        }
    }, [user, pathname]); // Re-fetch when pathname changes (e.g. leaving a chat)

    const fetchUnreadCount = async () => {
        const count = await supabaseService.getUnreadCount();
        setUnreadCount(count as number);
    };

    const checkPostEligibility = async () => {
        if (!user) return;
        const eligible = await supabaseService.canUserPost(user.id);
        setCanPost(eligible);
    };

    const subscribeToUnread = () => {
        // Listen for new messages to increment count
        // Ideally we should filter by "not sent by me" but RLS might handle visibility
        // For simplicity, we'll just re-fetch count on any message insert that we can see
        const channel = supabase
            .channel('global_messages')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages'
                },
                () => {
                    // Re-fetch count to be accurate
                    fetchUnreadCount();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    };

    const iconClass = (isActive: boolean, disabled: boolean = false) =>
        `p-3 rounded-xl transition-all duration-200 ${
            disabled 
            ? 'text-gray-600 cursor-not-allowed opacity-50' 
            : isActive 
                ? 'text-village-accent scale-110 hover:bg-white/10' 
                : 'text-white hover:text-village-accent hover:scale-105 hover:bg-white/10'
        }`;

    const handleNavigation = (path: string) => {
        if (pathname !== path) {
            window.location.href = path;
        }
    };

    return (
        <nav className="md:h-full md:w-20 h-16 w-full bg-[#2C2A25] md:border-r border-t border-gray-700 flex md:flex-col flex-row items-center md:justify-evenly justify-around md:py-8 z-50 shadow-xl fixed bottom-0 md:relative safe-area-pb">
            <button onClick={() => handleNavigation('/')} title="Plaza" className={iconClass(isPlaza)}>
                <Home size={32} />
            </button>

            <button onClick={() => handleNavigation('/search')} title="Search" className={iconClass(isSearch)}>
                <Search size={32} />
            </button>
            
            <button
                onClick={() => canPost && onPostClick()}
                className={iconClass(false, !canPost)}
                title={canPost ? "Post" : "Complete a job to post"}
                disabled={!canPost}
            >
                <PlusSquare size={32} />
            </button>

            <button onClick={() => handleNavigation('/messages')} title="Messages" className="relative p-3 rounded-xl transition-all duration-200 hover:bg-white/10 text-white hover:text-village-accent hover:scale-105">
                <MessageCircle size={32} className={isMessages ? 'text-village-accent' : ''} />
                {unreadCount > 0 && (
                    <span className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full border-2 border-village-base"></span>
                )}
            </button>

            <button onClick={() => handleNavigation('/profile')} title="Profile" className={iconClass(isProfile)}>
                <User size={32} />
            </button>

            {user ? (
                <button onClick={() => signOut()} title="Sign Out" className="p-3 rounded-xl transition-all duration-200 hover:bg-red-500/20 text-gray-400 hover:text-red-400">
                    <LogOut size={24} />
                </button>
            ) : (
                <button onClick={() => setIsAuthModalOpen(true)} title="Sign In" className="p-3 rounded-xl transition-all duration-200 hover:bg-blue-500/20 text-gray-400 hover:text-blue-400">
                    <LogIn size={24} />
                </button>
            )}

            <AuthModal
                isOpen={isAuthModalOpen}
                onClose={() => setIsAuthModalOpen(false)}
            />
        </nav>
    );
}
