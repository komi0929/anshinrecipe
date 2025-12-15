-- Create the 'recipe-images' bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('recipe-images', 'recipe-images', true)
ON CONFLICT (id) DO NOTHING;

-- Policy to allow public access to view images
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'recipe-images' );

-- Policy to allow authenticated users to upload images
CREATE POLICY "Authenticated Users Upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'recipe-images' AND
  auth.role() = 'authenticated'
);

-- Policy to allow users to update their own images (optional, if needed)
CREATE POLICY "Users Update Own Images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'recipe-images' AND
  auth.uid() = owner
);

-- Policy to allow users to delete their own images
CREATE POLICY "Users Delete Own Images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'recipe-images' AND
  auth.uid() = owner
);
