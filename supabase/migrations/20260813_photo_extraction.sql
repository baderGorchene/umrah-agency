-- ============================================================
-- Photo extraction jobs for passport photo auto-crop
-- ============================================================

-- 1. Create enum for extraction status
DO $$ BEGIN
    CREATE TYPE public.photo_extraction_status AS ENUM ('pending','processing','done','failed','manual_review');
EXCEPTION WHEN duplicate_object THEN NULL; END$$;

-- 2. Table to track photo extraction jobs and results
CREATE TABLE IF NOT EXISTS public.pilgrim_photo_extractions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pilgrim_id UUID REFERENCES public.pilgrims(id) ON DELETE SET NULL,
    document_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
    original_bucket TEXT NOT NULL,
    original_path TEXT NOT NULL,
    crop_bucket TEXT,
    crop_path TEXT,
    bbox JSONB, -- { x, y, width, height } in page-coordinates of the warped/normalized page
    confidence NUMERIC,
    status public.photo_extraction_status DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_photo_extractions_pilgrim ON public.pilgrim_photo_extractions(pilgrim_id);
CREATE INDEX IF NOT EXISTS idx_photo_extractions_status ON public.pilgrim_photo_extractions(status);

-- 3. Trigger to keep updated_at current
CREATE OR REPLACE FUNCTION public.update_photo_extractions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_photo_extractions_updated_at ON public.pilgrim_photo_extractions;
CREATE TRIGGER trg_photo_extractions_updated_at
BEFORE UPDATE ON public.pilgrim_photo_extractions
FOR EACH ROW EXECUTE FUNCTION public.update_photo_extractions_updated_at();

-- 4. Grant minimal privileges to authenticated role (adjust as needed)
GRANT SELECT, INSERT, UPDATE ON public.pilgrim_photo_extractions TO authenticated;

-- 5. RLS: enable (policies should be created by maintainers based on app needs)
ALTER TABLE public.pilgrim_photo_extractions ENABLE ROW LEVEL SECURITY;

-- Default permissive policy for now (adjust later for production)
CREATE POLICY "Allow full access on pilgrim_photo_extractions" ON public.pilgrim_photo_extractions FOR ALL USING (true);
