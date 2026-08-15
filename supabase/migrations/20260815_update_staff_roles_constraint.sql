-- ==========================================================
-- Migration: Update Staff Roles Check Constraint to 3 Roles
-- Allowed roles: 'رئيس مجموعة', 'شيخ', 'مرافق(ة)'
-- ==========================================================

-- 1. Drop the legacy check constraint
ALTER TABLE public.staff 
  DROP CONSTRAINT IF EXISTS staff_role_check;

-- 2. Migrate existing staff records to the new standard 3 roles
UPDATE public.staff
  SET role = 'رئيس مجموعة'
  WHERE role IN ('Chef de Bus', 'Coordonnateur Administratif', 'chef_de_bus', 'group_leader');

UPDATE public.staff
  SET role = 'شيخ'
  WHERE role IN ('Guide Spirituel', 'guide_spirituel', 'sheikh');

UPDATE public.staff
  SET role = 'مرافق(ة)'
  WHERE role IN ('Responsable Médical', 'guide', 'medical', 'مرافق');

-- 3. Fallback any remaining unmapped values to 'مرافق(ة)'
UPDATE public.staff
  SET role = 'مرافق(ة)'
  WHERE role NOT IN ('رئيس مجموعة', 'شيخ', 'مرافق(ة)');

-- 4. Apply the new check constraint
ALTER TABLE public.staff
  ADD CONSTRAINT staff_role_check
  CHECK (role IN ('رئيس مجموعة', 'شيخ', 'مرافق(ة)'));
