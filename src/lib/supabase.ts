import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const isConfigured = supabaseUrl.includes('supabase.co');

export const supabase = isConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export const getPublicUrl = (path: string | null | undefined) => {
  if (!path) return 'https://images.unsplash.com/photo-1546767060-221e94403013?w=800&q=80'; // Healthy food fallback
  if (path.startsWith('http')) return path;
  
  if (supabaseUrl) {
    // Standard Supabase public URL construction: [URL]/storage/v1/object/public/[BUCKET]/[PATH]
    // The bucket defined in tables.md logic is 'menu'
    return `${supabaseUrl}/storage/v1/object/public/menu/${path}`;
  }
  
  return path;
};

export interface Product {
  id: string;
  code: string;
  name: string;
  description: string;
  price: number;
  protein: number;
  calories: number;
  carbs: number;
  fat: number;
  image_url: string;
  category: string;
  is_veg: boolean;
  tags: string[];
  is_available: boolean;
  created_at: string;
}

export interface Order {
  id: number; // Auto-incrementing ID
  order_number: string; // Formatted sequence or just ID
  customer_name: string;
  customer_phone: string;
  pickup_point: string;
  items: any[];
  total_price: number;
  discount_amount: number;
  final_price: number;
  status: 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  created_at: string;
}
