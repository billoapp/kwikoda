-- Advanced Supabase Storage Testing
-- Run these queries one by one in Supabase SQL Editor

-- 1. Check if storage extension is enabled
SELECT * FROM pg_extension WHERE extname = 'storage';

-- 2. Verify storage schema exists
SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'storage';

-- 3. Check storage.buckets table structure
\d storage.buckets;

-- 4. Check storage.objects table structure  
\d storage.objects;

-- 5. Test creating a simple object (this will test if storage is working)
-- Note: This might fail if permissions are wrong, which helps us diagnose
INSERT INTO storage.objects (
  bucket_id,
  name,
  owner,
  created_at,
  updated_at,
  last_accessed_at,
  metadata
) VALUES (
  'menu-files',
  'test-sql-upload.txt',
  auth.uid(),
  NOW(),
  NOW(),
  NOW(),
  '{"size": 100, "mimetype": "text/plain"}'::jsonb
);

-- 6. Check if the test object was created
SELECT * FROM storage.objects WHERE name = 'test-sql-upload.txt';

-- 7. Clean up test object
DELETE FROM storage.objects WHERE name = 'test-sql-upload.txt';

-- 8. Check RLS policies on storage.objects
SELECT 
  schemaname,
  tablename, 
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'storage' AND tablename = 'objects';

-- 9. Test if current user has proper permissions
SELECT 
  auth.role() as current_role,
  auth.uid() as current_user_id,
  current_user as postgres_user;