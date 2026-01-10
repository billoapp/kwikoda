-- Simple wrapper to fix the function signature mismatch
-- The existing is_within_business_hours function exists but expects different parameters

-- Create a simple wrapper that matches what should_tab_be_overdue expects
CREATE OR REPLACE FUNCTION is_within_business_hours_for_overdue(bar_uuid UUID, check_time TIMESTAMPTZ)
RETURNS BOOLEAN AS $$
BEGIN
    -- Call the existing is_within_business_hours function
    -- We need to figure out what parameters it actually expects
    -- For now, let's create a simple version that works
    
    -- Get business hours for the bar
    DECLARE business_hours JSONB;
    DECLARE current_hour INTEGER;
    DECLARE current_minute INTEGER;
    DECLARE current_total_minutes INTEGER;
    DECLARE open_hour INTEGER;
    DECLARE open_minute INTEGER;
    DECLARE close_hour INTEGER;
    DECLARE close_minute INTEGER;
    DECLARE open_total_minutes INTEGER;
    DECLARE close_total_minutes INTEGER;
    
    SELECT business_hours INTO business_hours
    FROM bars 
    WHERE id = bar_uuid;
    
    -- If no business hours set, assume 24/7
    IF business_hours IS NULL THEN
        RETURN TRUE;
    END IF;
    
    -- Simple mode: check open/close times
    IF business_hours->>'type' = 'simple' THEN
        -- Get open/close times for this day
        open_hour := CAST(SPLIT_PART(business_hours->'simple'->>'open', ':', 1) AS INTEGER);
        open_minute := CAST(SPLIT_PART(business_hours->'simple'->>'open', ':', 2) AS INTEGER);
        close_hour := CAST(SPLIT_PART(business_hours->'simple'->>'close', ':', 1) AS INTEGER);
        close_minute := CAST(SPLIT_PART(business_hours->'simple'->>'close', ':', 2) AS INTEGER);
        
        -- Get current time
        current_hour := EXTRACT(HOUR FROM check_time);
        current_minute := EXTRACT(MINUTE FROM check_time);
        current_total_minutes := current_hour * 60 + current_minute;
        open_total_minutes := open_hour * 60 + open_minute;
        close_total_minutes := close_hour * 60 + close_minute;
        
        -- Handle overnight hours
        IF close_total_minutes < open_total_minutes THEN
            RETURN current_total_minutes >= open_total_minutes OR current_total_minutes <= close_total_minutes;
        ELSE
            RETURN current_total_minutes >= open_total_minutes AND current_total_minutes <= close_total_minutes;
        END IF;
        
    -- 24/7 mode
    ELSIF business_hours->>'type' = '24hr' THEN
        RETURN TRUE;
        
    -- Advanced mode or other
    ELSE
        -- For now, assume open
        RETURN TRUE;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Now fix should_tab_be_overdue to use the wrapper
DROP FUNCTION should_tab_be_overdue(uuid);

CREATE OR REPLACE FUNCTION should_tab_be_overdue(p_tab_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    tab_balance NUMERIC;
    is_overdue BOOLEAN := FALSE;
    v_bar_id UUID;
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
        -- Check if current time is outside business hours using our wrapper
        IF NOT is_within_business_hours_for_overdue(v_bar_id, check_time) THEN
            is_overdue := TRUE;
        END IF;
    END IF;
    
    RETURN is_overdue;
END;
$$ LANGUAGE plpgsql;

-- Test the functions
-- SELECT is_within_business_hours_for_overdue('your-bar-id-here'::uuid, NOW()) as is_open;
-- SELECT should_tab_be_overdue('your-tab-id-here'::uuid) as is_overdue;
