-- ==========================================
-- INITIAL SETUP & EXTENSIONS
-- ==========================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. ENUMERATIONS
-- ==========================================
CREATE TYPE public.user_role AS ENUM ('nasabah', 'kurir', 'admin');
CREATE TYPE public.ticket_status AS ENUM ('pending', 'scheduled', 'on_the_way', 'completed', 'cancelled');
CREATE TYPE public.withdrawal_status AS ENUM ('pending', 'processing', 'success', 'failed');
CREATE TYPE public.message_role AS ENUM ('user', 'assistant');

-- ==========================================
-- 2. TABLES (DDL)
-- ==========================================

-- A. Tabel profiles
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    phone_number VARCHAR(20),
    address TEXT,
    role public.user_role NOT NULL DEFAULT 'nasabah',
    balance DECIMAL(12, 2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- B. Tabel waste_categories
CREATE TABLE public.waste_categories (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    price_per_kg DECIMAL(10, 2) NOT NULL,
    carbon_factor DECIMAL(5, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- C. Tabel schedules
CREATE TABLE public.schedules (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    operational_date DATE NOT NULL UNIQUE,
    cut_off_time TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- D. Tabel tickets
CREATE TABLE public.tickets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    schedule_id BIGINT REFERENCES public.schedules(id) ON DELETE SET NULL,
    courier_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    status public.ticket_status NOT NULL DEFAULT 'pending',
    ai_image_url TEXT,
    ai_predicted_category VARCHAR(100),
    ai_estimated_price DECIMAL(10, 2),
    route_sequence INT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- E. Tabel transaction_details
CREATE TABLE public.transaction_details (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    ticket_id UUID REFERENCES public.tickets(id) ON DELETE CASCADE NOT NULL,
    waste_category_id BIGINT REFERENCES public.waste_categories(id) NOT NULL,
    weight DECIMAL(6, 2) NOT NULL,
    price_applied DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(12, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- F. Tabel withdrawals
CREATE TABLE public.withdrawals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    bank_name VARCHAR(50) NOT NULL,
    account_number VARCHAR(50) NOT NULL,
    midtrans_transaction_id VARCHAR(255),
    midtrans_status VARCHAR(50),
    status public.withdrawal_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- G. Tabel iot_devices
CREATE TABLE public.iot_devices (
    id VARCHAR(50) PRIMARY KEY,
    assigned_courier_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    is_online BOOLEAN DEFAULT FALSE,
    last_ping TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- H. Tabel chat_sessions
CREATE TABLE public.chat_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title VARCHAR(255) DEFAULT 'New Chat',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- I. Tabel chat_messages
CREATE TABLE public.chat_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES public.chat_sessions(id) ON DELETE CASCADE NOT NULL,
    role public.message_role NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 3. ENABLE ROW LEVEL SECURITY (RLS)
-- ==========================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waste_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.iot_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 4. RLS POLICIES
-- ==========================================

-- Helper function to check if user is admin (SECURITY DEFINER to bypass RLS and prevent infinite recursion)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- Profiles
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "Admins can update all profiles" ON public.profiles FOR UPDATE TO authenticated USING (public.is_admin());

-- Waste Categories
CREATE POLICY "Everyone can view waste categories" ON public.waste_categories FOR SELECT TO public USING (true);
CREATE POLICY "Admins can insert waste categories" ON public.waste_categories FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update waste categories" ON public.waste_categories FOR UPDATE TO authenticated USING (public.is_admin());
CREATE POLICY "Admins can delete waste categories" ON public.waste_categories FOR DELETE TO authenticated USING (public.is_admin());

-- Schedules
CREATE POLICY "Everyone can view active schedules" ON public.schedules FOR SELECT TO public USING (is_active = true OR public.is_admin());
CREATE POLICY "Admins can manage schedules" ON public.schedules FOR ALL TO authenticated USING (public.is_admin());

-- Tickets
CREATE POLICY "Clients can view own tickets" ON public.tickets FOR SELECT TO authenticated USING (auth.uid() = client_id);
CREATE POLICY "Couriers can view assigned tickets" ON public.tickets FOR SELECT TO authenticated USING (auth.uid() = courier_id);
CREATE POLICY "Admins can view all tickets" ON public.tickets FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "Clients can create tickets" ON public.tickets FOR INSERT TO authenticated WITH CHECK (auth.uid() = client_id);
CREATE POLICY "Couriers can update ticket status" ON public.tickets FOR UPDATE TO authenticated USING (auth.uid() = courier_id);
CREATE POLICY "Admins can manage tickets" ON public.tickets FOR ALL TO authenticated USING (public.is_admin());

-- Transaction Details
CREATE POLICY "Users can view own transaction details" ON public.transaction_details FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.tickets t 
    WHERE t.id = transaction_details.ticket_id 
    AND (t.client_id = auth.uid() OR t.courier_id = auth.uid() OR public.is_admin())
  )
);
CREATE POLICY "Couriers can insert transaction details" ON public.transaction_details FOR INSERT TO authenticated WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.tickets t 
    WHERE t.id = transaction_details.ticket_id AND t.courier_id = auth.uid()
  )
);
CREATE POLICY "Admins can manage transaction details" ON public.transaction_details FOR ALL TO authenticated USING (public.is_admin());

-- Withdrawals
CREATE POLICY "Users can view own withdrawals" ON public.withdrawals FOR SELECT TO authenticated USING (auth.uid() = client_id);
CREATE POLICY "Users can request withdrawals" ON public.withdrawals FOR INSERT TO authenticated WITH CHECK (auth.uid() = client_id);
CREATE POLICY "Admins can manage withdrawals" ON public.withdrawals FOR ALL TO authenticated USING (public.is_admin());

-- IoT Devices
CREATE POLICY "Couriers can view assigned devices" ON public.iot_devices FOR SELECT TO authenticated USING (auth.uid() = assigned_courier_id);
CREATE POLICY "Admins can manage iot devices" ON public.iot_devices FOR ALL TO authenticated USING (public.is_admin());

-- Chat Sessions
CREATE POLICY "Users can view own chat sessions" ON public.chat_sessions FOR SELECT TO authenticated USING (auth.uid() = profile_id);
CREATE POLICY "Users can manage own chat sessions" ON public.chat_sessions FOR ALL TO authenticated USING (auth.uid() = profile_id);

-- Chat Messages
CREATE POLICY "Users can view own chat messages" ON public.chat_messages FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.chat_sessions s 
    WHERE s.id = chat_messages.session_id AND s.profile_id = auth.uid()
  )
);
CREATE POLICY "Users can insert own chat messages" ON public.chat_messages FOR INSERT TO authenticated WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.chat_sessions s 
    WHERE s.id = chat_messages.session_id AND s.profile_id = auth.uid()
  )
);

