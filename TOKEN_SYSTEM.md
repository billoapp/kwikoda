
# Tabeza Tokens System - Implementation Guide

## Project Context
- **Monorepo structure**: Customer app + Staff app
- **Tech stack**: Next.js, Supabase, TypeScript
- **Branch**: Created for tokens implementation
- **Goal**: Add tokens system with smart frequency-based rewards

---

## Phase 1: Database Setup (Day 1)

### 1.1 Create Migration File

**File**: `supabase/migrations/022_create_tokens_system.sql`

```sql
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
```

### 1.2 Run Migration

```bash
# From project root
npx supabase db push

# Or if using Supabase CLI
supabase migration up
```

---

## Phase 2: Shared Types & Utils (Day 1-2)

### 2.1 Update Shared Types

**File**: `packages/shared/types.ts`

```typescript
// Add to existing types

export interface TokenBalance {
  user_id: string;
  balance: number;
  lifetime_earned: number;
  lifetime_redeemed: number;
  created_at: string;
  updated_at: string;
}

export interface TokenTransaction {
  id: string;
  user_id: string;
  amount: number;
  type: 'first_connect' | 'order_completed' | 'referral_sender' | 'referral_receiver' | 'redemption' | 'adjustment';
  venue_id?: string;
  order_id?: string;
  redemption_id?: string;
  metadata?: {
    order_value?: number;
    multiplier?: number;
    order_count?: number;
    [key: string]: any;
  };
  description?: string;
  created_at: string;
}

export interface MonthlyOrderCount {
  user_id: string;
  venue_id: string;
  year_month: string;
  order_count: number;
}

export interface UserReferral {
  referrer_id: string;
  referee_id: string;
  status: 'pending' | 'completed';
  created_at: string;
  completed_at?: string;
}

export interface Reward {
  id: string;
  provider_type: 'venue' | 'supplier';
  provider_id?: string;
  provider_name: string;
  title: string;
  description?: string;
  token_cost: number;
  terms?: string;
  image_url?: string;
  status: 'active' | 'inactive' | 'expired';
  max_redemptions?: number;
  current_redemptions: number;
  valid_from?: string;
  valid_until?: string;
  created_at: string;
  updated_at: string;
}

export interface Redemption {
  id: string;
  user_id: string;
  reward_id: string;
  code: string;
  status: 'pending' | 'redeemed' | 'expired' | 'cancelled';
  redeemed_at?: string;
  redeemed_by_venue_id?: string;
  redeemed_by_staff_id?: string;
  created_at: string;
  expires_at?: string;
  // Joined data
  reward?: Reward;
}

export interface TokensConfig {
  BASE_TOKENS: number;
  VALUE_TIERS: { min: number; bonus: number }[];
  FREQUENCY_MULTIPLIERS: { minOrders: number; multiplier: number }[];
  FIRST_CONNECT_TOKENS: number;
  REFERRAL_TOKENS: number;
}
```

### 2.2 Create Tokens Service

**File**: `packages/shared/tokens-service.ts`

