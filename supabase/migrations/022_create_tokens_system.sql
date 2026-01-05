-- ============================================
-- TABEZA TOKENS SYSTEM
-- ============================================

-- 1. Token Balances Table
CREATE TABLE IF NOT EXISTS public.token_balances (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  balance INTEGER NOT NULL DEFAULT 0 CHECK (balance >= 0),
  lifetime_earned INTEGER NOT NULL DEFAULT 0,
  lifetime_redeemed INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Token Transactions Table
CREATE TABLE IF NOT EXISTS public.token_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL, -- positive for earning, negative for redemption
  type TEXT NOT NULL CHECK (type IN (
    'first_connect',
    'order_completed', 
    'referral_sender',
    'referral_receiver',
    'redemption',
    'adjustment' -- admin adjustments
  )),
  venue_id UUID REFERENCES public.bars(id) ON DELETE SET NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  redemption_id UUID REFERENCES public.redemptions(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}'::jsonb, -- for storing order value, multiplier, etc
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Monthly Order Counts (for frequency tracking)
CREATE TABLE IF NOT EXISTS public.monthly_order_counts (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  venue_id UUID NOT NULL REFERENCES public.bars(id) ON DELETE CASCADE,
  year_month TEXT NOT NULL, -- format: '2025-01'
  order_count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, venue_id, year_month)
);

-- 4. User Referrals
CREATE TABLE IF NOT EXISTS public.user_referrals (
  referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  PRIMARY KEY (referrer_id, referee_id)
);

-- Add referral code to users (use existing users table or profiles)
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;

-- 5. Rewards Catalog
CREATE TABLE IF NOT EXISTS public.rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_type TEXT NOT NULL CHECK (provider_type IN ('venue', 'supplier')),
  provider_id UUID, -- venue_id or supplier_id
  provider_name TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  token_cost INTEGER NOT NULL CHECK (token_cost > 0),
  terms TEXT, -- redemption terms
  image_url TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'expired')),
  max_redemptions INTEGER, -- null = unlimited
  current_redemptions INTEGER NOT NULL DEFAULT 0,
  valid_from TIMESTAMPTZ,
  valid_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Redemptions Table
CREATE TABLE IF NOT EXISTS public.redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reward_id UUID NOT NULL REFERENCES public.rewards(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE, -- redemption code shown to user
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'redeemed', 'expired', 'cancelled')),
  redeemed_at TIMESTAMPTZ,
  redeemed_by_venue_id UUID REFERENCES public.bars(id) ON DELETE SET NULL,
  redeemed_by_staff_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ -- auto-expire after 30 days
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_token_transactions_user_id ON public.token_transactions(user_id);
CREATE INDEX idx_token_transactions_created_at ON public.token_transactions(created_at DESC);
CREATE INDEX idx_token_transactions_type ON public.token_transactions(type);
CREATE INDEX idx_monthly_order_counts_lookup ON public.monthly_order_counts(user_id, venue_id, year_month);
CREATE INDEX idx_redemptions_user_id ON public.redemptions(user_id);
CREATE INDEX idx_redemptions_code ON public.redemptions(code);
CREATE INDEX idx_redemptions_status ON public.redemptions(status);
CREATE INDEX idx_rewards_status ON public.rewards(status);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE public.token_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.token_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_order_counts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.redemptions ENABLE ROW LEVEL SECURITY;

-- Token Balances Policies
CREATE POLICY "Users can view own token balance"
  ON public.token_balances FOR SELECT
  USING (auth.uid() = user_id);

-- Token Transactions Policies  
CREATE POLICY "Users can view own transactions"
  ON public.token_transactions FOR SELECT
  USING (auth.uid() = user_id);

-- Monthly Order Counts Policies
CREATE POLICY "Users can view own order counts"
  ON public.monthly_order_counts FOR SELECT
  USING (auth.uid() = user_id);

-- User Referrals Policies
CREATE POLICY "Users can view referrals they're involved in"
  ON public.user_referrals FOR SELECT
  USING (auth.uid() = referrer_id OR auth.uid() = referee_id);

-- Rewards Policies (public read for active rewards)
CREATE POLICY "Anyone can view active rewards"
  ON public.rewards FOR SELECT
  USING (status = 'active');

-- Redemptions Policies
CREATE POLICY "Users can view own redemptions"
  ON public.redemptions FOR SELECT
  USING (auth.uid() = user_id);

-- Staff policies (add role check from your existing system)
CREATE POLICY "Staff can view all redemptions"
  ON public.redemptions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_bars 
      WHERE user_id = auth.uid()
    )
  );

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function: Get or create token balance
CREATE OR REPLACE FUNCTION public.get_or_create_token_balance(p_user_id UUID)
RETURNS public.token_balances
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_balance public.token_balances;
BEGIN
  SELECT * INTO v_balance
  FROM public.token_balances
  WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN
    INSERT INTO public.token_balances (user_id, balance)
    VALUES (p_user_id, 0)
    RETURNING * INTO v_balance;
  END IF;
  
  RETURN v_balance;
END;
$$;

