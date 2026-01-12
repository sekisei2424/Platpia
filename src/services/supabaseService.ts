import { supabase } from "@/lib/supabase/client";
import { Database } from "@/types/database";

export type Post = Database["public"]["Tables"]["plaza_posts"]["Row"] & {
  profiles: {
    username: string | null;
    avatar_type: string | null;
    user_type: "individual" | "company" | null;
  } | null;
  jobs: {
    title: string;
  } | null;
};

export type JobApplication =
  Database["public"]["Tables"]["job_applications"]["Row"] & {
    jobs: {
      title: string;
      status: "open" | "closed" | "draft";
    } | null;
  };

// --- Added Memory Type ---
export type Memory = {
  id: string;
  date: string; // completed_at from job_applications
  job_title: string; // title from jobs
  partner_id: string; // company_id from jobs
  partner_avatar_type: string; // avatar_type from profiles (partner)
  partner_username: string; // username from profiles (partner)
};

export const supabaseService = {
  // Fetch latest posts per user to avoid duplicate avatars in Plaza
  async fetchLatestPostsPerUser(): Promise<Post[]> {
    // Fetch posts normally (ordered by created_at desc)
    // Since we can't easily do DISTINCT ON in Supabase client without a raw query or RPC in some cases,
    // we'll fetch a slightly larger batch and filter in JS for this use case.
    // Assuming the active user base isn't massive yet.
    const { data, error } = await supabase
      .from("plaza_posts")
      .select(
        `
                *,
                profiles (
                    username,
                    avatar_type,
                    user_type
                ),
                jobs (
                    title
                )
            `
      )
      .order("created_at", { ascending: false })
      .limit(50); // Fetch more to increase chance of finding unique users

    if (error) {
      console.error("Error fetching latest posts:", error);
      return [];
    }

    // Filter to keep only the first (latest) post per user_id
    const uniquePostsMap = new Map<string, Post>();
    const posts = data as Post[];

    for (const post of posts) {
      if (!uniquePostsMap.has(post.user_id)) {
        uniquePostsMap.set(post.user_id, post);
      }
    }

    // Return values array, limited to maybe 20 to not overcrowd the plaza
    return Array.from(uniquePostsMap.values()).slice(0, 20);
  },

  // Fetch posts with profile information
  async fetchPosts(): Promise<Post[]> {
    const { data, error } = await supabase
      .from("plaza_posts")
      .select(
        `
                *,
                profiles (
                    username,
                    avatar_type,
                    user_type
                ),
                jobs (
                    title
                )
            `
      )
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      console.error("Error fetching posts:", error);
      return [];
    }

    return data as Post[];
  },

  // Create a new post
  async createPost(
    content: string,
    userId: string,
    imageUrl?: string,
    jobId?: string
  ): Promise<Post | null> {
    const { data, error } = await supabase
      .from("plaza_posts")
      .insert({
        user_id: userId,
        content: content,
        image_url: imageUrl,
        job_id: jobId,
      })
      .select(
        `
                *,
                profiles (
                    username,
                    avatar_type
                ),
                jobs (
                    title
                )
            `
      )
      .single();

    if (error) {
      console.error("Error creating post:", error);
      return null;
    }

    return data as Post;
  },

  // Upload image to storage
  async uploadImage(file: File): Promise<string | null> {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("post_images")
      .upload(filePath, file);

    if (uploadError) {
      console.error("Error uploading image:", uploadError);
      return null;
    }

    const { data } = supabase.storage
      .from("post_images")
      .getPublicUrl(filePath);

    return data.publicUrl;
  },

  // Fetch completed job applications (experiences) for a user
  async fetchJobExperiences(): Promise<JobApplication[]> {
    const { data, error } = await supabase
      .from("job_applications")
      .select(
        `
                *,
                jobs (
                    title,
                    status
                )
            `
      )
      .eq("status", "completed")
      .order("completed_at", { ascending: false })
      .limit(20);

    if (error) {
      console.error("Error fetching job experiences:", error);
      return [];
    }

    return data as JobApplication[];
  },

  // Fetch unposted completed jobs for a user
  async fetchUnpostedCompletedJobs(userId: string): Promise<JobApplication[]> {
    // Get all completed applications
    const { data: completedApps, error } = await supabase
      .from("job_applications")
      .select(
        `
                *,
                jobs (
                    title,
                    status
                )
            `
      )
      .eq("applicant_id", userId)
      .eq("status", "completed")
      .order("completed_at", { ascending: false });

    if (error || !completedApps) return [];

    // Get all posts by this user that have a job_id
    const { data: posts } = await supabase
      .from("plaza_posts")
      .select("job_id")
      .eq("user_id", userId)
      .not("job_id", "is", null);

    const postedJobIds = posts ? posts.map((p) => p.job_id) : [];

    // Filter out already posted jobs
    return completedApps.filter(
      (app) => !postedJobIds.includes(app.job_id)
    ) as JobApplication[];
  },

  // Check if user has applied for a job
  async fetchUserApplication(jobId: string, userId: string) {
    const { data, error } = await supabase
      .from("job_applications")
      .select("*")
      .eq("job_id", jobId)
      .eq("applicant_id", userId)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 is "no rows returned"
      console.error("Error fetching application:", error);
      return null;
    }
    return data;
  },

  // Apply for a job
  async applyForJob(jobId: string, applicantId: string) {
    // Check for existing application
    const { data: existingApp } = await supabase
      .from("job_applications")
      .select("status")
      .eq("job_id", jobId)
      .eq("applicant_id", applicantId)
      .single();

    if (existingApp) {
      if (existingApp.status === "rejected") {
        // Re-apply: Update status to pending
        const { data, error } = await supabase
          .from("job_applications")
          .update({
            status: "pending",
            applied_at: new Date().toISOString(),
          })
          .eq("job_id", jobId)
          .eq("applicant_id", applicantId)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        throw new Error("Already applied");
      }
    }

    // New application
    const { data, error } = await supabase
      .from("job_applications")
      .insert({
        job_id: jobId,
        applicant_id: applicantId,
        status: "pending",
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Fetch active jobs for a company
  async fetchCompanyJobs(companyId: string) {
    const { data, error } = await supabase
      .from("jobs")
      .select("*")
      .eq("company_id", companyId)
      .eq("status", "open")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  },

  // Fetch a single job by ID
  async fetchJob(jobId: string) {
    const { data, error } = await supabase
      .from("jobs")
      .select("*")
      .eq("id", jobId)
      .single();

    if (error) throw error;
    return data;
  },

  // Create a new job
  async createJob(jobData: {
    company_id: string;
    title: string;
    description: string;
    location: string;
    reward: string;
    thumbnail_url?: string;
  }) {
    const { data, error } = await supabase
      .from("jobs")
      .insert({
        ...jobData,
        status: "open",
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Fetch applicants for a specific job
  async fetchJobApplicants(jobId: string) {
    const { data, error } = await supabase
      .from("job_applications")
      .select(
        `
                *,
                profiles:applicant_id (
                    id,
                    username,
                    avatar_type,
                    bio
                )
            `
      )
      .eq("job_id", jobId)
      .order("applied_at", { ascending: false });

    if (error) throw error;
    return data;
  },

  // Update application status
  async updateApplicationStatus(
    applicationId: string,
    status: "approved" | "rejected" | "completed" | "cancelled"
  ) {
    const updates: any = { status, updated_at: new Date().toISOString() };

    if (status === "completed") {
      updates.completed_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from("job_applications")
      .update(updates)
      .eq("id", applicationId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Fetch user profile
  async fetchProfile(userId: string) {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Error fetching profile:", error);
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
      .from("conversation_participants")
      .select("conversation_id")
      .eq("user_id", userId);

    if (myConvosError || !myConvos) return [];

    const conversationIds = myConvos.map((c) => c.conversation_id);

    if (conversationIds.length === 0) return [];

    // 2. Fetch conversations with participants and latest message
    // Note: Supabase JS client doesn't support complex deep joins easily for this specific "other participant" logic
    // without some manual filtering or a view.
    // For now, we'll fetch participants for these conversations.

    const { data: participants, error: participantsError } = await supabase
      .from("conversation_participants")
      .select(
        `
                conversation_id,
                profiles (
                    id,
                    username,
                    avatar_type
                )
            `
      )
      .in("conversation_id", conversationIds)
      .neq("user_id", userId); // Get the OTHER person

    if (participantsError) return [];

    // 3. Fetch latest messages for these conversations
    // We can do this by fetching messages ordered by created_at desc
    // Ideally we'd use a view or a lateral join, but let's do a simple query for now.

    // Fetch latest message for each conversation
    const { data: latestMessages } = await supabase
      .from("messages")
      .select("conversation_id, content, created_at, sender_id")
      .in("conversation_id", conversationIds)
      .order("created_at", { ascending: false });

    // Fetch unread status (last_read_at)
    const { data: myParticipation } = await supabase
      .from("conversation_participants")
      .select("conversation_id, last_read_at")
      .eq("user_id", userId)
      .in("conversation_id", conversationIds);

    return participants.map((p) => {
      const lastMsg = latestMessages?.find(
        (m) => m.conversation_id === p.conversation_id
      ); // Since ordered by desc, find returns the first (latest)
      // Note: .find() on a large array is O(N), but for MVP with few messages it's fine.
      // Ideally we'd use a map or a better query.

      const myPart = myParticipation?.find(
        (mp) => mp.conversation_id === p.conversation_id
      );
      const isUnread =
        lastMsg && myPart
          ? new Date(lastMsg.created_at) > new Date(myPart.last_read_at)
          : false;

      return {
        conversation_id: p.conversation_id,
        other_user: p.profiles,
        last_message: lastMsg,
        is_unread: isUnread,
      };
    });
  },

  async fetchMessages(conversationId: string) {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching messages:", JSON.stringify(error, null, 2));
      return [];
    }
    return data;
  },

  async sendMessage(
    conversationId: string,
    senderId: string,
    content: string,
    type: "text" | "booking_request" | "system" = "text"
  ) {
    const { data, error } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversationId,
        sender_id: senderId,
        content: content,
        message_type: type,
      })
      .select();

    if (error) throw error;
    return data?.[0];
  },

  async getUnreadCount() {
    const { data, error } = await supabase.rpc("get_unread_count" as any);
    if (error) {
      console.error("Error fetching unread count:", error);
      return 0;
    }
    return data as number;
  },

  async markAsRead(conversationId: string) {
    const { error } = await supabase.rpc("mark_conversation_as_read" as any, {
      p_conversation_id: conversationId,
    });
    if (error) console.error("Error marking as read:", error);
  },

  async createConversation(userId: string, otherUserId: string) {
    // Use the RPC function to create or get existing conversation
    // This handles RLS issues (inserting other user) and duplicate checks
    const { data: convoId, error } = await supabase.rpc(
      "create_new_conversation",
      { other_user_id: otherUserId }
    );

    if (error) throw error;

    return { id: convoId };
  },

  // Check if user can post (Company: always, Individual: only if has unposted completed job)
  async canUserPost(userId: string): Promise<boolean> {
    // 1. Get user profile to check type
    const { data: profile } = await supabase
      .from("profiles")
      .select("user_type")
      .eq("id", userId)
      .single();

    if (!profile) return false;
    if (profile.user_type === "company") return true;

    // 2. If individual, check for completed jobs that haven't been posted
    // Get all completed applications
    const { data: completedApps } = await supabase
      .from("job_applications")
      .select("job_id")
      .eq("applicant_id", userId)
      .eq("status", "completed");

    if (!completedApps || completedApps.length === 0) return false;

    const completedJobIds = completedApps.map((app) => app.job_id);

    // Get all posts by this user that have a job_id
    const { data: posts } = await supabase
      .from("plaza_posts")
      .select("job_id")
      .eq("user_id", userId)
      .not("job_id", "is", null);

    const postedJobIds = posts ? posts.map((p) => p.job_id) : [];

    // Check if there is any completed job that is NOT in posted jobs
    const hasUnpostedJob = completedJobIds.some(
      (id) => !postedJobIds.includes(id)
    );

    return hasUnpostedJob;
  },

  // Update profile
  async updateProfile(
    userId: string,
    updates: { username?: string; bio?: string; avatar_type?: string }
  ) {
    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Likes and Bookmarks
  async getLikeStatus(userId: string, postId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from("likes")
      .select("id")
      .eq("user_id", userId)
      .eq("post_id", postId)
      .single();

    if (error && error.code !== "PGRST116") return false; // PGRST116 is no rows
    return !!data;
  },

  async toggleLike(
    userId: string,
    postId: string
  ): Promise<{ liked: boolean; count: number }> {
    // Check if liked
    const liked = await this.getLikeStatus(userId, postId);

    if (liked) {
      // Unlike
      await supabase
        .from("likes")
        .delete()
        .eq("user_id", userId)
        .eq("post_id", postId);
    } else {
      // Like
      await supabase.from("likes").insert({ user_id: userId, post_id: postId });
    }

    // Get updated count
    const { count } = await supabase
      .from("likes")
      .select("id", { count: "exact", head: true })
      .eq("post_id", postId);

    return { liked: !liked, count: count || 0 };
  },

  async getBookmarkStatus(userId: string, postId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from("bookmarks")
      .select("id")
      .eq("user_id", userId)
      .eq("post_id", postId)
      .single();

    if (error && error.code !== "PGRST116") return false;
    return !!data;
  },

  async toggleBookmark(userId: string, postId: string): Promise<boolean> {
    const bookmarked = await this.getBookmarkStatus(userId, postId);

    if (bookmarked) {
      await supabase
        .from("bookmarks")
        .delete()
        .eq("user_id", userId)
        .eq("post_id", postId);
    } else {
      await supabase
        .from("bookmarks")
        .insert({ user_id: userId, post_id: postId });
    }

    return !bookmarked;
  },

  async fetchUserPosts(userId: string): Promise<Post[]> {
    const { data, error } = await supabase
      .from("plaza_posts")
      .select(
        `
                *,
                profiles (
                    username,
                    avatar_type,
                    user_type
                ),
                jobs (
                    title
                )
            `
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching user posts:", error);
      return [];
    }

    return data as Post[];
  },

  async fetchBookmarkedPosts(userId: string): Promise<Post[]> {
    const { data, error } = await supabase
      .from("bookmarks")
      .select(
        `
                post_id,
                plaza_posts:post_id (
                    *,
                    profiles (
                        username,
                        avatar_type,
                        user_type
                    ),
                    jobs (
                        title
                    )
                )
            `
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching bookmarked posts:", error);
      return [];
    }

    // Extract posts from the join result
    return data.map((item: any) => item.plaza_posts) as Post[];
  },

  // --- Added Memories Logic ---
  async fetchUserMemories(userId: string): Promise<Memory[]> {
    const { data, error } = await supabase
      .from("job_applications")
      .select(
        `
                id,
                completed_at,
                jobs (
                    id,
                    title,
                    company_id,
                    profiles:company_id (
                        id,
                        username,
                        avatar_type
                    )
                )
            `
      )
      .eq("applicant_id", userId)
      .eq("status", "completed")
      .not("completed_at", "is", null)
      .order("completed_at", { ascending: false });

    if (error) {
      console.error("Error fetching memories:", error);
      return [];
    }

    return (data as any[]).map((item) => ({
      id: item.id,
      date: item.completed_at,
      job_title: item.jobs?.title || "名称不明の案件",
      partner_id: item.jobs?.profiles?.id || "",
      partner_username: item.jobs?.profiles?.username || "不明なユーザー",
      partner_avatar_type: item.jobs?.profiles?.avatar_type || "default",
    }));
  },
};