```typescript
import { SupabaseClient } from '@supabase/supabase-js';
import type { TokenTransaction, TokenBalance, Redemption, Reward } from './types';

export const TOKENS_CONFIG = {
  BASE_TOKENS: 10,
  VALUE_TIERS: [
    { min: 10000, bonus: 50 },
    { min: 5000, bonus: 30 },
    { min: 2500, bonus: 20 },
    { min: 1000, bonus: 10 },
    { min: 500, bonus: 5 },
  ],
  FREQUENCY_MULTIPLIERS: [
    { minOrders: 20, multiplier: 2.0 },
    { minOrders: 10, multiplier: 1.8 },
    { minOrders: 5, multiplier: 1.5 },
    { minOrders: 2, multiplier: 1.2 },
  ],
  FIRST_CONNECT_TOKENS: 50,
  REFERRAL_TOKENS: 50,
};

export class TokensService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Get user's token balance
   */
  async getBalance(userId: string): Promise<TokenBalance | null> {
    const { data, error } = await this.supabase
      .from('token_balances')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching token balance:', error);
      return null;
    }

    return data;
  }

  /**
   * Get user's transaction history
   */
  async getTransactions(
    userId: string,
    limit: number = 20
  ): Promise<TokenTransaction[]> {
    const { data, error } = await this.supabase
      .from('token_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching transactions:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Award tokens for first-time venue connection
   */
  async awardFirstConnectionTokens(
    userId: string,
    venueId: string
  ): Promise<boolean> {
    try {
      // Check if already connected before
      const { count } = await this.supabase
        .from('tabs')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('bar_id', venueId);

      // Only award if first connection
      if (count && count > 1) {
        return false;
      }

      // Award tokens
      const { error } = await this.supabase.rpc('award_tokens', {
        p_user_id: userId,
        p_amount: TOKENS_CONFIG.FIRST_CONNECT_TOKENS,
        p_type: 'first_connect',
        p_venue_id: venueId,
        p_description: 'First connection to venue',
      });

      return !error;
    } catch (error) {
      console.error('Error awarding first connection tokens:', error);
      return false;
    }
  }

  /**
   * Award tokens for completed order (with frequency algorithm)
   */
  async awardOrderTokens(
    userId: string,
    venueId: string,
    orderId: string,
    orderValue: number
  ): Promise<{ success: boolean; tokensAwarded?: number }> {
    try {
      // Calculate tokens using database function
      const { data: tokensAmount, error: calcError } = await this.supabase.rpc(
        'calculate_order_tokens',
        {
          p_user_id: userId,
          p_venue_id: venueId,
          p_order_value: orderValue,
        }
      );

      if (calcError || tokensAmount === null) {
        console.error('Error calculating tokens:', calcError);
        return { success: false };
      }

      // Get current order count for metadata
      const yearMonth = new Date().toISOString().slice(0, 7);
      const { data: countData } = await this.supabase
        .from('monthly_order_counts')
        .select('order_count')
        .eq('user_id', userId)
        .eq('venue_id', venueId)
        .eq('year_month', yearMonth)
        .single();

      // Award tokens
      const { error: awardError } = await this.supabase.rpc('award_tokens', {
        p_user_id: userId,
        p_amount: tokensAmount,
        p_type: 'order_completed',
        p_venue_id: venueId,
        p_order_id: orderId,
        p_metadata: {
          order_value: orderValue,
          order_count: (countData?.order_count || 0) + 1,
        },
        p_description: `Order completed (${tokensAmount} tokens)`,
      });

      if (awardError) {
        console.error('Error awarding tokens:', awardError);
        return { success: false };
      }

      // Increment order count
      await this.supabase.rpc('increment_monthly_order_count', {
        p_user_id: userId,
        p_venue_id: venueId,
      });

      return { success: true, tokensAwarded: tokensAmount };
    } catch (error) {
      console.error('Error in awardOrderTokens:', error);
      return { success: false };
    }
  }

  /**
   * Get all active rewards
   */
  async getActiveRewards(): Promise<Reward[]> {
    const { data, error } = await this.supabase
      .from('rewards')
      .select('*')
      .eq('status', 'active')
      .order('token_cost', { ascending: true });

    if (error) {
      console.error('Error fetching rewards:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Redeem a reward
   */
  async redeemReward(
    userId: string,
    rewardId: string
  ): Promise<{ success: boolean; code?: string; error?: string }> {
    try {
      // Get reward details
      const { data: reward, error: rewardError } = await this.supabase
        .from('rewards')
        .select('*')
        .eq('id', rewardId)
        .single();

      if (rewardError || !reward) {
        return { success: false, error: 'Reward not found' };
      }

      // Check user balance
      const balance = await this.getBalance(userId);
      if (!balance || balance.balance < reward.token_cost) {
        return { success: false, error: 'Insufficient tokens' };
      }

      // Generate redemption code
      const { data: code, error: codeError } = await this.supabase.rpc(
        'generate_redemption_code'
      );

      if (codeError || !code) {
        return { success: false, error: 'Failed to generate code' };
      }

      // Create redemption record
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30); // 30 days expiry

      const { error: redemptionError } = await this.supabase
        .from('redemptions')
        .insert({
          user_id: userId,
          reward_id: rewardId,
          code,
          expires_at: expiresAt.toISOString(),
        });

      if (redemptionError) {
        return { success: false, error: 'Failed to create redemption' };
      }

      // Deduct tokens
      const { error: deductError } = await this.supabase.rpc('award_tokens', {
        p_user_id: userId,
        p_amount: -reward.token_cost,
        p_type: 'redemption',
        p_description: `Redeemed: ${reward.title}`,
      });

      if (deductError) {
        return { success: false, error: 'Failed to deduct tokens' };
      }

      return { success: true, code };
    } catch (error) {
      console.error('Error redeeming reward:', error);
      return { success: false, error: 'Redemption failed' };
    }
  }

  /**
   * Get user's redemptions
   */
  async getUserRedemptions(userId: string): Promise<Redemption[]> {
    const { data, error } = await this.supabase
      .from('redemptions')
      .select('*, reward:rewards(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching redemptions:', error);
      return [];
    }

    return data || [];
  }
}
```

