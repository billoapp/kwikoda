-- ROLLBACK SCRIPT (only run if something breaks)
-- This will remove all token system tables and functions
-- Use only if the token system causes issues in production

BEGIN;

-- Drop new tables (in reverse order of creation due to dependencies)
DROP TABLE IF EXISTS public.redemptions CASCADE;
DROP TABLE IF EXISTS public.rewards CASCADE;
DROP TABLE IF EXISTS public.user_referrals CASCADE;
DROP TABLE IF EXISTS public.monthly_order_counts CASCADE;
DROP TABLE IF EXISTS public.token_transactions CASCADE;
DROP TABLE IF EXISTS public.token_balances CASCADE;
DROP TABLE IF EXISTS public.user_profiles CASCADE;

-- Drop new functions
DROP FUNCTION IF EXISTS public.generate_redemption_code();
DROP FUNCTION IF EXISTS public.increment_monthly_order_count(UUID, UUID, TIMESTAMPTZ);
DROP FUNCTION IF EXISTS public.calculate_order_tokens(UUID, UUID, NUMERIC, TIMESTAMPTZ);
DROP FUNCTION IF EXISTS public.award_tokens(UUID, INTEGER, TEXT, UUID, UUID, JSONB, TEXT);
DROP FUNCTION IF EXISTS public.get_or_create_token_balance(UUID);

COMMIT;

-- Note: We don't drop the referral_code column from auth.users
-- because we used a separate user_profiles table instead
