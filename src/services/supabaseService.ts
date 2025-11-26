import { supabase } from '@/lib/supabase/client';
import { Database } from '@/types/database';

export type Post = Database['public']['Tables']['plaza_posts']['Row'] & {
    profiles: {
        username: string | null;
        avatar_type: string | null;
    } | null;
};

export type JobExperience = Database['public']['Tables']['job_experiences']['Row'] & {
    jobs: {
        title: string;
        status: string | null;
    } | null;
};

export const supabaseService = {
    // Fetch posts with profile information
    async fetchPosts(): Promise<Post[]> {
        const { data, error } = await supabase
            .from('plaza_posts')
            .select(`
                *,
                profiles (
                    username,
                    avatar_type
                )
            `)
            .order('created_at', { ascending: false })
            .limit(20);

        if (error) {
            console.error('Error fetching posts:', error);
            return [];
        }

        return data as Post[];
    },

    // Create a new post
    async createPost(content: string, userId: string, imageUrl?: string): Promise<Post | null> {
        const { data, error } = await supabase
            .from('plaza_posts')
            .insert({
                user_id: userId,
                content: content,
                image_url: imageUrl
            })
            .select(`
                *,
                profiles (
                    username,
                    avatar_type
                )
            `)
            .single();

        if (error) {
            console.error('Error creating post:', error);
            return null;
        }

        return data as Post;
    },

    // Upload image to storage
    async uploadImage(file: File): Promise<string | null> {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('post_images')
            .upload(filePath, file);

        if (uploadError) {
            console.error('Error uploading image:', uploadError);
            return null;
        }

        const { data } = supabase.storage
            .from('post_images')
            .getPublicUrl(filePath);

        return data.publicUrl;
    },

    // Fetch job experiences for a user (or all for the village scene if needed)
    // For VillageScene, we might want to show "my" experiences or "all" experiences.
    // Let's assume for now we want to show the current user's experiences or just recent ones.
    // Based on the requirement "VillageScene to display experience data", let's fetch all for now to populate the village.
    async fetchJobExperiences(): Promise<JobExperience[]> {
        const { data, error } = await supabase
            .from('job_experiences')
            .select(`
                *,
                jobs (
                    title,
                    status
                )
            `)
            .order('completed_at', { ascending: false })
            .limit(20);

        if (error) {
            console.error('Error fetching job experiences:', error);
            return [];
        }

        return data as JobExperience[];
    },
    // Fetch user profile
    async fetchProfile(userId: string) {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (error) {
            console.error('Error fetching profile:', error);
            return null;
        }

        return data;
    },

    // --- Messages & Bookings ---

    // Fetch conversations for the current user
    async fetchConversations(userId: string) {
        // This is a bit complex because we need to join conversation_participants
        // to find conversations where the user is a participant,
        // and then fetch the other participant's profile.

        // 1. Get conversation IDs for the user
        const { data: myConvos, error: myConvosError } = await supabase
            .from('conversation_participants')
            .select('conversation_id')
            .eq('user_id', userId);

        if (myConvosError || !myConvos) return [];

        const conversationIds = myConvos.map(c => c.conversation_id);

        if (conversationIds.length === 0) return [];

        // 2. Fetch conversations with participants and latest message
        // Note: Supabase JS client doesn't support complex deep joins easily for this specific "other participant" logic 
        // without some manual filtering or a view. 
        // For now, we'll fetch participants for these conversations.

        const { data: participants, error: participantsError } = await supabase
            .from('conversation_participants')
            .select(`
                conversation_id,
                profiles (
                    id,
                    username,
                    avatar_type
                )
            `)
            .in('conversation_id', conversationIds)
            .neq('user_id', userId); // Get the OTHER person

        if (participantsError) return [];

        // 3. Fetch latest messages for these conversations
        // We can do this by fetching messages ordered by created_at desc
        // Ideally we'd use a view or a lateral join, but let's do a simple query for now.
        // Or we can just return the participants and let the UI fetch the last message or just show the user.

        return participants.map(p => ({
            conversation_id: p.conversation_id,
            other_user: p.profiles
        }));
    },

    async fetchMessages(conversationId: string) {
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', conversationId)
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Error fetching messages:', JSON.stringify(error, null, 2));
            return [];
        }
        return data;
    },

    async sendMessage(conversationId: string, senderId: string, content: string, type: 'text' | 'booking_request' = 'text') {
        const { data, error } = await supabase
            .from('messages')
            .insert({
                conversation_id: conversationId,
                sender_id: senderId,
                content: content,
                message_type: type
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async getUnreadCount() {
        const { data, error } = await supabase.rpc('get_unread_count' as any);
        if (error) {
            console.error('Error fetching unread count:', error);
            return 0;
        }
        return data as number;
    },

    async markAsRead(conversationId: string) {
        const { error } = await supabase.rpc('mark_conversation_as_read' as any, {
            p_conversation_id: conversationId
        });
        if (error) console.error('Error marking as read:', error);
    },

    async createConversation(userId: string, otherUserId: string) {
        // Use the RPC function to create or get existing conversation
        // This handles RLS issues (inserting other user) and duplicate checks
        const { data: convoId, error } = await supabase
            .rpc('create_new_conversation', { other_user_id: otherUserId });

        if (error) throw error;

        return { id: convoId };
    }
};
