-- Final fix for get_tab_balance function
-- Rename parameter to avoid any ambiguity with column names

-- First drop the existing function
DROP FUNCTION IF EXISTS get_tab_balance(uuid);

-- Recreate with different parameter name
CREATE OR REPLACE FUNCTION get_tab_balance(p_tab_id UUID)
RETURNS NUMERIC AS $$
DECLARE
    order_total NUMERIC := 0;
    payment_total NUMERIC := 0;
    balance NUMERIC := 0;
BEGIN
    -- Sum confirmed orders for this tab
    SELECT COALESCE(SUM(total), 0) INTO order_total
    FROM tab_orders 
    WHERE tab_id = p_tab_id 
    AND status = 'confirmed';
    
    -- Sum successful payments for this tab
    SELECT COALESCE(SUM(amount), 0) INTO payment_total
    FROM tab_payments 
    WHERE tab_id = p_tab_id 
    AND status = 'completed';
    
    -- Calculate balance (orders - payments)
    balance := order_total - payment_total;
    
    RETURN balance;
END;
$$ LANGUAGE plpgsql;

-- Also fix should_tab_be_overdue function
DROP FUNCTION IF EXISTS should_tab_be_overdue(uuid);

CREATE OR REPLACE FUNCTION should_tab_be_overdue(p_tab_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    tab_balance NUMERIC;
    is_overdue BOOLEAN := FALSE;
    bar_id UUID;
    current_time TIMESTAMPTZ := NOW();
BEGIN
    -- Get the bar_id for this tab
    SELECT bar_id INTO bar_id
    FROM tabs 
    WHERE id = p_tab_id;
    
    -- Get current balance
    tab_balance := get_tab_balance(p_tab_id);
    
    -- Only check overdue status if there's an outstanding balance
    IF tab_balance > 0 THEN
        -- Check if current time is outside business hours
        IF NOT is_within_business_hours(bar_id, current_time) THEN
            is_overdue := TRUE;
        END IF;
    END IF;
    
    RETURN is_overdue;
END;
$$ LANGUAGE plpgsql;

-- Test the functions
-- SELECT get_tab_balance('your-tab-id-here'::uuid) as balance;
-- SELECT should_tab_be_overdue('your-tab-id-here'::uuid) as is_overdue;
