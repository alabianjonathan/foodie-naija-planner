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
      areas: {
        Row: {
          active: boolean
          city_id: string
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          city_id: string
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          city_id?: string
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "areas_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      cities: {
        Row: {
          active: boolean
          created_at: string
          id: string
          name: string
          state: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          name: string
          state?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          name?: string
          state?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      leads: {
        Row: {
          city: string | null
          created_at: string
          id: string
          meal_slug: string | null
          notes: string | null
          request_type: string
          restaurant_id: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          city?: string | null
          created_at?: string
          id?: string
          meal_slug?: string | null
          notes?: string | null
          request_type?: string
          restaurant_id?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          city?: string | null
          created_at?: string
          id?: string
          meal_slug?: string | null
          notes?: string | null
          request_type?: string
          restaurant_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      meal_plans: {
        Row: {
          budget: string | null
          city: string | null
          created_at: string
          data: Json
          id: string
          plan_type: string | null
          total_calories: number
          total_cost: number
          updated_at: string
          user_id: string
        }
        Insert: {
          budget?: string | null
          city?: string | null
          created_at?: string
          data?: Json
          id?: string
          plan_type?: string | null
          total_calories?: number
          total_cost?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          budget?: string | null
          city?: string | null
          created_at?: string
          data?: Json
          id?: string
          plan_type?: string | null
          total_calories?: number
          total_cost?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      meals: {
        Row: {
          best_time: string[]
          calories_max: number
          calories_min: number
          carbs: string | null
          category: string
          cook_max: number
          cook_min: number
          cooking_time_min: number
          created_at: string
          description: string | null
          emoji: string | null
          fat: string | null
          fiber: string | null
          goals: string[]
          gradient: string | null
          health_note: string | null
          health_score: number | null
          id: string
          ingredients: Json
          name: string
          order_max: number
          order_min: number
          popular: boolean
          portion: string | null
          protein: string | null
          slug: string
          status: string
          updated_at: string
        }
        Insert: {
          best_time?: string[]
          calories_max?: number
          calories_min?: number
          carbs?: string | null
          category: string
          cook_max?: number
          cook_min?: number
          cooking_time_min?: number
          created_at?: string
          description?: string | null
          emoji?: string | null
          fat?: string | null
          fiber?: string | null
          goals?: string[]
          gradient?: string | null
          health_note?: string | null
          health_score?: number | null
          id?: string
          ingredients?: Json
          name: string
          order_max?: number
          order_min?: number
          popular?: boolean
          portion?: string | null
          protein?: string | null
          slug: string
          status?: string
          updated_at?: string
        }
        Update: {
          best_time?: string[]
          calories_max?: number
          calories_min?: number
          carbs?: string | null
          category?: string
          cook_max?: number
          cook_min?: number
          cooking_time_min?: number
          created_at?: string
          description?: string | null
          emoji?: string | null
          fat?: string | null
          fiber?: string | null
          goals?: string[]
          gradient?: string | null
          health_note?: string | null
          health_score?: number | null
          id?: string
          ingredients?: Json
          name?: string
          order_max?: number
          order_min?: number
          popular?: boolean
          portion?: string | null
          protein?: string | null
          slug?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          area: string | null
          avatar_url: string | null
          budget: string | null
          city: string | null
          cook_order: string | null
          created_at: string
          display_name: string | null
          goal: string | null
          id: string
          onboarded: boolean
          people: number | null
          phone: string | null
          planning_type: string | null
          restriction: string | null
          updated_at: string
        }
        Insert: {
          area?: string | null
          avatar_url?: string | null
          budget?: string | null
          city?: string | null
          cook_order?: string | null
          created_at?: string
          display_name?: string | null
          goal?: string | null
          id: string
          onboarded?: boolean
          people?: number | null
          phone?: string | null
          planning_type?: string | null
          restriction?: string | null
          updated_at?: string
        }
        Update: {
          area?: string | null
          avatar_url?: string | null
          budget?: string | null
          city?: string | null
          cook_order?: string | null
          created_at?: string
          display_name?: string | null
          goal?: string | null
          id?: string
          onboarded?: boolean
          people?: number | null
          phone?: string | null
          planning_type?: string | null
          restriction?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      restaurants: {
        Row: {
          address: string | null
          area: string | null
          city: string
          created_at: string
          delivery: boolean
          distance_km: number
          email: string | null
          id: string
          meal_slugs: string[]
          name: string
          opening: string | null
          owner_id: string | null
          phone: string | null
          rating: number
          slug: string
          status: string
          tags: string[]
          updated_at: string
          verified: boolean
          whatsapp: string | null
        }
        Insert: {
          address?: string | null
          area?: string | null
          city: string
          created_at?: string
          delivery?: boolean
          distance_km?: number
          email?: string | null
          id?: string
          meal_slugs?: string[]
          name: string
          opening?: string | null
          owner_id?: string | null
          phone?: string | null
          rating?: number
          slug: string
          status?: string
          tags?: string[]
          updated_at?: string
          verified?: boolean
          whatsapp?: string | null
        }
        Update: {
          address?: string | null
          area?: string | null
          city?: string
          created_at?: string
          delivery?: boolean
          distance_km?: number
          email?: string | null
          id?: string
          meal_slugs?: string[]
          name?: string
          opening?: string | null
          owner_id?: string | null
          phone?: string | null
          rating?: number
          slug?: string
          status?: string
          tags?: string[]
          updated_at?: string
          verified?: boolean
          whatsapp?: string | null
        }
        Relationships: []
      }
      saved_meals: {
        Row: {
          created_at: string
          id: string
          meal_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          meal_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          meal_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_meals_meal_id_fkey"
            columns: ["meal_id"]
            isOneToOne: false
            referencedRelation: "meals"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      app_role: "super_admin" | "admin" | "restaurant" | "user"
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
      app_role: ["super_admin", "admin", "restaurant", "user"],
    },
  },
} as const
