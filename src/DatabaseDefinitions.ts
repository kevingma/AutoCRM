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
        Insert: { /* unchanged */ }
        Update: { /* unchanged */ }
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
          employee_approved: boolean  // <-- ADDED
        }
        Insert: {
          avatar_url?: string | null
          full_name?: string | null
          id: string
          updated_at?: Date | null
          company_name?: string | null
          website?: string | null
          unsubscribed: boolean
          role?: string
          employee_approved?: boolean // <-- ADDED
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
          employee_approved?: boolean // <-- ADDED
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
      stripe_customers: { /* unchanged */ }
      tickets: { /* unchanged */ }
      ticket_replies: {    // <-- NEW TABLE DEFINITION
        Row: {
          id: string
          ticket_id: string
          user_id: string
          reply_text: string
          created_at: string | null
        }
        Insert: {
          id?: string
          ticket_id: string
          user_id: string
          reply_text: string
          created_at?: string | null
        }
        Update: {
          id?: string
          ticket_id?: string
          user_id?: string
          reply_text?: string
          created_at?: string | null
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
