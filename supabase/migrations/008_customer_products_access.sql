-- Add RLS policies for customers to view products
-- Allow anonymous users to view active products
CREATE POLICY "anon_view_active_products" ON products
FOR SELECT
TO anon
USING (active = true);

-- Allow authenticated users to view active products
CREATE POLICY "authenticated_view_active_products" ON products
FOR SELECT
TO authenticated
USING (active = true);

-- Keep existing staff policies for product management
-- (Assuming they exist and are more restrictive)
