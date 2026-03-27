-- 1. Create the bucket for campaign portraits
INSERT INTO storage.buckets (id, name, public)
VALUES ('campaign-portrait', 'campaign-portrait', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Policy: Anyone can view campaign portraits (Public read)
CREATE POLICY "Portraits are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'campaign-portrait');

-- 3. Policy: Authenticated users can upload portraits
-- We allow any authenticated user to upload, but we'll use folder structures (user_id/) 
-- to manage ownership via the next policies.
CREATE POLICY "Authenticated users can upload portraits"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'campaign-portrait');

-- 4. Policy: Users can update their own portraits
CREATE POLICY "Users can update their own portraits"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'campaign-portrait' AND (storage.foldername(name))[1] = auth.uid()::text);

-- 5. Policy: Users can delete their own portraits
CREATE POLICY "Users can delete their own portraits"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'campaign-portrait' AND (storage.foldername(name))[1] = auth.uid()::text);
