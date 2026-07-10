export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      departments: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      dept_credentials: {
        Row: {
          password: string
          slug: string
          updated_at: string
        }
        Insert: {
          password: string
          slug: string
          updated_at?: string
        }
        Update: {
          password?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      grades: {
        Row: {
          created_at: string
          created_by_dept: string | null
          da_task_detail: string | null
          da_task_grade: number | null
          date: string
          dept_task_detail: string | null
          dept_task_grade: number | null
          ethics: Database["public"]["Enums"]["ethics_rating"] | null
          ethics_comment: string | null
          ethics_grade: number | null
          hod_grade: number | null
          hod_remarks: string | null
          hr_task_detail: string | null
          hr_task_grade: number | null
          id: string
          is_auto_na: boolean
          mkt_task_detail: string | null
          mkt_task_grade: number | null
          other_grade: number | null
          other_remarks: string | null
          person_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by_dept?: string | null
          da_task_detail?: string | null
          da_task_grade?: number | null
          date: string
          dept_task_detail?: string | null
          dept_task_grade?: number | null
          ethics?: Database["public"]["Enums"]["ethics_rating"] | null
          ethics_comment?: string | null
          ethics_grade?: number | null
          hod_grade?: number | null
          hod_remarks?: string | null
          hr_task_detail?: string | null
          hr_task_grade?: number | null
          id?: string
          is_auto_na?: boolean
          mkt_task_detail?: string | null
          mkt_task_grade?: number | null
          other_grade?: number | null
          other_remarks?: string | null
          person_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by_dept?: string | null
          da_task_detail?: string | null
          da_task_grade?: number | null
          date?: string
          dept_task_detail?: string | null
          dept_task_grade?: number | null
          ethics?: Database["public"]["Enums"]["ethics_rating"] | null
          ethics_comment?: string | null
          ethics_grade?: number | null
          hod_grade?: number | null
          hod_remarks?: string | null
          hr_task_detail?: string | null
          hr_task_grade?: number | null
          id?: string
          is_auto_na?: boolean
          mkt_task_detail?: string | null
          mkt_task_grade?: number | null
          other_grade?: number | null
          other_remarks?: string | null
          person_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "grades_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
        ]
      }
      people: {
        Row: {
          created_at: string
          department_slug: string
          email: string | null
          id: string
          instagram: string | null
          leave_end: string | null
          leave_start: string | null
          name: string
          phone: string | null
          role: string | null
          status: Database["public"]["Enums"]["person_status"]
          status_reason: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          department_slug: string
          email?: string | null
          id?: string
          instagram?: string | null
          leave_end?: string | null
          leave_start?: string | null
          name: string
          phone?: string | null
          role?: string | null
          status?: Database["public"]["Enums"]["person_status"]
          status_reason?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          department_slug?: string
          email?: string | null
          id?: string
          instagram?: string | null
          leave_end?: string | null
          leave_start?: string | null
          name?: string
          phone?: string | null
          role?: string | null
          status?: Database["public"]["Enums"]["person_status"]
          status_reason?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "people_department_slug_fkey"
            columns: ["department_slug"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["slug"]
          },
        ]
      }
      status_history: {
        Row: {
          changed_at: string
          changed_by_dept: string | null
          id: string
          leave_end: string | null
          leave_start: string | null
          person_id: string
          reason: string | null
          status: Database["public"]["Enums"]["person_status"]
        }
        Insert: {
          changed_at?: string
          changed_by_dept?: string | null
          id?: string
          leave_end?: string | null
          leave_start?: string | null
          person_id: string
          reason?: string | null
          status: Database["public"]["Enums"]["person_status"]
        }
        Update: {
          changed_at?: string
          changed_by_dept?: string | null
          id?: string
          leave_end?: string | null
          leave_start?: string | null
          person_id?: string
          reason?: string | null
          status?: Database["public"]["Enums"]["person_status"]
        }
        Relationships: [
          {
            foreignKeyName: "status_history_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      ethics_rating: "good" | "bad" | "na"
      person_status:
        | "active"
        | "on_leave"
        | "inactive"
        | "terminated"
        | "resigned"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      ethics_rating: ["good", "bad", "na"],
      person_status: [
        "active",
        "on_leave",
        "inactive",
        "terminated",
        "resigned",
      ],
    },
  },
} as const
