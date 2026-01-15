-- Create the 'recipe-images' bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('recipe-images', 'recipe-images', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: Public Access
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'recipe-images' );

-- Policy: Authenticated Users Upload
DROP POLICY IF EXISTS "Authenticated Users Upload" ON storage.objects;
CREATE POLICY "Authenticated Users Upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'recipe-images' AND
  auth.role() = 'authenticated'
);

-- Policy: Users Check (Optional for robustness)
DROP POLICY IF EXISTS "Users Update Own Images" ON storage.objects;
CREATE POLICY "Users Update Own Images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'recipe-images' AND
  auth.uid() = owner
);

DROP POLICY IF EXISTS "Users Delete Own Images" ON storage.objects;
CREATE POLICY "Users Delete Own Images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'recipe-images' AND
  auth.uid() = owner
);
