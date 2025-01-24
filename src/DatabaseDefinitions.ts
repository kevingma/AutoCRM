export interface Database {
  public: {
    Tables: {
      contact_requests: {
        Row: {
          company_name: string | null
          email: string | null
          first_name: string | null
          id: string
          last_name: string | null
          message_body: string | null
          phone: string | null
          updated_at: Date | null
        }
        Insert: {
          company_name?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          message_body?: string | null
          phone?: string | null
          updated_at?: Date | null
        }
        Update: {
          company_name?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          message_body?: string | null
          phone?: string | null
          updated_at?: Date | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          full_name: string | null
          id: string
          updated_at: string | null
          company_name: string | null
          website: string | null
          unsubscribed: boolean
          role: string
          employee_approved: boolean
          customer_approved: boolean
        }
        Insert: {
          avatar_url?: string | null
          full_name?: string | null
          id: string
          updated_at?: Date | null
          company_name?: string | null
          website?: string | null
          unsubscribed?: boolean
          role?: string
          employee_approved?: boolean
          customer_approved?: boolean
        }
        Update: {
          avatar_url?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
          company_name?: string | null
          website?: string | null
          unsubscribed?: boolean
          role?: string
          employee_approved?: boolean
          customer_approved?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      stripe_customers: {
        Row: {
          user_id: string
          updated_at: string | null
          stripe_customer_id: string | null
        }
        Insert: {
          user_id: string
          updated_at?: string | null
          stripe_customer_id?: string | null
        }
        Update: {
          user_id?: string
          updated_at?: string | null
          stripe_customer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stripe_customers_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string
          status: string
          created_at: string | null
          priority: string | null
          custom_fields: Record<string, unknown> | null
          tags: string[] | null
          assigned_to: string | null
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description: string
          status?: string
          created_at?: string | null
          priority?: string | null
          custom_fields?: Record<string, unknown> | null
          tags?: string[] | null
          assigned_to?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string
          status?: string
          created_at?: string | null
          priority?: string | null
          custom_fields?: Record<string, unknown> | null
          tags?: string[] | null
          assigned_to?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tickets_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_replies: {
        Row: {
          id: string
          ticket_id: string
          user_id: string
          reply_text: string
          created_at: string | null
          is_internal: boolean
        }
        Insert: {
          id?: string
          ticket_id: string
          user_id: string
          reply_text: string
          created_at?: string | null
          is_internal?: boolean
        }
        Update: {
          id?: string
          ticket_id?: string
          user_id?: string
          reply_text?: string
          created_at?: string | null
          is_internal?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "ticket_replies_ticket_id_fkey"
            columns: ["ticket_id"]
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_replies_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }

      ticket_feedback: {
        Row: {
          id: string
          ticket_id: string
          user_id: string
          rating: number
          comment: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          ticket_id: string
          user_id: string
          rating: number
          comment?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          ticket_id?: string
          user_id?: string
          rating?: number
          comment?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ticket_feedback_ticket_id_fkey"
            columns: ["ticket_id"]
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_feedback_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      live_chats: {
        Row: {
          id: string
          user_id: string
          agent_id: string | null
          created_at: string | null
          closed_at: string | null
          is_connected_to_agent: boolean
        }
        Insert: {
          id?: string
          user_id: string
          agent_id?: string | null
          created_at?: string | null
          closed_at?: string | null
          is_connected_to_agent?: boolean
        }
        Update: {
          id?: string
          user_id?: string
          agent_id?: string | null
          created_at?: string | null
          closed_at?: string | null
          is_connected_to_agent?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "live_chats_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "live_chats_agent_id_fkey"
            columns: ["agent_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      live_chat_messages: {
        Row: {
          id: string
          live_chat_id: string
          user_id: string
          role: string
          message_text: string
          created_at: string | null
        }
        Insert: {
          id?: string
          live_chat_id: string
          user_id: string
          role: string
          message_text: string
          created_at?: string | null
        }
        Update: {
          id?: string
          live_chat_id?: string
          user_id?: string
          role?: string
          message_text?: string
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "live_chat_messages_live_chat_id_fkey"
            columns: ["live_chat_id"]
            referencedRelation: "live_chats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "live_chat_messages_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          id: string
          name: string
          focus_area: string | null
          coverage_start_time_utc: number | null
          coverage_end_time_utc: number | null
          created_at: string | null
        }
        Insert: {
          id?: string
          name: string
          focus_area?: string | null
          coverage_start_time_utc?: number | null
          coverage_end_time_utc?: number | null
          created_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          focus_area?: string | null
          coverage_start_time_utc?: number | null
          coverage_end_time_utc?: number | null
          created_at?: string | null
        }
        Relationships: []
      }

      team_members: {
        Row: {
          id: string
          team_id: string
          user_id: string
          role: string | null
        }
        Insert: {
          id?: string
          team_id: string
          user_id: string
          role?: string | null
        }
        Update: {
          id?: string
          team_id?: string
          user_id?: string
          role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }

      skills: {
        Row: {
          id: string
          skill_name: string
          created_at: string | null
        }
        Insert: {
          id?: string
          skill_name: string
          created_at?: string | null
        }
        Update: {
          id?: string
          skill_name?: string
          created_at?: string | null
        }
        Relationships: []
      }

      employee_skills: {
        Row: {
          id: string
          user_id: string
          skill_id: string
        }
        Insert: {
          id?: string
          user_id: string
          skill_id: string
        }
        Update: {
          id?: string
          user_id?: string
          skill_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_skills_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_skills_skill_id_fkey"
            columns: ["skill_id"]
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      response_templates: {
        Row: {
          id: string
          user_id: string
          created_at: string | null
          title: string
          content: string
          is_shared: boolean
        }
        Insert: {
          id?: string
          user_id: string
          created_at?: string | null
          title: string
          content: string
          is_shared?: boolean
        }
        Update: {
          id?: string
          user_id?: string
          created_at?: string | null
          title?: string
          content?: string
          is_shared?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "response_templates_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: { [_ in never]: never }
    Functions: { [_ in never]: never }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}
