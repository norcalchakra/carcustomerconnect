export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      vehicles: {
        Row: {
          id: number
          created_at: string
          updated_at: string
          year: number
          make: string
          model: string
          vin: string
          stock_number: string
          price: number
          mileage: number
          color: string
          status: 'acquired' | 'in_service' | 'ready_for_sale' | 'sold'
          description: string | null
          features: string[] | null
          dealership_id: number
        }
        Insert: {
          id?: number
          created_at?: string
          updated_at?: string
          year: number
          make: string
          model: string
          vin: string
          stock_number: string
          price: number
          mileage: number
          color: string
          status: 'acquired' | 'in_service' | 'ready_for_sale' | 'sold'
          description?: string | null
          features?: string[] | null
          dealership_id: number
        }
        Update: {
          id?: number
          created_at?: string
          updated_at?: string
          year?: number
          make?: string
          model?: string
          vin?: string
          stock_number?: string
          price?: number
          mileage?: number
          color?: string
          status?: 'acquired' | 'in_service' | 'ready_for_sale' | 'sold'
          description?: string | null
          features?: string[] | null
          dealership_id?: number
        }
      }
      dealerships: {
        Row: {
          id: number
          created_at: string
          name: string
          address: string
          city: string
          state: string
          zip: string
          phone: string
          website: string | null
          user_id: string
        }
        Insert: {
          id?: number
          created_at?: string
          name: string
          address: string
          city: string
          state: string
          zip: string
          phone: string
          website?: string | null
          user_id: string
        }
        Update: {
          id?: number
          created_at?: string
          name?: string
          address?: string
          city?: string
          state?: string
          zip?: string
          phone?: string
          website?: string | null
          user_id?: string
        }
      }
      vehicle_events: {
        Row: {
          id: number
          created_at: string
          vehicle_id: number
          event_type: 'acquired' | 'service_complete' | 'ready_for_sale' | 'sold'
          notes: string | null
          posted_to_facebook: boolean
          posted_to_instagram: boolean
          posted_to_google: boolean
          post_id: string | null
        }
        Insert: {
          id?: number
          created_at?: string
          vehicle_id: number
          event_type: 'acquired' | 'service_complete' | 'ready_for_sale' | 'sold'
          notes?: string | null
          posted_to_facebook?: boolean
          posted_to_instagram?: boolean
          posted_to_google?: boolean
          post_id?: string | null
        }
        Update: {
          id?: number
          created_at?: string
          vehicle_id?: number
          event_type?: 'acquired' | 'service_complete' | 'ready_for_sale' | 'sold'
          notes?: string | null
          posted_to_facebook?: boolean
          posted_to_instagram?: boolean
          posted_to_google?: boolean
          post_id?: string | null
        }
      }
      vehicle_photos: {
        Row: {
          id: number
          created_at: string
          vehicle_id: number
          url: string
          order: number
        }
        Insert: {
          id?: number
          created_at?: string
          vehicle_id: number
          url: string
          order?: number
        }
        Update: {
          id?: number
          created_at?: string
          vehicle_id?: number
          url?: string
          order?: number
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
