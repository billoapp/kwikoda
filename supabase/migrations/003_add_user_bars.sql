-- Add user_bars table for role management
CREATE TABLE user_bars (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    bar_id UUID REFERENCES bars(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('owner', 'manager', 'staff')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure a user can only have one role per bar
    UNIQUE(user_id, bar_id)
);

-- Enable RLS
ALTER TABLE user_bars ENABLE ROW LEVEL SECURITY;

-- Policies: Users can only see their own bar associations
CREATE POLICY "Users can view own bar associations" ON user_bars
    FOR SELECT USING (auth.uid() = user_id);

-- Policies: Users can only update their own roles (with restrictions)
CREATE POLICY "Users can update own bar associations" ON user_bars
    FOR UPDATE USING (auth.uid() = user_id);

-- Policies: Service role can do everything
CREATE POLICY "Service role full access" ON user_bars
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Indexes for performance
CREATE INDEX idx_user_bars_user_id ON user_bars(user_id);
CREATE INDEX idx_user_bars_bar_id ON user_bars(bar_id);
CREATE INDEX idx_user_bars_role ON user_bars(role);