-- ==========================================
-- 5. FUNCTIONS & TRIGGERS
-- ==========================================

-- Auto-Create Profile Trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email, 'Nasabah'),
    'nasabah'
  );
  RETURN NEW;
END;
$$;

-- Note: Ensure we don't duplicate triggers if script is run multiple times
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-Update Balance Trigger
CREATE OR REPLACE FUNCTION public.handle_ticket_completed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total_subtotal DECIMAL(12, 2);
BEGIN
  -- Only execute when status changes to 'completed'
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    -- Calculate total from transaction_details
    SELECT COALESCE(SUM(subtotal), 0) INTO total_subtotal 
    FROM public.transaction_details 
    WHERE ticket_id = NEW.id;

    -- Update balance
    UPDATE public.profiles 
    SET balance = balance + total_subtotal 
    WHERE id = NEW.client_id;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_ticket_status_completed ON public.tickets;
CREATE TRIGGER on_ticket_status_completed
  AFTER UPDATE OF status ON public.tickets
  FOR EACH ROW EXECUTE FUNCTION public.handle_ticket_completed();

-- ==========================================
-- 6. STORAGE SETUP
-- ==========================================

-- Insert bucket for public assets (if not exists)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('public-assets', 'public-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies
-- Drop existing to avoid conflict if run multiple times
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT 
TO public
USING (bucket_id = 'public-assets');

DROP POLICY IF EXISTS "Authenticated users can upload assets" ON storage.objects;
CREATE POLICY "Authenticated users can upload assets" 
ON storage.objects FOR INSERT 
TO authenticated
WITH CHECK (bucket_id = 'public-assets');
