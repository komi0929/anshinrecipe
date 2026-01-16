-- Schema Migration: Add Evidence and Menu Image Support
-- Part of the Audit Compliance Initiative

BEGIN;

-- 1. Add evidence_url column to menus table (stores the source URL where info was extracted)
ALTER TABLE menus ADD COLUMN IF NOT EXISTS evidence_url TEXT;

-- 2. Add source_image_url column to menus table (stores the original image URL from which data was extracted)
ALTER TABLE menus ADD COLUMN IF NOT EXISTS source_image_url TEXT;

-- 3. Add safe_from_allergens column (explicit list of allergens this menu is SAFE from)
ALTER TABLE menus ADD COLUMN IF NOT EXISTS safe_from_allergens TEXT[] DEFAULT '{}';

-- 4. Ensure image_url column exists on menus (for the display image)
ALTER TABLE menus ADD COLUMN IF NOT EXISTS image_url TEXT;

-- 5. Add child_status column if missing
ALTER TABLE menus ADD COLUMN IF NOT EXISTS child_status TEXT DEFAULT 'checking';

-- 6. Add child_details JSONB column if missing
ALTER TABLE menus ADD COLUMN IF NOT EXISTS child_details JSONB DEFAULT '{}';

-- 7. Add indexes for new columns
CREATE INDEX IF NOT EXISTS menus_evidence_url_idx ON menus (evidence_url) WHERE evidence_url IS NOT NULL;

-- 8. Add comments for documentation
COMMENT ON COLUMN menus.evidence_url IS 'URL of the source page where menu information was extracted (for traceability)';
COMMENT ON COLUMN menus.source_image_url IS 'URL of the original image analyzed by Vision AI (for traceability)';
COMMENT ON COLUMN menus.safe_from_allergens IS 'Array of allergens this menu is explicitly SAFE FROM (e.g. {小麦, 卵})';

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';

COMMIT;
