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
      chef_leads: {
        Row: {
          chef_id: string
          created_at: string
          id: string
          message: string | null
          name: string
          phone: string | null
          requested_date: string | null
          status: Database["public"]["Enums"]["chef_lead_status"]
          updated_at: string
          user_id: string | null
          whatsapp: string | null
        }
        Insert: {
          chef_id: string
          created_at?: string
          id?: string
          message?: string | null
          name: string
          phone?: string | null
          requested_date?: string | null
          status?: Database["public"]["Enums"]["chef_lead_status"]
          updated_at?: string
          user_id?: string | null
          whatsapp?: string | null
        }
        Update: {
          chef_id?: string
          created_at?: string
          id?: string
          message?: string | null
          name?: string
          phone?: string | null
          requested_date?: string | null
          status?: Database["public"]["Enums"]["chef_lead_status"]
          updated_at?: string
          user_id?: string | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chef_leads_chef_id_fkey"
            columns: ["chef_id"]
            isOneToOne: false
            referencedRelation: "chefs"
            referencedColumns: ["id"]
          },
        ]
      }
      chef_listings: {
        Row: {
          available_days: string[]
          chef_id: string
          created_at: string
          description: string | null
          id: string
          name: string
          photos: string[]
          price_max: number | null
          price_min: number | null
          service_area: string | null
          status: string
          type: Database["public"]["Enums"]["chef_listing_type"]
          updated_at: string
        }
        Insert: {
          available_days?: string[]
          chef_id: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          photos?: string[]
          price_max?: number | null
          price_min?: number | null
          service_area?: string | null
          status?: string
          type: Database["public"]["Enums"]["chef_listing_type"]
          updated_at?: string
        }
        Update: {
          available_days?: string[]
          chef_id?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          photos?: string[]
          price_max?: number | null
          price_min?: number | null
          service_area?: string | null
          status?: string
          type?: Database["public"]["Enums"]["chef_listing_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chef_listings_chef_id_fkey"
            columns: ["chef_id"]
            isOneToOne: false
            referencedRelation: "chefs"
            referencedColumns: ["id"]
          },
        ]
      }
      chef_profile_views: {
        Row: {
          chef_id: string
          id: number
          viewed_at: string
          viewer_id: string | null
        }
        Insert: {
          chef_id: string
          id?: number
          viewed_at?: string
          viewer_id?: string | null
        }
        Update: {
          chef_id?: string
          id?: number
          viewed_at?: string
          viewer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chef_profile_views_chef_id_fkey"
            columns: ["chef_id"]
            isOneToOne: false
            referencedRelation: "chefs"
            referencedColumns: ["id"]
          },
        ]
      }
      chef_reviews: {
        Row: {
          chef_id: string
          comment: string | null
          created_at: string
          id: string
          rating: number
          user_id: string
        }
        Insert: {
          chef_id: string
          comment?: string | null
          created_at?: string
          id?: string
          rating: number
          user_id: string
        }
        Update: {
          chef_id?: string
          comment?: string | null
          created_at?: string
          id?: string
          rating?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chef_reviews_chef_id_fkey"
            columns: ["chef_id"]
            isOneToOne: false
            referencedRelation: "chefs"
            referencedColumns: ["id"]
          },
        ]
      }
      chef_subscriptions: {
        Row: {
          amount_kobo: number
          chef_id: string
          created_at: string
          current_period_end: string | null
          id: string
          paystack_customer_code: string | null
          paystack_email_token: string | null
          paystack_subscription_code: string | null
          plan: Database["public"]["Enums"]["chef_plan"]
          status: Database["public"]["Enums"]["chef_subscription_status"]
          updated_at: string
        }
        Insert: {
          amount_kobo?: number
          chef_id: string
          created_at?: string
          current_period_end?: string | null
          id?: string
          paystack_customer_code?: string | null
          paystack_email_token?: string | null
          paystack_subscription_code?: string | null
          plan: Database["public"]["Enums"]["chef_plan"]
          status?: Database["public"]["Enums"]["chef_subscription_status"]
          updated_at?: string
        }
        Update: {
          amount_kobo?: number
          chef_id?: string
          created_at?: string
          current_period_end?: string | null
          id?: string
          paystack_customer_code?: string | null
          paystack_email_token?: string | null
          paystack_subscription_code?: string | null
          plan?: Database["public"]["Enums"]["chef_plan"]
          status?: Database["public"]["Enums"]["chef_subscription_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chef_subscriptions_chef_id_fkey"
            columns: ["chef_id"]
            isOneToOne: false
            referencedRelation: "chefs"
            referencedColumns: ["id"]
          },
        ]
      }
      chefs: {
        Row: {
          area: string | null
          areas_covered: string[]
          availability: string | null
          bio: string | null
          business_name: string
          categories: string[]
          city: string
          created_at: string
          email: string | null
          featured: boolean
          full_name: string
          id: string
          id_document_url: string | null
          phone: string | null
          photo_url: string | null
          plan: Database["public"]["Enums"]["chef_plan"]
          plan_expires_at: string | null
          price_max: number | null
          price_min: number | null
          rating: number | null
          slug: string
          status: Database["public"]["Enums"]["chef_status"]
          updated_at: string
          user_id: string | null
          verified: boolean
          whatsapp: string | null
          years_experience: number | null
        }
        Insert: {
          area?: string | null
          areas_covered?: string[]
          availability?: string | null
          bio?: string | null
          business_name: string
          categories?: string[]
          city: string
          created_at?: string
          email?: string | null
          featured?: boolean
          full_name: string
          id?: string
          id_document_url?: string | null
          phone?: string | null
          photo_url?: string | null
          plan?: Database["public"]["Enums"]["chef_plan"]
          plan_expires_at?: string | null
          price_max?: number | null
          price_min?: number | null
          rating?: number | null
          slug: string
          status?: Database["public"]["Enums"]["chef_status"]
          updated_at?: string
          user_id?: string | null
          verified?: boolean
          whatsapp?: string | null
          years_experience?: number | null
        }
        Update: {
          area?: string | null
          areas_covered?: string[]
          availability?: string | null
          bio?: string | null
          business_name?: string
          categories?: string[]
          city?: string
          created_at?: string
          email?: string | null
          featured?: boolean
          full_name?: string
          id?: string
          id_document_url?: string | null
          phone?: string | null
          photo_url?: string | null
          plan?: Database["public"]["Enums"]["chef_plan"]
          plan_expires_at?: string | null
          price_max?: number | null
          price_min?: number | null
          rating?: number | null
          slug?: string
          status?: Database["public"]["Enums"]["chef_status"]
          updated_at?: string
          user_id?: string | null
          verified?: boolean
          whatsapp?: string | null
          years_experience?: number | null
        }
        Relationships: []
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
      food_categories: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      foods: {
        Row: {
          aliases: string[]
          category_id: string | null
          created_at: string
          id: string
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          aliases?: string[]
          category_id?: string | null
          created_at?: string
          id?: string
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          aliases?: string[]
          category_id?: string | null
          created_at?: string
          id?: string
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "foods_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "food_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      import_logs: {
        Row: {
          created_at: string
          id: string
          kind: string
          ran_by: string | null
          rows: Json
          summary: Json
        }
        Insert: {
          created_at?: string
          id?: string
          kind: string
          ran_by?: string | null
          rows?: Json
          summary?: Json
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          ran_by?: string | null
          rows?: Json
          summary?: Json
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
      nutrition_goals: {
        Row: {
          activity_target_min: number
          carbs_g: number
          created_at: string
          daily_calories: number
          fat_g: number
          fiber_g: number
          goal_type: string
          protein_g: number
          updated_at: string
          user_id: string
          water_ml: number
          weight_target_kg: number | null
        }
        Insert: {
          activity_target_min?: number
          carbs_g?: number
          created_at?: string
          daily_calories?: number
          fat_g?: number
          fiber_g?: number
          goal_type?: string
          protein_g?: number
          updated_at?: string
          user_id: string
          water_ml?: number
          weight_target_kg?: number | null
        }
        Update: {
          activity_target_min?: number
          carbs_g?: number
          created_at?: string
          daily_calories?: number
          fat_g?: number
          fiber_g?: number
          goal_type?: string
          protein_g?: number
          updated_at?: string
          user_id?: string
          water_ml?: number
          weight_target_kg?: number | null
        }
        Relationships: []
      }
      nutrition_logs: {
        Row: {
          activity_minutes: number | null
          activity_type: string | null
          calories: number | null
          carbs_g: number | null
          created_at: string
          entry_type: string
          fat_g: number | null
          fiber_g: number | null
          food_name: string | null
          id: string
          logged_at: string
          logged_on: string
          meal_id: string | null
          meal_slot: string | null
          notes: string | null
          protein_g: number | null
          servings: number | null
          updated_at: string
          user_id: string
          water_ml: number | null
          weight_kg: number | null
        }
        Insert: {
          activity_minutes?: number | null
          activity_type?: string | null
          calories?: number | null
          carbs_g?: number | null
          created_at?: string
          entry_type: string
          fat_g?: number | null
          fiber_g?: number | null
          food_name?: string | null
          id?: string
          logged_at?: string
          logged_on?: string
          meal_id?: string | null
          meal_slot?: string | null
          notes?: string | null
          protein_g?: number | null
          servings?: number | null
          updated_at?: string
          user_id: string
          water_ml?: number | null
          weight_kg?: number | null
        }
        Update: {
          activity_minutes?: number | null
          activity_type?: string | null
          calories?: number | null
          carbs_g?: number | null
          created_at?: string
          entry_type?: string
          fat_g?: number | null
          fiber_g?: number | null
          food_name?: string | null
          id?: string
          logged_at?: string
          logged_on?: string
          meal_id?: string | null
          meal_slot?: string | null
          notes?: string | null
          protein_g?: number | null
          servings?: number | null
          updated_at?: string
          user_id?: string
          water_ml?: number | null
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "nutrition_logs_meal_id_fkey"
            columns: ["meal_id"]
            isOneToOne: false
            referencedRelation: "meals"
            referencedColumns: ["id"]
          },
        ]
      }
      nutrition_streaks: {
        Row: {
          achievements: Json
          created_at: string
          current_streak: number
          last_logged_on: string | null
          longest_streak: number
          updated_at: string
          user_id: string
        }
        Insert: {
          achievements?: Json
          created_at?: string
          current_streak?: number
          last_logged_on?: string | null
          longest_streak?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          achievements?: Json
          created_at?: string
          current_streak?: number
          last_logged_on?: string | null
          longest_streak?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      platform_settings: {
        Row: {
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Update: {
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
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
      restaurant_foods: {
        Row: {
          created_at: string
          food_id: string
          restaurant_id: string
          source: string | null
        }
        Insert: {
          created_at?: string
          food_id: string
          restaurant_id: string
          source?: string | null
        }
        Update: {
          created_at?: string
          food_id?: string
          restaurant_id?: string
          source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_foods_food_id_fkey"
            columns: ["food_id"]
            isOneToOne: false
            referencedRelation: "foods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "restaurant_foods_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurants: {
        Row: {
          address: string | null
          area: string | null
          branch_name: string | null
          chain: string | null
          city: string
          cover_url: string | null
          created_at: string
          delivery: boolean
          distance_km: number
          email: string | null
          food_data_priority: number
          google_maps_url: string | null
          has_verified_food_data: boolean
          id: string
          last_imported_at: string | null
          latitude: number | null
          longitude: number | null
          meal_slugs: string[]
          name: string
          needs_review: boolean
          opening: string | null
          owner_id: string | null
          phone: string | null
          rating: number
          restaurant_data_source: string | null
          review_reason: string | null
          slug: string
          source_url: string | null
          state: string | null
          status: string
          tags: string[]
          updated_at: string
          verification_status: string | null
          verified: boolean
          whatsapp: string | null
        }
        Insert: {
          address?: string | null
          area?: string | null
          branch_name?: string | null
          chain?: string | null
          city: string
          cover_url?: string | null
          created_at?: string
          delivery?: boolean
          distance_km?: number
          email?: string | null
          food_data_priority?: number
          google_maps_url?: string | null
          has_verified_food_data?: boolean
          id?: string
          last_imported_at?: string | null
          latitude?: number | null
          longitude?: number | null
          meal_slugs?: string[]
          name: string
          needs_review?: boolean
          opening?: string | null
          owner_id?: string | null
          phone?: string | null
          rating?: number
          restaurant_data_source?: string | null
          review_reason?: string | null
          slug: string
          source_url?: string | null
          state?: string | null
          status?: string
          tags?: string[]
          updated_at?: string
          verification_status?: string | null
          verified?: boolean
          whatsapp?: string | null
        }
        Update: {
          address?: string | null
          area?: string | null
          branch_name?: string | null
          chain?: string | null
          city?: string
          cover_url?: string | null
          created_at?: string
          delivery?: boolean
          distance_km?: number
          email?: string | null
          food_data_priority?: number
          google_maps_url?: string | null
          has_verified_food_data?: boolean
          id?: string
          last_imported_at?: string | null
          latitude?: number | null
          longitude?: number | null
          meal_slugs?: string[]
          name?: string
          needs_review?: boolean
          opening?: string | null
          owner_id?: string | null
          phone?: string | null
          rating?: number
          restaurant_data_source?: string | null
          review_reason?: string | null
          slug?: string
          source_url?: string | null
          state?: string | null
          status?: string
          tags?: string[]
          updated_at?: string
          verification_status?: string | null
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "super_admin" | "admin" | "restaurant" | "user" | "chef"
      chef_lead_status: "new" | "contacted" | "closed"
      chef_listing_type: "food" | "service"
      chef_plan: "basic" | "featured" | "premium"
      chef_status: "pending" | "active" | "suspended" | "rejected"
      chef_subscription_status: "active" | "expired" | "canceled" | "pending"
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
      app_role: ["super_admin", "admin", "restaurant", "user", "chef"],
      chef_lead_status: ["new", "contacted", "closed"],
      chef_listing_type: ["food", "service"],
      chef_plan: ["basic", "featured", "premium"],
      chef_status: ["pending", "active", "suspended", "rejected"],
      chef_subscription_status: ["active", "expired", "canceled", "pending"],
    },
  },
} as const
