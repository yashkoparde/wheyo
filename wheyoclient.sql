-- WHEYO: System Database Architecture
-- Precision Fuel for the Student-Athlete
-- This file contains the complete schema, tables, and RLS policies for the Wheyo platform.

-- ---------------------------------------------------------
-- 1. EXTENSIONS & STORAGE SETUP
-- ---------------------------------------------------------
-- Ensure necessary extensions are enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ---------------------------------------------------------
-- 2. TABLES DEFINITION
-- ---------------------------------------------------------

-- PRODUCTS TABLE: The core macro-engine inventory
CREATE TABLE IF NOT EXISTS public.products (
    id BIGSERIAL PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    protein NUMERIC(10, 1) NOT NULL DEFAULT 0.0,
    calories NUMERIC(10, 0) NOT NULL DEFAULT 0,
    carbs NUMERIC(10, 1) DEFAULT 0.0,
    fat NUMERIC(10, 1) DEFAULT 0.0,
    image_url TEXT,
    category TEXT DEFAULT 'Main',
    is_veg BOOLEAN DEFAULT true,
    tags TEXT[] DEFAULT '{}',
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- DAILY MACROS TABLE: User-specific protein tracking
CREATE TABLE IF NOT EXISTS public.daily_macros (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    protein_consumed NUMERIC(10, 1) DEFAULT 0.0,
    calories_consumed NUMERIC(10, 1) DEFAULT 0.0,
    UNIQUE(user_id, date)
);

-- ADMINS TABLE: Defines identity verification for system overrides
CREATE TABLE IF NOT EXISTS public.admins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- COUPONS TABLE: Incentive and discount logic
CREATE TABLE IF NOT EXISTS public.coupons (
    id BIGSERIAL PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    discount_amount NUMERIC(10, 2) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ORDERS TABLE: Transactional logs
CREATE TABLE IF NOT EXISTS public.orders (
    id BIGSERIAL PRIMARY KEY,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    pickup_point TEXT NOT NULL,
    items JSONB NOT NULL,
    total_price NUMERIC(10, 2) NOT NULL,
    discount_amount NUMERIC(10, 2) DEFAULT 0.00,
    final_price NUMERIC(10, 2) NOT NULL,
    protein_total NUMERIC(10, 1) DEFAULT 0.0,
    status TEXT DEFAULT 'pending',
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------
-- 3. ENABLE ROW LEVEL SECURITY (RLS)
-- ---------------------------------------------------------

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_macros ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------
-- 4. POLICIES (AS PER MISSION SPECIFICATIONS)
-- ---------------------------------------------------------

-- 🚀 PRODUCTS POLICIES
CREATE POLICY "Public Read" ON public.products
    FOR SELECT USING (true);

CREATE POLICY "Allow public select" ON public.products
    FOR SELECT TO public USING (true);

CREATE POLICY "Allow public select on products" ON public.products
    FOR SELECT TO public USING (true);

CREATE POLICY "Allow admin insert" ON public.products
    FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Allow admin update" ON public.products
    FOR UPDATE TO public USING (true);

CREATE POLICY "Allow admin delete" ON public.products
    FOR DELETE TO public USING (true);

CREATE POLICY "Admins can do everything" ON public.products
    FOR ALL TO authenticated 
    USING (EXISTS (SELECT 1 FROM admins WHERE admins.user_id = auth.uid()))
    WITH CHECK (EXISTS (SELECT 1 FROM admins WHERE admins.user_id = auth.uid()));

CREATE POLICY "Manage products for authenticated users" ON public.products
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Admin Full Access" ON public.products
    FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow admin all on products" ON public.products
    FOR ALL TO authenticated USING (true);

-- 🚀 DAILY MACROS POLICIES
CREATE POLICY "Users can view their own macros" ON public.daily_macros
    FOR SELECT TO public USING (auth.uid() = user_id);

CREATE POLICY "Users can view own macros" ON public.daily_macros
    FOR SELECT TO public USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own macros" ON public.daily_macros
    FOR INSERT TO public WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert own macros" ON public.daily_macros
    FOR INSERT TO public WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own macros" ON public.daily_macros
    FOR UPDATE TO public USING (auth.uid() = user_id);

CREATE POLICY "Users can update own macros" ON public.daily_macros
    FOR UPDATE TO public USING (auth.uid() = user_id);

-- 🚀 COUPONS POLICIES
CREATE POLICY "Public can read active coupons" ON public.coupons
    FOR SELECT TO public USING (is_active = true);

CREATE POLICY "Admin full access" ON public.coupons
    FOR ALL TO public 
    USING ((auth.jwt() ->> 'email') = 'yashkoparde2022@gmail.com')
    WITH CHECK ((auth.jwt() ->> 'email') = 'yashkoparde2022@gmail.com');

-- 🚀 ORDERS POLICIES (Fallback security)
-- Dropping ALL potential older policies to ensure a clean slate
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
DROP POLICY IF EXISTS "Public can insert orders" ON public.orders;
DROP POLICY IF EXISTS "Allow authenticated insert" ON public.orders;
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
DROP POLICY IF EXISTS "Allow public insert" ON public.orders;
DROP POLICY IF EXISTS "Admin update and delete" ON public.orders;
DROP POLICY IF EXISTS "Enable insert for everyone" ON public.orders;
DROP POLICY IF EXISTS "Enable read for users based on user_id" ON public.orders;
DROP POLICY IF EXISTS "Enable full access for admin" ON public.orders;

-- Enable Row Level Security
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- 1. Allow everyone (both logged-out and logged-in users) to insert orders
CREATE POLICY "Enable insert for everyone" 
ON public.orders FOR INSERT 
TO anon, authenticated 
WITH CHECK (true);

-- 2. Allow users to read their own orders, and admin to read all orders
CREATE POLICY "Enable read for users based on user_id" 
ON public.orders FOR SELECT 
TO anon, authenticated
USING (auth.uid() = user_id OR user_id IS NULL OR (auth.jwt() ->> 'email') = 'yashkoparde2022@gmail.com');

-- 3. Admin full access for updates/deletes
CREATE POLICY "Enable full access for admin" 
ON public.orders FOR ALL 
TO authenticated
USING ((auth.jwt() ->> 'email') = 'yashkoparde2022@gmail.com');

-- ---------------------------------------------------------
-- 5. STORAGE POLICIES
-- ---------------------------------------------------------
-- These policies apply to the 'menu' bucket in Supabase storage
-- INSERT INTO storage.buckets (id, name, public) VALUES ('menu', 'menu', true);
-- CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'menu');
-- CREATE POLICY "Admin Upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'menu');
