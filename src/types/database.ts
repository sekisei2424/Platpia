export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type Database = {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string
                    username: string | null
                    user_type: 'individual' | 'company'
                    avatar_type: string | null
                    bio: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id: string
                    username?: string | null
                    user_type?: 'individual' | 'company'
                    avatar_type?: string | null
                    bio?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    username?: string | null
                    user_type?: 'individual' | 'company'
                    avatar_type?: string | null
                    bio?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Relationships: []
            }
            jobs: {
                Row: {
                    id: string
                    user_id: string
                    title: string
                    description: string
                    salary_range: string | null
                    location: string | null
                    type: string
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id?: string
                    title: string
                    description: string
                    salary_range?: string | null
                    location?: string | null
                    type: string
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    title?: string
                    description?: string
                    salary_range?: string | null
                    location?: string | null
                    type?: string
                    created_at?: string
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "jobs_user_id_fkey"
                        columns: ["user_id"]
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    }
                ]
            }
            job_applications: {
                Row: {
                    id: string
                    job_id: string
                    applicant_id: string
                    status: 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled'
                    applied_at: string
                    completed_at: string | null
                    updated_at: string
                }
                Insert: {
                    id?: string
                    job_id: string
                    applicant_id: string
                    status?: 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled'
                    applied_at?: string
                    completed_at?: string | null
                    updated_at?: string
                }
                Update: {
                    id?: string
                    job_id?: string
                    applicant_id?: string
                    status?: 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled'
                    applied_at?: string
                    completed_at?: string | null
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "job_applications_job_id_fkey"
                        columns: ["job_id"]
                        referencedRelation: "jobs"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "job_applications_applicant_id_fkey"
                        columns: ["applicant_id"]
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    }
                ]
            }
            plaza_posts: {
                Row: {
                    id: string
                    user_id: string
                    job_id: string | null
                    content: string
                    image_url: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    job_id?: string | null
                    content: string
                    image_url?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    job_id?: string | null
                    content?: string
                    image_url?: string | null
                    created_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "plaza_posts_user_id_fkey"
                        columns: ["user_id"]
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "plaza_posts_job_id_fkey"
                        columns: ["job_id"]
                        referencedRelation: "jobs"
                        referencedColumns: ["id"]
                    }
                ]
            }
            job_bookmarks: {
                Row: {
                    id: string
                    user_id: string
                    job_id: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    job_id: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    job_id?: string
                    created_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "job_bookmarks_user_id_fkey"
                        columns: ["user_id"]
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "job_bookmarks_job_id_fkey"
                        columns: ["job_id"]
                        referencedRelation: "jobs"
                        referencedColumns: ["id"]
                    }
                ]
            }
            conversations: {
                Row: {
                    id: string
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    created_at?: string
                    updated_at?: string
                }
                Relationships: []
            }
            conversation_participants: {
                Row: {
                    conversation_id: string
                    user_id: string
                    last_read_at: string
                    created_at: string
                }
                Insert: {
                    conversation_id: string
                    user_id: string
                    last_read_at?: string
                    created_at?: string
                }
                Update: {
                    conversation_id?: string
                    user_id?: string
                    last_read_at?: string
                    created_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "conversation_participants_conversation_id_fkey"
                        columns: ["conversation_id"]
                        referencedRelation: "conversations"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "conversation_participants_user_id_fkey"
                        columns: ["user_id"]
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    }
                ]
            }
            likes: {
                Row: {
                    id: number
                    user_id: string
                    post_id: string
                    created_at: string
                }
                Insert: {
                    id?: number
                    user_id: string
                    post_id: string
                    created_at?: string
                }
                Update: {
                    id?: number
                    user_id?: string
                    post_id?: string
                    created_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "likes_user_id_fkey"
                        columns: ["user_id"]
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "likes_post_id_fkey"
                        columns: ["post_id"]
                        referencedRelation: "plaza_posts"
                        referencedColumns: ["id"]
                    }
                ]
            }
            bookmarks: {
                Row: {
                    id: number
                    user_id: string
                    post_id: string
                    created_at: string
                }
                Insert: {
                    id?: number
                    user_id: string
                    post_id: string
                    created_at?: string
                }
                Update: {
                    id?: number
                    user_id?: string
                    post_id?: string
                    created_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "bookmarks_user_id_fkey"
                        columns: ["user_id"]
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "bookmarks_post_id_fkey"
                        columns: ["post_id"]
                        referencedRelation: "plaza_posts"
                        referencedColumns: ["id"]
                    }
                ]
            }
            messages: {
                Row: {
                    id: string
                    conversation_id: string
                    sender_id: string
                    content: string
                    message_type: 'text' | 'booking_request' | 'system' | 'image'
                    created_at: string
                }
                Insert: {
                    id?: string
                    conversation_id: string
                    sender_id: string
                    content: string
                    message_type?: 'text' | 'booking_request' | 'system' | 'image'
                    created_at?: string
                }
                Update: {
                    id?: string
                    conversation_id?: string
                    sender_id?: string
                    content?: string
                    message_type?: 'text' | 'booking_request' | 'system' | 'image'
                    created_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "messages_conversation_id_fkey"
                        columns: ["conversation_id"]
                        referencedRelation: "conversations"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "messages_sender_id_fkey"
                        columns: ["sender_id"]
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    }
                ]
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            create_new_conversation: {
                Args: {
                    other_user_id: string
                }
                Returns: string
            }
            get_unread_count: {
                Args: Record<string, never>
                Returns: number
            }
        }
        Enums: {
            user_type_enum: 'individual' | 'company'
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}
