-- ============================================================
-- Migration: Add is_confirmed column to profiles table & update trigger
-- Date: 2026-08-16
-- Description: Ensures user confirmation status is tracked in public.profiles
-- ============================================================

-- 1. Add is_confirmed column to public.profiles if not exists
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_confirmed BOOLEAN DEFAULT false NOT NULL;

-- 2. Ensure all existing admin profiles are confirmed
UPDATE public.profiles
SET is_confirmed = true
WHERE role = 'admin';

-- 3. Update the handle_new_user trigger function to persist is_confirmed
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role, avatar_url, is_confirmed)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        COALESCE(NEW.raw_user_meta_data->>'role', 'agent'),
        NEW.raw_user_meta_data->>'avatar_url',
        COALESCE((NEW.raw_user_meta_data->>'is_confirmed')::boolean, CASE WHEN NEW.raw_user_meta_data->>'role' = 'admin' THEN true ELSE false END)
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        is_confirmed = EXCLUDED.is_confirmed;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-create trigger safely
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
