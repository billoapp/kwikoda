-- Add RLS policies for customers to view bar products
-- Allow anonymous users to view active bar products
CREATE POLICY "anon_view_active_bar_products" ON bar_products
FOR SELECT
TO anon
USING (active = true);

-- Allow authenticated users to view active bar products
CREATE POLICY "authenticated_view_active_bar_products" ON bar_products
FOR SELECT
TO authenticated
USING (active = true);

-- Keep existing bar isolation policy for INSERT/UPDATE/DELETE operations
DROP POLICY IF EXISTS bar_products_isolation ON bar_products;

CREATE POLICY bar_products_isolation ON bar_products
    FOR INSERT WITH CHECK (bar_id = current_setting('app.current_bar_id', true)::uuid);

CREATE POLICY bar_products_isolation_update ON bar_products
    FOR UPDATE USING (bar_id = current_setting('app.current_bar_id', true)::uuid)
    WITH CHECK (bar_id = current_setting('app.current_bar_id', true)::uuid);

CREATE POLICY bar_products_isolation_delete ON bar_products
    FOR DELETE USING (bar_id = current_setting('app.current_bar_id', true)::uuid);