---

## Phase 3: Hook into Existing Flows (Day 2-3)

### 3.1 Award Tokens on Order Completion

**File**: `api/payments/mpesa/callback.ts` (modify existing)

```typescript
// Add at the top
import { createClient } from '@supabase/supabase-js';
import { TokensService } from '@/packages/shared/tokens-service';

// ... existing code ...

// After successful payment confirmation, add:
async function handleSuccessfulPayment(orderId: string, userId: string) {
  // ... existing payment logic ...

  try {
    // Get order details
    const { data: order } = await supabase
      .from('orders')
      .select('total_amount, tab:tabs(bar_id)')
      .eq('id', orderId)
      .single();

    if (order && order.tab) {
      const tokensService = new TokensService(supabase);
      const result = await tokensService.awardOrderTokens(
        userId,
        order.tab.bar_id,
        orderId,
        order.total_amount
      );

      if (result.success) {
        console.log(`Awarded ${result.tokensAwarded} tokens for order ${orderId}`);
      }
    }
  } catch (error) {
    // Don't fail payment if tokens fail - just log
    console.error('Failed to award tokens:', error);
  }
}
```

### 3.2 Award Tokens on First Venue Connection

**File**: `apps/customer/app/start/page.tsx` (modify existing)

```typescript
// Add at component level
import { TokensService } from '@/packages/shared/tokens-service';

// After successful venue connection (QR scan/check-in):
const handleVenueConnection = async (venueId: string) => {
  // ... existing connection logic ...

  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      const tokensService = new TokensService(supabase);
      const awarded = await tokensService.awardFirstConnectionTokens(
        user.id,
        venueId
      );

      if (awarded) {
        // Show toast notification
        showToast(`🎉 +${TOKENS_CONFIG.FIRST_CONNECT_TOKENS} tokens earned!`);
      }
    }
  } catch (error) {
    console.error('Failed to award connection tokens:', error);
  }
};
```

---

## Phase 4: Customer App UI (Day 3-5)

### 4.1 Create Tokens Page

**File**: `apps/customer/app/tokens/page.tsx`

```typescript
'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { TokensService } from '@/packages/shared/tokens-service';
import type { TokenBalance, TokenTransaction, Reward } from '@/packages/shared/types';

export default function TokensPage() {
  const [balance, setBalance] = useState<TokenBalance | null>(null);
  const [transactions, setTransactions] = useState<TokenTransaction[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [activeTab, setActiveTab] = useState<'balance' | 'rewards'>('balance');
  const [loading, setLoading] = useState(true);

  const supabase = createClient();
  const tokensService = new TokensService(supabase);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [balanceData, transactionsData, rewardsData] = await Promise.all([
        tokensService.getBalance(user.id),
        tokensService.getTransactions(user.id, 20),
        tokensService.getActiveRewards(),
      ]);

      setBalance(balanceData);
      setTransactions(transactionsData);
      setRewards(rewardsData);
    } catch
(error) {
      console.error('Error loading tokens data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRedeem = async (rewardId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const result = await tokensService.redeemReward(user.id, rewardId);
    
    if (result.success) {
      alert(`Redemption successful! Code: ${result.code}\nShow this to staff.`);
      loadData(); // Refresh balance
    } else {
      alert(`Redemption failed: ${result.error}`);
    }
  };

  if (loading) {
    return <div className="p-4">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6">
        <h1 className="text-2xl font-bold mb-2">Tabeza Tokens</h1>
        <div className="flex items-baseline gap-2">
          <span className="text-5xl font-bold">{balance?.balance || 0}</span>
          <span className="text-xl">tokens</span>
        </div>
        <p className="text-sm opacity-90 mt-2">
          Lifetime earned: {balance?.lifetime_earned || 0}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b bg-white">
        <button
          onClick={() => setActiveTab('balance')}
          className={`flex-1 py-3 text-center font-medium ${
            activeTab === 'balance'
              ? 'border-b-2 border-purple-600 text-purple-600'
              : 'text-gray-500'
          }`}
        >
          Activity
        </button>
        <button
          onClick={() => setActiveTab('rewards')}
          className={`flex-1 py-3 text-center font-medium ${
            activeTab === 'rewards'
              ? 'border-b-2 border-purple-600 text-purple-600'
              : 'text-gray-500'
          }`}
        >
          Rewards
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        {activeTab === 'balance' ? (
          <TransactionsList transactions={transactions} />
        ) : (
          <RewardsList 
            rewards={rewards} 
            userBalance={balance?.balance || 0}
            onRedeem={handleRedeem}
          />
        )}
      </div>
    </div>
  );
}

function TransactionsList({ transactions }: { transactions: TokenTransaction[] }) {
  const getIcon = (type: string) => {
    switch (type) {
      case 'first_connect': return '🎯';
      case 'order_completed': return '🍽️';
      case 'referral_sender': return '🤝';
      case 'referral_receiver': return '🎁';
      case 'redemption': return '🎟️';
      default: return '💰';
    }
  };

  const getDescription = (tx: TokenTransaction) => {
    if (tx.description) return tx.description;
    
    switch (tx.type) {
      case 'first_connect': return 'First connection bonus';
      case 'order_completed': return 'Order completed';
      case 'referral_sender': return 'Friend joined Tabeza';
      case 'referral_receiver': return 'Welcome bonus';
      case 'redemption': return 'Reward redeemed';
      default: return 'Token transaction';
    }
  };

  if (transactions.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>No transactions yet</p>
        <p className="text-sm mt-2">Order food to start earning tokens!</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {transactions.map((tx) => (
        <div
          key={tx.id}
          className="bg-white rounded-lg p-4 flex items-center justify-between shadow-sm"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">{getIcon(tx.type)}</span>
            <div>
              <p className="font-medium">{getDescription(tx)}</p>
              <p className="text-xs text-gray-500">
                {new Date(tx.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
          <span
            className={`font-bold text-lg ${
              tx.amount > 0 ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {tx.amount > 0 ? '+' : ''}{tx.amount}
          </span>
        </div>
      ))}
    </div>
  );
}

