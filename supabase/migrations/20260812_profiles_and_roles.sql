-- ============================================================
-- Umrah Compagnon (مسك طيبة للعمرة) - Profiles & Roles Schema (RBAC)
-- ============================================================

-- 1. Create Profiles Table (user identity and role management)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    role TEXT CHECK (role IN ('admin', 'agent', 'pilgrim')) NOT NULL DEFAULT 'agent',
    avatar_url TEXT,
    phone TEXT,
    trip_id UUID REFERENCES public.trips(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Index for profile lookup performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 4. Policies for profiles table
CREATE POLICY "Allow read profiles for authenticated users" 
    ON public.profiles FOR SELECT 
    USING (auth.role() = 'authenticated' OR auth.role() = 'anon');

CREATE POLICY "Allow users to update own profile or admin to update any" 
    ON public.profiles FOR UPDATE 
    USING (
        auth.uid() = id OR 
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Allow service role or user insert profile" 
    ON public.profiles FOR INSERT 
    WITH CHECK (true);

CREATE POLICY "Allow delete on profiles" 
    ON public.profiles FOR DELETE 
    USING (role <> 'admin');

-- 5. Trigger to automatically populate profiles table upon user sign-up in auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        COALESCE(NEW.raw_user_meta_data->>'role', 'agent'),
        NEW.raw_user_meta_data->>'avatar_url'
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-create trigger safely
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. RPC Function to completely delete a user (both auth.users and public.profiles)
CREATE OR REPLACE FUNCTION public.delete_user_by_admin(target_user_id UUID)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    target_role TEXT;
BEGIN
    -- Check role of user to prevent deleting admin
    SELECT role INTO target_role FROM public.profiles WHERE id = target_user_id;

    IF target_role = 'admin' THEN
        RAISE EXCEPTION 'Cannot delete admin account.';
    END IF;

    -- Delete from public.profiles
    DELETE FROM public.profiles WHERE id = target_user_id;

    -- Delete from auth.users (cascades to profiles if not already deleted)
    BEGIN
        DELETE FROM auth.users WHERE id = target_user_id;
    EXCEPTION
        WHEN OTHERS THEN
            NULL;
    END;

    RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_user_by_admin(UUID) TO authenticated, anon;

