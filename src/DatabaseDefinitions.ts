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
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
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
          }
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
        }
        Relationships: [
          {
            foreignKeyName: "tickets_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
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
          }
        ]
      }
    }
    Views: { [_ in never]: never }
    Functions: { [_ in never]: never }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}