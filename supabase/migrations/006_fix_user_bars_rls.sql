-- Ensure user_bars table has proper RLS policies
ALTER TABLE user_bars ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "users_can_view_own_bars" ON user_bars;

-- Create policy to allow users to see their own bar associations
CREATE POLICY "users_can_view_own_bars" ON user_bars
FOR SELECT
USING (user_id = auth.uid());

-- Create policy to allow users to insert their own bar associations (if needed)
CREATE POLICY "users_can_insert_own_bars" ON user_bars
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Create policy to allow users to update their own bar associations (if needed)
CREATE POLICY "users_can_update_own_bars" ON user_bars
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());
