-- ============================================================
-- Migration: Add paid_amount and unpaid_amount to pilgrims table
-- Date: 2026-08-15
-- Description: Adds payment tracking columns (Montant Payé & Montant non Payé)
-- ============================================================

-- 1. Add paid_amount column if not exists
ALTER TABLE public.pilgrims 
ADD COLUMN IF NOT EXISTS paid_amount NUMERIC(10, 2) DEFAULT 0 NOT NULL;

-- 2. Add unpaid_amount column if not exists
ALTER TABLE public.pilgrims 
ADD COLUMN IF NOT EXISTS unpaid_amount NUMERIC(10, 2) DEFAULT 0 NOT NULL;

-- 3. Comments on columns
COMMENT ON COLUMN public.pilgrims.paid_amount IS 'Montant payé par le pèlerin en TND (المبلغ المدفوع)';
COMMENT ON COLUMN public.pilgrims.unpaid_amount IS 'Montant restant/non payé par le pèlerin en TND (المبلغ غير المدفوع)';
