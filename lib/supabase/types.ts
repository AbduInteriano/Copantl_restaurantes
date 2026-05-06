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
          sort_order: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          title?: string | null;
          image_url: string;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["event_banners"]["Insert"]>;
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
          source?: "web" | "manual";
          notes?: string | null;
          status?: "pendiente" | "confirmada" | "cancelada";
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["reservations"]["Insert"]>;
      };
      site_settings: {
        Row: {
          id: number;
          hero_title: string;
          hero_subtitle: string;
          logo_url: string | null;
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