-- Function: Award tokens
CREATE OR REPLACE FUNCTION public.award_tokens(
  p_user_id UUID,
  p_amount INTEGER,
  p_type TEXT,
  p_venue_id UUID DEFAULT NULL,
  p_order_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb,
  p_description TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_transaction_id UUID;
  v_balance RECORD;
BEGIN
  -- Ensure balance record exists
  PERFORM public.get_or_create_token_balance(p_user_id);
  
  -- Insert transaction
  INSERT INTO public.token_transactions (
    user_id, amount, type, venue_id, order_id, metadata, description
  )
  VALUES (
    p_user_id, p_amount, p_type, p_venue_id, p_order_id, p_metadata, p_description
  )
  RETURNING id INTO v_transaction_id;
  
  -- Update balance
  UPDATE public.token_balances
  SET 
    balance = balance + p_amount,
    lifetime_earned = lifetime_earned + p_amount,
    updated_at = NOW()
  WHERE user_id = p_user_id;
  
  RETURN v_transaction_id;
END;
$$;

-- Function: Calculate order tokens (frequency-based algorithm)
CREATE OR REPLACE FUNCTION public.calculate_order_tokens(
  p_user_id UUID,
  p_venue_id UUID,
  p_order_value NUMERIC,
  p_order_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_base_tokens INTEGER := 10;
  v_value_bonus INTEGER := 0;
  v_frequency_multiplier NUMERIC := 1.0;
  v_order_count INTEGER;
  v_year_month TEXT;
  v_total_tokens INTEGER;
BEGIN
  -- Get year-month
  v_year_month := TO_CHAR(p_order_date, 'YYYY-MM');
  
  -- Get current order count for this month
  SELECT COALESCE(order_count, 0) INTO v_order_count
  FROM public.monthly_order_counts
  WHERE user_id = p_user_id 
    AND venue_id = p_venue_id 
    AND year_month = v_year_month;
  
  -- Calculate value bonus
  IF p_order_value >= 10000 THEN
    v_value_bonus := 50;
  ELSIF p_order_value >= 5000 THEN
    v_value_bonus := 30;
  ELSIF p_order_value >= 2500 THEN
    v_value_bonus := 20;
  ELSIF p_order_value >= 1000 THEN
    v_value_bonus := 10;
  ELSIF p_order_value >= 500 THEN
    v_value_bonus := 5;
  END IF;
  
  -- Calculate frequency multiplier based on CURRENT count (before increment)
  IF v_order_count >= 20 THEN
    v_frequency_multiplier := 2.0;
  ELSIF v_order_count >= 10 THEN
    v_frequency_multiplier := 1.8;
  ELSIF v_order_count >= 5 THEN
    v_frequency_multiplier := 1.5;
  ELSIF v_order_count >= 2 THEN
    v_frequency_multiplier := 1.2;
  END IF;
  
  -- Calculate total tokens
  v_total_tokens := FLOOR((v_base_tokens + v_value_bonus) * v_frequency_multiplier);
  
  RETURN v_total_tokens;
END;
$$;

-- Function: Increment monthly order count
CREATE OR REPLACE FUNCTION public.increment_monthly_order_count(
  p_user_id UUID,
  p_venue_id UUID,
  p_order_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_year_month TEXT;
  v_new_count INTEGER;
BEGIN
  v_year_month := TO_CHAR(p_order_date, 'YYYY-MM');
  
  INSERT INTO public.monthly_order_counts (user_id, venue_id, year_month, order_count)
  VALUES (p_user_id, p_venue_id, v_year_month, 1)
  ON CONFLICT (user_id, venue_id, year_month)
  DO UPDATE SET order_count = monthly_order_counts.order_count + 1
  RETURNING order_count INTO v_new_count;
  
  RETURN v_new_count;
END;
$$;

-- Function: Generate unique redemption code
CREATE OR REPLACE FUNCTION public.generate_redemption_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_code TEXT;
  v_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate format: TBZA-XXXXXX (6 random alphanumeric)
    v_code := 'TBZA-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6));
    
    -- Check if exists
    SELECT EXISTS(SELECT 1 FROM public.redemptions WHERE code = v_code) INTO v_exists;
    
    EXIT WHEN NOT v_exists;
  END LOOP;
  
  RETURN v_code;
END;
$$;

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_token_balances_updated_at
  BEFORE UPDATE ON public.token_balances
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_rewards_updated_at
  BEFORE UPDATE ON public.rewards
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- ============================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================

-- Insert sample rewards
INSERT INTO public.rewards (provider_type, provider_name, title, description, token_cost, status)
VALUES 
  ('supplier', 'Tusker', 'Free Tusker Beer', 'Redeem for one free Tusker beer at any Tabeza venue', 100, 'active'),
  ('supplier', 'Coca-Cola', 'Free Coke', 'Redeem for one free Coca-Cola at any Tabeza venue', 50, 'active'),
  ('venue', 'Generic', '10% Off Bill', 'Get 10% off your total bill', 150, 'active'),
  ('venue', 'Generic', 'Free Appetizer', 'Get any appetizer free with your order', 80, 'active');

COMMENT ON TABLE public.token_balances IS 'Stores user token balances';
COMMENT ON TABLE public.token_transactions IS 'Records all token earning and spending transactions';
COMMENT ON TABLE public.monthly_order_counts IS 'Tracks order frequency for multiplier calculation';
COMMENT ON TABLE public.user_referrals IS 'Tracks referral relationships between users';
COMMENT ON TABLE public.rewards IS 'Catalog of rewards users can redeem with tokens';
COMMENT ON TABLE public.redemptions IS 'Records of reward redemptions';
