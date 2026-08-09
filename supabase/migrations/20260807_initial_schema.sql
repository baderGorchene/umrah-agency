-- ============================================================
-- Umrah Compagnon (مسك طيبة للعمرة) - Initial Supabase Schema
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Agency Settings Table
CREATE TABLE IF NOT EXISTS public.agency_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL DEFAULT 'مسك طيبة للعمرة',
    subtitle TEXT DEFAULT 'Umrah Compagnon',
    description TEXT,
    banner_url TEXT,
    logo_url TEXT,
    address TEXT,
    city TEXT,
    country TEXT DEFAULT 'تونس',
    phone TEXT,
    email TEXT,
    license_number TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Trips Table
CREATE TABLE IF NOT EXISTS public.trips (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    makkah_hotel TEXT,
    madinah_hotel TEXT,
    bus_count INT DEFAULT 1,
    flight_details TEXT,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Pilgrims Table (معتمرين)
CREATE TABLE IF NOT EXISTS public.pilgrims (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id UUID REFERENCES public.trips(id) ON DELETE SET NULL,
    name_arabic TEXT NOT NULL,
    name_latin TEXT,
    phone TEXT,
    unique_code TEXT UNIQUE NOT NULL,
    status TEXT CHECK (status IN ('مؤكد', 'في الانتظار', 'ملغى')) DEFAULT 'في الانتظار',
    passport_number TEXT,
    avatar_url TEXT,
    emergency_contact TEXT,
    gender TEXT CHECK (gender IN ('M', 'F')),
    birth_date DATE,
    passport_issue_date DATE,
    passport_expiry_date DATE,
    cin_number TEXT,
    mrz1 TEXT,
    mrz2 TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Staff Table (مرافقين)
CREATE TABLE IF NOT EXISTS public.staff (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id UUID REFERENCES public.trips(id) ON DELETE SET NULL,
    name_arabic TEXT NOT NULL,
    name_latin TEXT,
    phone TEXT,
    whatsapp TEXT,
    role TEXT CHECK (role IN ('Chef de Bus', 'Coordonnateur Administratif', 'Guide Spirituel', 'Responsable Médical')) NOT NULL,
    unique_code TEXT UNIQUE NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Posts Table (Announcements / News)
CREATE TABLE IF NOT EXISTS public.posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    image_url TEXT,
    notify_push BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT CHECK (type IN ('sos', 'info', 'document', 'trip')) DEFAULT 'info',
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Documents Table (Passport Scans & Attachments)
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pilgrim_id UUID REFERENCES public.pilgrims(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_url TEXT,
    mime_type TEXT,
    ocr_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexing for high performance
CREATE INDEX IF NOT EXISTS idx_pilgrims_trip ON public.pilgrims(trip_id);
CREATE INDEX IF NOT EXISTS idx_pilgrims_code ON public.pilgrims(unique_code);
CREATE INDEX IF NOT EXISTS idx_staff_trip ON public.staff(trip_id);
CREATE INDEX IF NOT EXISTS idx_posts_trip ON public.posts(trip_id);

-- Enable RLS (Row Level Security)
ALTER TABLE public.agency_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pilgrims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Permissive RLS policies for agency operators
CREATE POLICY "Allow public select on agency_settings" ON public.agency_settings FOR SELECT USING (true);
CREATE POLICY "Allow authenticated update on agency_settings" ON public.agency_settings FOR ALL USING (true);

CREATE POLICY "Allow full access on trips" ON public.trips FOR ALL USING (true);
CREATE POLICY "Allow full access on pilgrims" ON public.pilgrims FOR ALL USING (true);
CREATE POLICY "Allow full access on staff" ON public.staff FOR ALL USING (true);
CREATE POLICY "Allow full access on posts" ON public.posts FOR ALL USING (true);
CREATE POLICY "Allow full access on notifications" ON public.notifications FOR ALL USING (true);
CREATE POLICY "Allow full access on documents" ON public.documents FOR ALL USING (true);
