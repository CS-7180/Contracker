// TypeScript types derived from the Supabase database schema
// See docs/database-schema.md for the full SQL schema

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
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          role: 'admin' | 'member' | 'super_admin'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          role?: 'admin' | 'member' | 'super_admin'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          role?: 'admin' | 'member' | 'super_admin'
          updated_at?: string
        }
      }
      suppliers: {
        Row: {
          id: string
          name: string
          contact_name: string | null
          contact_email: string | null
          contact_phone: string | null
          category: string | null
          status: 'active' | 'inactive'
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          contact_name?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          category?: string | null
          status?: 'active' | 'inactive'
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          contact_name?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          category?: string | null
          status?: 'active' | 'inactive'
          updated_at?: string
        }
      }
      contracts: {
        Row: {
          id: string
          contract_number: string
          name: string
          type: 'service' | 'purchase' | 'lease' | 'other'
          supplier_id: string
          category: string | null
          start_date: string
          end_date: string
          renewal_date: string
          notice_period_days: number
          value: number | null
          pdf_url: string | null
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          contract_number: string
          name: string
          type: 'service' | 'purchase' | 'lease' | 'other'
          supplier_id: string
          category?: string | null
          start_date: string
          end_date: string
          renewal_date: string
          notice_period_days?: number
          value?: number | null
          pdf_url?: string | null
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          type?: 'service' | 'purchase' | 'lease' | 'other'
          supplier_id?: string
          category?: string | null
          start_date?: string
          end_date?: string
          renewal_date?: string
          notice_period_days?: number
          value?: number | null
          pdf_url?: string | null
          updated_at?: string
        }
      }
      certifications: {
        Row: {
          id: string
          supplier_id: string
          cert_type: 'ISO' | 'NDA' | 'insurance' | 'other'
          issued_date: string | null
          expiry_date: string
          document_url: string | null
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          supplier_id: string
          cert_type: 'ISO' | 'NDA' | 'insurance' | 'other'
          issued_date?: string | null
          expiry_date: string
          document_url?: string | null
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          cert_type?: 'ISO' | 'NDA' | 'insurance' | 'other'
          issued_date?: string | null
          expiry_date?: string
          document_url?: string | null
          updated_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          contract_id: string
          threshold_days: 60 | 30 | 7
          message: string
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          contract_id: string
          threshold_days: 60 | 30 | 7
          message: string
          is_read?: boolean
          created_at?: string
        }
        Update: {
          is_read?: boolean
        }
      }
    }
  }
}

// Convenience types for use throughout the app
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Supplier = Database['public']['Tables']['suppliers']['Row']
export type Contract = Database['public']['Tables']['contracts']['Row']
export type Certification = Database['public']['Tables']['certifications']['Row']
export type Notification = Database['public']['Tables']['notifications']['Row']

// Computed fields added in application layer (never stored in DB)
export type ContractWithStatus = Contract & {
  status: 'active' | 'expiring' | 'expired'
  risk_colour: 'green' | 'amber' | 'red'
  supplier?: Supplier
}
