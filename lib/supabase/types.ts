export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export type Database = {
  public: {
    Tables: {
      gallery_items: {
        Row: {
          created_at: string;
          id: string;
          image_url: string;
          is_active: boolean;
          sort_order: number;
          title: string | null;
        };
        Insert: {
          created_at?: string;
          id?: string;
          image_url: string;
          is_active?: boolean;
          sort_order?: number;
          title?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["gallery_items"]["Insert"]>;
      };
      restaurant_menu_images: {
        Row: {
          id: string;
          restaurant: "la_churrasqueria" | "la_posada" | "cbari";
          image_url: string;
          sort_order: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          restaurant: "la_churrasqueria" | "la_posada" | "cbari";
          image_url: string;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["restaurant_menu_images"]["Insert"]>;
      };
      menu_categories: {
        Row: {
          id: string;
          name: string;
          product_type: "bebidas" | "tabaco";
          sort_order: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          product_type?: "bebidas" | "tabaco";
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["menu_categories"]["Insert"]>;
      };
      menu_items: {
        Row: {
          id: string;
          category_id: string;
          name: string;
          brand: string | null;
          description: string | null;
          price: number;
          image_url: string | null;
          is_featured: boolean;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          category_id: string;
          name: string;
          brand?: string | null;
          description?: string | null;
          price: number;
          image_url?: string | null;
          is_featured?: boolean;
          is_active?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["menu_items"]["Insert"]>;
      };
      promotions: {
        Row: {
          id: string;
          title: string;
          content: string;
          starts_at: string | null;
          ends_at: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          content: string;
          starts_at?: string | null;
          ends_at?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["promotions"]["Insert"]>;
      };
      event_banners: {
        Row: {
          id: string;
          title: string | null;
          image_url: string;
          event_date: string | null;
          reservation_start_time: string | null;
          reservation_end_time: string | null;
          sort_order: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          title?: string | null;
          image_url: string;
          event_date?: string | null;
          reservation_start_time?: string | null;
          reservation_end_time?: string | null;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["event_banners"]["Insert"]>;
      };
      restaurant_profiles: {
        Row: {
          restaurant: "la_churrasqueria" | "la_posada" | "cbari";
          reservation_start_time: string;
          reservation_end_time: string;
          display_hours_text: string;
          updated_at: string;
        };
        Insert: {
          restaurant: "la_churrasqueria" | "la_posada" | "cbari";
          reservation_start_time?: string;
          reservation_end_time?: string;
          display_hours_text?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["restaurant_profiles"]["Insert"]>;
      };
      event_banner_restaurants: {
        Row: {
          event_id: string;
          restaurant: "la_churrasqueria" | "la_posada" | "cbari";
        };
        Insert: {
          event_id: string;
          restaurant: "la_churrasqueria" | "la_posada" | "cbari";
        };
        Update: Partial<Database["public"]["Tables"]["event_banner_restaurants"]["Insert"]>;
      };
      reservations: {
        Row: {
          id: string;
          full_name: string;
          email: string;
          phone: string;
          reservation_date: string;
          reservation_time: string;
          guests: number;
          mesa: number | null;
          /** Restaurante elegido (cbari, la_posada, la_churrasqueria) */
          area?: "cbari" | "la_posada" | "la_churrasqueria" | null;
          event_id?: string | null;
          source: "web" | "manual";
          notes: string | null;
          status: "pendiente" | "confirmada" | "cancelada";
          created_at: string;
        };
        Insert: {
          id?: string;
          full_name: string;
          email: string;
          phone: string;
          reservation_date: string;
          reservation_time: string;
          guests: number;
          mesa?: number | null;
          area?: "cbari" | "la_posada" | "la_churrasqueria";
          event_id?: string | null;
          source?: "web" | "manual";
          notes?: string | null;
          status?: "pendiente" | "confirmada" | "cancelada";
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["reservations"]["Insert"]>;
      };
      admin_login_lockouts: {
        Row: {
          email: string;
          failed_attempts: number;
          locked_until: string | null;
          updated_at: string;
        };
        Insert: {
          email: string;
          failed_attempts?: number;
          locked_until?: string | null;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["admin_login_lockouts"]["Insert"]>;
      };
      user_profiles: {
        Row: {
          user_id: string;
          role: "super_admin" | "admin" | "supervisor" | "reservaciones" | "reporteria";
          created_at: string;
        };
        Insert: {
          user_id: string;
          role: "super_admin" | "admin" | "supervisor" | "reservaciones" | "reporteria";
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["user_profiles"]["Insert"]>;
      };
      site_settings: {
        Row: {
          id: number;
          hero_title: string;
          hero_subtitle: string;
          logo_url: string | null;
          logo_url_2: string | null;
          logo_url_3: string | null;
          instagram_url: string | null;
          facebook_url: string | null;
          tiktok_url: string | null;
          whatsapp_url: string | null;
          about_text: string;
          address: string;
          phone: string;
          email: string;
          opening_hours: Json;
          updated_at: string;
        };
        Insert: {
          id?: number;
          hero_title: string;
          hero_subtitle: string;
          logo_url?: string | null;
          logo_url_2?: string | null;
          logo_url_3?: string | null;
          instagram_url?: string | null;
          facebook_url?: string | null;
          tiktok_url?: string | null;
          whatsapp_url?: string | null;
          about_text: string;
          address: string;
          phone: string;
          email: string;
          opening_hours?: Json;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["site_settings"]["Insert"]>;
      };
    };
  };
};
