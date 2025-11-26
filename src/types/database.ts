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
                    current_location_x: number | null
                    current_location_y: number | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id: string
                    username?: string | null
                    user_type?: 'individual' | 'company'
                    avatar_type?: string | null
                    current_location_x?: number | null
                    current_location_y?: number | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    username?: string | null
                    user_type?: 'individual' | 'company'
                    avatar_type?: string | null
                    current_location_x?: number | null
                    current_location_y?: number | null
                    created_at?: string
                    updated_at?: string
                }
                Relationships: []
            }
            plaza_posts: {
                Row: {
                    id: string
                    user_id: string
                    content: string
                    created_at: string
                    image_url: string | null
                    job_id: string | null
                }
                Insert: {
                    id?: string
                    user_id: string
                    content: string
                    created_at?: string
                    image_url?: string | null
                    job_id?: string | null
                }
                Update: {
                    id?: string
                    user_id?: string
                    content?: string
                    created_at?: string
                    image_url?: string | null
                    job_id?: string | null
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
            jobs: {
                Row: {
                    id: string
                    title: string
                    status: string | null
                    created_at: string
                    description: string | null
                    company_id: string | null
                    location: string | null
                    reward: string | null
                    thumbnail_url: string | null
                    updated_at: string
                }
                Insert: {
                    id?: string
                    title: string
                    status?: string | null
                    created_at?: string
                    description?: string | null
                    company_id?: string | null
                    location?: string | null
                    reward?: string | null
                    thumbnail_url?: string | null
                    updated_at?: string
                }
                Update: {
                    id?: string
                    title?: string
                    status?: string | null
                    created_at?: string
                    description?: string | null
                    company_id?: string | null
                    location?: string | null
                    reward?: string | null
                    thumbnail_url?: string | null
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "jobs_company_id_fkey"
                        columns: ["company_id"]
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    }
                ]
            }
            job_experiences: {
                Row: {
                    id: string
                    user_id: string
                    job_id: string
                    completed_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    job_id: string
                    completed_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    job_id?: string
                    completed_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "job_experiences_job_id_fkey"
                        columns: ["job_id"]
                        referencedRelation: "jobs"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "job_experiences_user_id_fkey"
                        columns: ["user_id"]
                        referencedRelation: "profiles"
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
            messages: {
                Row: {
                    id: string
                    conversation_id: string
                    sender_id: string
                    content: string
                    message_type: 'text' | 'booking_request' | 'system'
                    created_at: string
                }
                Insert: {
                    id?: string
                    conversation_id: string
                    sender_id: string
                    content: string
                    message_type?: 'text' | 'booking_request' | 'system'
                    created_at?: string
                }
                Update: {
                    id?: string
                    conversation_id?: string
                    sender_id?: string
                    content?: string
                    message_type?: 'text' | 'booking_request' | 'system'
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
            bookings: {
                Row: {
                    id: string
                    post_id: string | null
                    requester_id: string
                    provider_id: string
                    status: 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled'
                    scheduled_at: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    post_id?: string | null
                    requester_id: string
                    provider_id: string
                    status?: 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled'
                    scheduled_at?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    post_id?: string | null
                    requester_id?: string
                    provider_id?: string
                    status?: 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled'
                    scheduled_at?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "bookings_post_id_fkey"
                        columns: ["post_id"]
                        referencedRelation: "plaza_posts"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "bookings_requester_id_fkey"
                        columns: ["requester_id"]
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "bookings_provider_id_fkey"
                        columns: ["provider_id"]
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
        }
        Enums: {
            user_type_enum: 'individual' | 'company'
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}
