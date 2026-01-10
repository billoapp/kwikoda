-- Fix the should_tab_be_overdue function to resolve bar_id ambiguity
-- This function has the same parameter/column naming issue

-- Drop the existing function
DROP FUNCTION should_tab_be_overdue(uuid);

-- Recreate with clear parameter naming
CREATE OR REPLACE FUNCTION should_tab_be_overdue(p_tab_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    tab_balance NUMERIC;
    is_overdue BOOLEAN := FALSE;
    v_bar_id UUID;  -- Use v_ prefix to avoid ambiguity
    check_time TIMESTAMPTZ := NOW();
BEGIN
    -- Get the bar_id for this tab
    SELECT bar_id INTO v_bar_id
    FROM tabs 
    WHERE id = p_tab_id;
    
    -- Get current balance
    tab_balance := get_tab_balance(p_tab_id);
    
    -- Only check overdue status if there's an outstanding balance
    IF tab_balance > 0 THEN
        -- Check if current time is outside business hours
        IF NOT is_within_business_hours(v_bar_id, check_time) THEN
            is_overdue := TRUE;
        END IF;
    END IF;
    
    RETURN is_overdue;
END;
$$ LANGUAGE plpgsql;

-- Test the function
-- SELECT should_tab_be_overdue('your-tab-id-here'::uuid) as is_overdue;
