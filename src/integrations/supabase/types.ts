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
      calendar_events: {
        Row: {
          created_at: string
          description: string | null
          end_time: string
          id: string
          location: string | null
          project_id: string | null
          start_time: string
          title: string
          type: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          end_time: string
          id?: string
          location?: string | null
          project_id?: string | null
          start_time: string
          title: string
          type?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          end_time?: string
          id?: string
          location?: string | null
          project_id?: string | null
          start_time?: string
          title?: string
          type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_events_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      characters: {
        Row: {
          age: number | null
          backstory: string | null
          behavior: Json | null
          created_at: string
          goals: string | null
          id: number
          name: string
          passions: Json | null
          personality: Json | null
          tasks: Json | null
        }
        Insert: {
          age?: number | null
          backstory?: string | null
          behavior?: Json | null
          created_at?: string
          goals?: string | null
          id?: never
          name: string
          passions?: Json | null
          personality?: Json | null
          tasks?: Json | null
        }
        Update: {
          age?: number | null
          backstory?: string | null
          behavior?: Json | null
          created_at?: string
          goals?: string | null
          id?: never
          name?: string
          passions?: Json | null
          personality?: Json | null
          tasks?: Json | null
        }
        Relationships: []
      }
      contacts: {
        Row: {
          company: string | null
          created_at: string
          email: string
          first_name: string
          id: string
          last_name: string
          message: string
          newsletter: boolean
          phone: string | null
          project_types: string[]
          status: string
          updated_at: string
        }
        Insert: {
          company?: string | null
          created_at?: string
          email: string
          first_name: string
          id?: string
          last_name: string
          message: string
          newsletter?: boolean
          phone?: string | null
          project_types: string[]
          status?: string
          updated_at?: string
        }
        Update: {
          company?: string | null
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          message?: string
          newsletter?: boolean
          phone?: string | null
          project_types?: string[]
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      faqs: {
        Row: {
          answer: string
          category: string | null
          created_at: string | null
          id: string
          keywords: string[] | null
          question: string
        }
        Insert: {
          answer: string
          category?: string | null
          created_at?: string | null
          id?: string
          keywords?: string[] | null
          question: string
        }
        Update: {
          answer?: string
          category?: string | null
          created_at?: string | null
          id?: string
          keywords?: string[] | null
          question?: string
        }
        Relationships: []
      }
      feature_flags: {
        Row: {
          created_at: string
          description: string | null
          enabled: boolean
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          enabled?: boolean
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          enabled?: boolean
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      form_submissions: {
        Row: {
          company: string | null
          created_at: string | null
          email: string
          id: string
          message: string
          name: string
          status: string | null
          subject: string | null
        }
        Insert: {
          company?: string | null
          created_at?: string | null
          email: string
          id?: string
          message: string
          name: string
          status?: string | null
          subject?: string | null
        }
        Update: {
          company?: string | null
          created_at?: string | null
          email?: string
          id?: string
          message?: string
          name?: string
          status?: string | null
          subject?: string | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          created_at: string
          id: string
          read: boolean | null
          recipient: string
          sender: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          read?: boolean | null
          recipient: string
          sender: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          read?: boolean | null
          recipient?: string
          sender?: string
        }
        Relationships: []
      }
      navigation_links: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          keywords: string[] | null
          title: string
          url: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          keywords?: string[] | null
          title: string
          url: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          keywords?: string[] | null
          title?: string
          url?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          content: Json | null
          created_at: string
          description: string | null
          id: string
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          content?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          title: string
          type: string
          updated_at?: string
        }
        Update: {
          content?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      resources: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          file_path: string | null
          id: string
          size: string | null
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          file_path?: string | null
          id?: string
          size?: string | null
          title: string
          type: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          file_path?: string | null
          id?: string
          size?: string | null
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      sticky_note_connections: {
        Row: {
          color: string | null
          created_at: string | null
          from_handle: string
          from_note_id: string
          id: string
          label: string | null
          style: string | null
          to_handle: string
          to_note_id: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          from_handle: string
          from_note_id: string
          id?: string
          label?: string | null
          style?: string | null
          to_handle: string
          to_note_id: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          from_handle?: string
          from_note_id?: string
          id?: string
          label?: string | null
          style?: string | null
          to_handle?: string
          to_note_id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sticky_note_connections_from_note_id_fkey"
            columns: ["from_note_id"]
            isOneToOne: false
            referencedRelation: "sticky_notes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sticky_note_connections_to_note_id_fkey"
            columns: ["to_note_id"]
            isOneToOne: false
            referencedRelation: "sticky_notes"
            referencedColumns: ["id"]
          },
        ]
      }
      sticky_notes: {
        Row: {
          ai_generated: boolean | null
          color: string
          column_id: string
          content: string
          created_at: string | null
          height: number | null
          id: string
          position: number
          tags: string[] | null
          updated_at: string | null
          user_id: string | null
          width: number | null
          x: number | null
          y: number | null
          z_index: number | null
        }
        Insert: {
          ai_generated?: boolean | null
          color?: string
          column_id: string
          content: string
          created_at?: string | null
          height?: number | null
          id?: string
          position?: number
          tags?: string[] | null
          updated_at?: string | null
          user_id?: string | null
          width?: number | null
          x?: number | null
          y?: number | null
          z_index?: number | null
        }
        Update: {
          ai_generated?: boolean | null
          color?: string
          column_id?: string
          content?: string
          created_at?: string | null
          height?: number | null
          id?: string
          position?: number
          tags?: string[] | null
          updated_at?: string | null
          user_id?: string | null
          width?: number | null
          x?: number | null
          y?: number | null
          z_index?: number | null
        }
        Relationships: []
      }
      tasks: {
        Row: {
          assignee: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          priority: string
          project_id: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          assignee?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string
          project_id?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          assignee?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string
          project_id?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      team_invitations: {
        Row: {
          email: string
          expires_at: string
          id: string
          invited_at: string
          invited_by: string
          role: string
          token: string
        }
        Insert: {
          email: string
          expires_at?: string
          id?: string
          invited_at?: string
          invited_by: string
          role?: string
          token: string
        }
        Update: {
          email?: string
          expires_at?: string
          id?: string
          invited_at?: string
          invited_by?: string
          role?: string
          token?: string
        }
        Relationships: []
      }
      team_members: {
        Row: {
          created_at: string
          email: string
          id: string
          role: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          role?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          role?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          avatar_url: string | null
          company: string | null
          created_at: string
          email: string
          first_name: string | null
          id: string
          job_title: string | null
          last_name: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          company?: string | null
          created_at?: string
          email: string
          first_name?: string | null
          id: string
          job_title?: string | null
          last_name?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          company?: string | null
          created_at?: string
          email?: string
          first_name?: string | null
          id?: string
          job_title?: string | null
          last_name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          animations_enabled: boolean
          browser_notifications: boolean
          comments_notifications: boolean
          created_at: string
          dense_layout: boolean
          email_notifications: boolean
          id: string
          marketing_emails: boolean
          mentions_notifications: boolean
          project_updates: boolean
          sms_notifications: boolean
          system_updates: boolean
          task_assignments: boolean
          theme: string
          updated_at: string
        }
        Insert: {
          animations_enabled?: boolean
          browser_notifications?: boolean
          comments_notifications?: boolean
          created_at?: string
          dense_layout?: boolean
          email_notifications?: boolean
          id: string
          marketing_emails?: boolean
          mentions_notifications?: boolean
          project_updates?: boolean
          sms_notifications?: boolean
          system_updates?: boolean
          task_assignments?: boolean
          theme?: string
          updated_at?: string
        }
        Update: {
          animations_enabled?: boolean
          browser_notifications?: boolean
          comments_notifications?: boolean
          created_at?: string
          dense_layout?: boolean
          email_notifications?: boolean
          id?: string
          marketing_emails?: boolean
          mentions_notifications?: boolean
          project_updates?: boolean
          sms_notifications?: boolean
          system_updates?: boolean
          task_assignments?: boolean
          theme?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_team_invitation: {
        Args: { invite_email: string; invite_role?: string }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
