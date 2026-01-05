-- Create menu-files bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('menu-files', 'menu-files', true)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies for the bucket
CREATE POLICY "Anyone can view menu files" ON storage.objects
FOR SELECT USING (bucket_id = 'menu-files');

CREATE POLICY "Authenticated users can upload menu files" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'menu-files' AND 
  auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can update menu files" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'menu-files' AND 
  auth.role() = 'authenticated'
);

CREATE POLICY "Service role can manage all menu files" ON storage.objects
FOR ALL USING (
  bucket_id = 'menu-files'
) WITH CHECK (
  bucket_id = 'menu-files'
);
