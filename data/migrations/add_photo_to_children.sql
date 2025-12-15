-- Add photo column to children table
ALTER TABLE children ADD COLUMN IF NOT EXISTS photo TEXT;

-- Add comment
COMMENT ON COLUMN children.photo IS 'Base64 encoded photo or URL to photo';