function RewardsList({ 
  rewards, 
  userBalance,
  onRedeem 
}: { 
  rewards: Reward[];
  userBalance: number;
  onRedeem: (id: string) => void;
}) {
  const canAfford = (cost: number) => userBalance >= cost;

  if (rewards.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>No rewards available yet</p>
        <p className="text-sm mt-2">Check back soon!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {rewards.map((reward) => (
        <div
          key={reward.id}
          className="bg-white rounded-lg p-4 shadow-sm"
        >
          <div className="flex justify-between items-start mb-2">
            <div className="flex-1">
              <h3 className="font-bold text-lg">{reward.title}</h3>
              <p className="text-sm text-gray-600 mb-2">
                {reward.description}
              </p>
              <p className="text-xs text-gray-500">
                From: {reward.provider_name}
              </p>
            </div>
            <div className="text-right">
              <div className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full font-bold">
                {reward.token_cost} 🪙
              </div>
            </div>
          </div>

          <button
            onClick={() => onRedeem(reward.id)}
            disabled={!canAfford(reward.token_cost)}
            className={`w-full py-2 rounded-lg font-medium transition-colors ${
              canAfford(reward.token_cost)
                ? 'bg-purple-600 text-white hover:bg-purple-700'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {canAfford(reward.token_cost) ? 'Redeem Now' : 'Insufficient Tokens'}
          </button>
        </div>
      ))}
    </div>
  );
}
```

### 4.2 Add Tokens Widget to Home

**File**: `apps/customer/app/page.tsx` (modify)

```typescript
// Add near top of home page
import Link from 'next/link';
import { TokensService } from '@/packages/shared/tokens-service';

// In component:
const [tokenBalance, setTokenBalance] = useState(0);

useEffect(() => {
  const loadTokens = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const tokensService = new TokensService(supabase);
      const balance = await tokensService.getBalance(user.id);
      setTokenBalance(balance?.balance || 0);
    }
  };
  loadTokens();
}, []);

// Add widget to JSX:
<Link href="/tokens" className="block">
  <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg p-4 shadow-lg">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm opacity-90">Your Tokens</p>
        <p className="text-3xl font-bold">{tokenBalance} 🪙</p>
      </div>
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </div>
  </div>
</Link>
```

### 4.3 Add Toast Notification Component

**File**: `apps/customer/components/TokensToast.tsx`

```typescript
'use client';

import { useEffect, useState } from 'react';

interface TokensToastProps {
  amount: number;
  show: boolean;
  onClose: () => void;
}

export function TokensToast({ amount, show, onClose }: TokensToastProps) {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(onClose, 3000);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  if (!show) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-slide-down">
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-2">
        <span className="text-2xl">🎉</span>
        <span className="font-bold">+{amount} tokens earned!</span>
      </div>
    </div>
  );
}
```

---

## Task Checklist

### ✅ Day 1: Database Foundation
- [ ] Create migration file `022_create_tokens_system.sql`
- [ ] Run migration on local Supabase
- [ ] Test database functions manually
- [ ] Add sample rewards data
- [ ] Update shared types in `packages/shared/types.ts`

### ✅ Day 2: Core Services
- [ ] Create `tokens-service.ts` in shared package
- [ ] Hook into payment callback for order tokens
- [ ] Hook into venue connection for first-time bonus
- [ ] Test token awarding locally

### ✅ Day 3-4: Customer UI
- [ ] Create `/tokens` page
- [ ] Build transaction history view
- [ ] Build rewards catalog view
- [ ] Add redemption flow
- [ ] Add tokens widget to home page
- [ ] Create toast notification component

### ✅ Day 5: Referral System
- [ ] Add referral code generation on signup
- [ ] Create share functionality
- [ ] Build referral tracking
- [ ] Award tokens on referral completion

### ✅ Day 6: Staff App Integration
- [ ] Add redemption validation page
- [ ] Allow staff to mark redemptions as used
- [ ] Show venue-specific redemptions

### ✅ Day 7: Testing & Polish
- [ ] End-to-end testing of all flows
- [ ] Test frequency algorithm with multiple orders
- [ ] Test edge cases (insufficient balance, expired codes)
- [ ] Add loading states and error handling
- [ ] Polish UI/UX

### ✅ Day 8: Deploy
- [ ] Run migration on production Supabase
- [ ] Deploy to staging
- [ ] Test with real data
- [ ] Deploy to production
- [ ] Monitor for issues

---

## Quick Start Commands

```bash
# 1. Checkout tokens branch
git checkout tokens-system

# 2. Install dependencies (if needed)
pnpm install

# 3. Start local Supabase
npx supabase start

# 4. Run migration
npx supabase db push

# 5. Start development servers
pnpm dev

# 6. Test locally
# Visit http://localhost:3000 (customer app)
# Visit http://localhost:3001 (staff app)
```

---

## Next Steps After MVP

1. **Analytics Dashboard** - Track token economy health
2. **Admin Panel** - Manage rewards, adjust token values
3. **Fraud Prevention** - Rate limiting, abuse detection
4. **Gamification** - Levels, badges, streaks
5. **Partner Portal** - Self-service reward creation
6. **Push Notifications** - Token milestones, new rewards

This gets you a working MVP in ~1-2 weeks. Start simple, iterate based on user behavior! 🚀

# ⚠️ CRITICAL: Supabase Migration Safety Strategy

You're absolutely right to be concerned! **All git branches share the same Supabase instance**, so running migrations will affect production immediately.

---

## Safe Migration Strategy for Production Apps

### Option 1: **Backwards-Compatible Migration** (RECOMMENDED)
Add new tables/columns without modifying existing ones. This is the safest approach.

#### ✅ What Makes Our Migration Safe:

```sql
-- ✅ SAFE: Creates NEW tables (doesn't touch existing ones)
CREATE TABLE IF NOT EXISTS public.token_balances ...
CREATE TABLE IF NOT EXISTS public.token_transactions ...

-- ✅ SAFE: Uses IF NOT EXISTS
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS referral_code TEXT;

-- ✅ SAFE: Only adds new functions (doesn't modify existing ones)
CREATE OR REPLACE FUNCTION public.award_tokens ...

-- ✅ SAFE: New policies don't affect existing tables
CREATE POLICY "Users can view own token balance" ...
```

#### ⚠️ Potential Issues to Check:

1. **Auth.users table modification**
```sql
-- This line could cause issues:
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;
```

**Solution**: Store referral codes in a separate profile/users table instead:

```sql
-- SAFER: Use separate table
CREATE TABLE IF NOT EXISTS public.user_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_code TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

2. **RLS Policies on New Tables**
- New tables with RLS won't affect existing functionality
- But test that customers can't accidentally access admin functions

---

## Recommended Deployment Process

### Step 1: **Separate Supabase Project for Development**

```bash
# Create a new Supabase project for testing
# https://app.supabase.com/new

# Link to dev project
npx supabase link --project-ref YOUR_DEV_PROJECT_REF

# Test migration on dev
npx supabase db push
```

**Cost**: Free tier is sufficient for testing

### Step 2: **Test Migration Locally First**

```bash
# Start local Supabase (isolated from production)
npx supabase start

# This creates a completely isolated local database
# Run migration locally
npx supabase db push

# Test thoroughly
pnpm dev

# When done
npx supabase stop
```

### Step 3: **Production Migration with Rollback Plan**

#### A. Create a Backup First

```bash
# Manual backup via Supabase Dashboard:
# 1. Go to https://app.supabase.com/project/YOUR_PROJECT/settings/general
# 2. Click "Database" → "Backups"
# 3. Create manual backup before migration
```

#### B. Deploy During Low-Traffic Hours

```bash
# Deploy at 3 AM or lowest traffic time
npx supabase db push --db-url YOUR_PRODUCTION_DB_URL

# Monitor errors immediately
# Check Supabase logs
```

#### C. Have Rollback Ready

Create a rollback migration if needed:

**File**: `supabase/migrations/023_rollback_tokens_if_needed.sql`

```sql
-- ROLLBACK SCRIPT (only run if something breaks)

-- Drop new tables
DROP TABLE IF EXISTS public.redemptions CASCADE;
DROP TABLE IF EXISTS public.rewards CASCADE;
DROP TABLE IF EXISTS public.user_referrals CASCADE;
DROP TABLE IF EXISTS public.monthly_order_counts CASCADE;
DROP TABLE IF EXISTS public.token_transactions CASCADE;
DROP TABLE IF EXISTS public.token_balances CASCADE;

-- Drop new functions
DROP FUNCTION IF EXISTS public.generate_redemption_code();
DROP FUNCTION IF EXISTS public.increment_monthly_order_count(UUID, UUID, TIMESTAMPTZ);
DROP FUNCTION IF EXISTS public.calculate_order_tokens(UUID, UUID, NUMERIC, TIMESTAMPTZ);
DROP FUNCTION IF EXISTS public.award_tokens(UUID, INTEGER, TEXT, UUID, UUID, JSONB, TEXT);
DROP FUNCTION IF EXISTS public.get_or_create_token_balance(UUID);

-- Remove column from auth.users (if added)
-- ALTER TABLE auth.users DROP COLUMN IF EXISTS referral_code;
```

---

## Modified Safe Migration (Production-Ready)

**File**: `supabase/migrations/022_create_tokens_system_safe.sql`

```sql
-- ============================================
-- TABEZA TOKENS SYSTEM - PRODUCTION SAFE VERSION
-- ============================================

-- SAFETY: This migration only ADDS new tables and functions
-- It does NOT modify any existing tables or data
-- Existing app functionality will continue to work normally

BEGIN;

-- 1. User Profiles Table (instead of modifying auth.users)
CREATE TABLE IF NOT EXISTS public.user_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_code TEXT UNIQUE,
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Generate referral codes for existing users (background job)
-- Don't do this in migration - do it separately
-- INSERT INTO public.user_profiles (user_id, referral_code)
-- SELECT id, UPPER(SUBSTRING(MD5(id::TEXT) FROM 1 FOR 8))
-- FROM auth.users
-- ON CONFLICT (user_id) DO NOTHING;

-- 2. Token Balances Table
CREATE TABLE IF NOT EXISTS public.token_balances (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  balance INTEGER NOT NULL DEFAULT 0 CHECK (balance >= 0),
  lifetime_earned INTEGER NOT NULL DEFAULT 0,
  lifetime_redeemed INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Token Transactions Table
CREATE TABLE IF NOT EXISTS public.token_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN (
    'first_connect',
    'order_completed', 
    'referral_sender',
    'referral_receiver',
    'redemption',
    'adjustment'
  )),
  venue_id UUID REFERENCES public.bars(id) ON DELETE SET NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  redemption_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Monthly Order Counts
CREATE TABLE IF NOT EXISTS public.monthly_order_counts (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  venue_id UUID NOT NULL REFERENCES public.bars(id) ON DELETE CASCADE,
  year_month TEXT NOT NULL,
  order_count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, venue_id, year_month)
);

-- 5. User Referrals
CREATE TABLE IF NOT EXISTS public.user_referrals (
  referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  PRIMARY KEY (referrer_id, referee_id)
);

-- 6. Rewards Catalog
CREATE TABLE IF NOT EXISTS public.rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_type TEXT NOT NULL CHECK (provider_type IN ('venue', 'supplier')),
  provider_id UUID,
  provider_name TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  token_cost INTEGER NOT NULL CHECK (token_cost > 0),
  terms TEXT,
  image_url TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'expired')),
  max_redemptions INTEGER,
  current_redemptions INTEGER NOT NULL DEFAULT 0,
  valid_from TIMESTAMPTZ,
  valid_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Redemptions Table
CREATE TABLE IF NOT EXISTS public.redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reward_id UUID NOT NULL REFERENCES public.rewards(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'redeemed', 'expired', 'cancelled')),
  redeemed_at TIMESTAMPTZ,
  redeemed_by_venue_id UUID REFERENCES public.bars(id) ON DELETE SET NULL,
  redeemed_by_staff_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

-- ============================================
-- INDEXES (if not exists)
-- ============================================

CREATE INDEX IF NOT EXISTS idx_token_transactions_user_id ON public.token_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_token_transactions_created_at ON public.token_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_token_transactions_type ON public.token_transactions(type);
CREATE INDEX IF NOT EXISTS idx_monthly_order_counts_lookup ON public.monthly_order_counts(user_id, venue_id, year_month);
CREATE INDEX IF NOT EXISTS idx_redemptions_user_id ON public.redemptions(user_id);
CREATE INDEX IF NOT EXISTS idx_redemptions_code ON public.redemptions(code);
CREATE INDEX IF NOT EXISTS idx_redemptions_status ON public.redemptions(status);
CREATE INDEX IF NOT EXISTS idx_rewards_status ON public.rewards(status);
CREATE INDEX IF NOT EXISTS idx_user_profiles_referral_code ON public.user_profiles(referral_code);

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.token_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.token_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_order_counts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.redemptions ENABLE ROW LEVEL SECURITY;

-- User Profiles Policies
CREATE POLICY "Users can view own profile" ON public.user_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.user_profiles FOR UPDATE USING (auth.uid() = user_id);

-- Token Balances Policies
CREATE POLICY "Users can view own token balance" ON public.token_balances FOR SELECT USING (auth.uid() = user_id);

-- Token Transactions Policies  
CREATE POLICY "Users can view own transactions" ON public.token_transactions FOR SELECT USING (auth.uid() = user_id);

-- Monthly Order Counts Policies
CREATE POLICY "Users can view own order counts" ON public.monthly_order_counts FOR SELECT USING (auth.uid() = user_id);

-- User Referrals Policies
CREATE POLICY "Users can view referrals they're involved in" ON public.user_referrals FOR SELECT
  USING (auth.uid() = referrer_id OR auth.uid() = referee_id);

-- Rewards Policies
CREATE POLICY "Anyone can view active rewards" ON public.rewards FOR SELECT USING (status = 'active');

-- Redemptions Policies
CREATE POLICY "Users can view own redemptions" ON public.redemptions FOR SELECT USING (auth.uid() = user_id);

-- Staff can view redemptions at their venues
CREATE POLICY "Staff can view venue redemptions" ON public.redemptions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_bars 
      WHERE user_id = auth.uid() 
      AND bar_id = redeemed_by_venue_id
    )
  );

-- ============================================
-- FUNCTIONS (safe to create/replace)
-- ============================================

CREATE OR REPLACE FUNCTION public.get_or_create_token_balance(p_user_id UUID)
RETURNS public.token_balances
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_balance public.token_balances;
BEGIN
  SELECT * INTO v_balance FROM public.token_balances WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN
    INSERT INTO public.token_balances (user_id, balance)
    VALUES (p_user_id, 0)
    RETURNING * INTO v_balance;
  END IF;
  
  RETURN v_balance;
END;
$$;

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
SET search_path = public
AS $$
DECLARE
  v_transaction_id UUID;
BEGIN
  PERFORM public.get_or_create_token_balance(p_user_id);
  
  INSERT INTO public.token_transactions (user_id, amount, type, venue_id, order_id, metadata, description)
  VALUES (p_user_id, p_amount, p_type, p_venue_id, p_order_id, p_metadata, p_description)
  RETURNING id INTO v_transaction_id;
  
  UPDATE public.token_balances
  SET 
    balance = balance + p_amount,
    lifetime_earned = CASE WHEN p_amount > 0 THEN lifetime_earned + p_amount ELSE lifetime_earned END,
    lifetime_redeemed = CASE WHEN p_amount < 0 THEN lifetime_redeemed + ABS(p_amount) ELSE lifetime_redeemed END,
    updated_at = NOW()
  WHERE user_id = p_user_id;
  
  RETURN v_transaction_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.calculate_order_tokens(
  p_user_id UUID,
  p_venue_id UUID,
  p_order_value NUMERIC,
  p_order_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS INTEGER
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
DECLARE
  v_base_tokens INTEGER := 10;
  v_value_bonus INTEGER := 0;
  v_frequency_multiplier NUMERIC := 1.0;
  v_order_count INTEGER;
  v_year_month TEXT;
  v_total_tokens INTEGER;
BEGIN
  v_year_month := TO_CHAR(p_order_date, 'YYYY-MM');
  
  SELECT COALESCE(order_count, 0) INTO v_order_count
  FROM public.monthly_order_counts
  WHERE user_id = p_user_id AND venue_id = p_venue_id AND year_month = v_year_month;
  
  IF p_order_value >= 10000 THEN v_value_bonus := 50;
  ELSIF p_order_value >= 5000 THEN v_value_bonus := 30;
  ELSIF p_order_value >= 2500 THEN v_value_bonus := 20;
  ELSIF p_order_value >= 1000 THEN v_value_bonus := 10;
  ELSIF p_order_value >= 500 THEN v_value_bonus := 5;
  END IF;
  
  IF v_order_count >= 20 THEN v_frequency_multiplier := 2.0;
  ELSIF v_order_count >= 10 THEN v_frequency_multiplier := 1.8;
  ELSIF v_order_count >= 5 THEN v_frequency_multiplier := 1.5;
  ELSIF v_order_count >= 2 THEN v_frequency_multiplier := 1.2;
  END IF;
  
  v_total_tokens := FLOOR((v_base_tokens + v_value_bonus) * v_frequency_multiplier);
  
  RETURN v_total_tokens;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_monthly_order_count(
  p_user_id UUID,
  p_venue_id UUID,
  p_order_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS INTEGER
LANGUAGE plpgsql
SET search_path = public
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

CREATE OR REPLACE FUNCTION public.generate_redemption_code()
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_code TEXT;
  v_exists BOOLEAN;
BEGIN
  LOOP
    v_code := 'TBZA-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6));
    SELECT EXISTS(SELECT 1 FROM public.redemptions WHERE code = v_code) INTO v_exists;
    EXIT WHEN NOT v_exists;
  END LOOP;
  
  RETURN v_code;
END;
$$;

-- ============================================
-- SAMPLE DATA (safe - uses INSERT ... ON CONFLICT)
-- ============================================

INSERT INTO public.rewards (provider_type, provider_name, title, description, token_cost, status)
VALUES 
  ('supplier', 'Tusker', 'Free Tusker Beer', 'Redeem for one free Tusker beer at any Tabeza venue', 100, 'active'),
  ('supplier', 'Coca-Cola', 'Free Coke', 'Redeem for one free Coca-Cola at any Tabeza venue', 50, 'active'),
  ('venue', 'Generic', '10% Off Bill', 'Get 10% off your total bill', 150, 'active'),
  ('venue', 'Generic', 'Free Appetizer', 'Get any appetizer free with your order', 80, 'active')
ON CONFLICT DO NOTHING;

COMMIT;

-- ============================================
-- VERIFICATION QUERIES (run these after migration)
-- ============================================

-- Check tables created
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' AND table_name LIKE 'token%' OR table_name LIKE '%redemption%';

-- Check functions created
-- SELECT routine_name FROM information_schema.routines 
-- WHERE routine_schema = 'public' AND routine_name LIKE '%token%';
```

---

## Safe Deployment Checklist

### Before Migration:
- [ ] Create manual backup in Supabase dashboard
- [ ] Test migration on local Supabase (`npx supabase start`)
- [ ] Test migration on dev Supabase project
- [ ] Review all `CREATE TABLE` statements have `IF NOT EXISTS`
- [ ] Confirm no `ALTER TABLE` on existing production tables
- [ ] Schedule during low-traffic hours (2-4 AM)

### During Migration:
- [ ] Run migration: `npx supabase db push`
- [ ] Monitor Supabase logs for errors
- [ ] Test existing app functionality (orders, payments, tabs)
- [ ] Test new tokens functionality
- [ ] Check database size didn't explode

### If Something Breaks:
- [ ] Run rollback migration immediately
- [ ] Restore from backup if needed
- [ ] Debug in dev environment
- [ ] Fix and retry

### After Success:
- [ ] Merge tokens branch to main
- [ ] Deploy app code changes
- [ ] Monitor error logs
- [ ] Test end-to-end user flow

---

## Answer to Your Question

**Will this affect production?**

✅ **No, if you follow this approach:**
- Migration only ADDS new tables (doesn't touch existing ones)
- Uses `IF NOT EXISTS` everywhere
- Doesn't modify `auth.users` (uses separate `user_profiles`)
- New functions don't interfere with existing code
- Your current app will continue working normally

❌ **Potential issues to watch:**
- Database size (negligible for new empty tables)
- Performance (new indexes are small initially)
- RLS policies (only affect new tables)

**Best Practice**: Deploy to a test/staging Supabase project first, then production after 24 hours of testing.