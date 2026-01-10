-- Check what functions actually exist in the database
SELECT 
    proname as function_name,
    prosrc as function_definition
FROM pg_proc 
WHERE proname LIKE '%business%' 
   OR proname LIKE '%overdue%'
   OR proname LIKE '%tab%'
ORDER BY proname;

-- If is_within_business_hours doesn't exist, create a simple version
CREATE OR REPLACE FUNCTION is_within_business_hours(bar_uuid UUID, check_time TIMESTAMPTZ)
RETURNS BOOLEAN AS $$
DECLARE
    business_hours JSONB;
    day_of_week INTEGER;
    current_time TIME;
    open_time TIME;
    close_time TIME;
    is_open BOOLEAN := FALSE;
BEGIN
    -- Get business hours for the bar
    SELECT business_hours INTO business_hours
    FROM bars 
    WHERE id = bar_uuid;
    
    -- If no business hours set, assume 24/7
    IF business_hours IS NULL THEN
        RETURN TRUE;
    END IF;
    
    -- Get day of week (0=Sunday, 1=Monday, etc.)
    day_of_week := EXTRACT(DOW FROM check_time);
    
    -- Simple mode: check open/close times
    IF business_hours->>'mode' = 'simple' THEN
        -- Get open/close times for this day
        open_time := (business_hours->'simple'->>'open_time')::TIME;
        close_time := (business_hours->'simple'->>'close_time')::TIME;
        
        -- Get current time
        current_time := check_time::TIME;
        
        -- Check if within business hours
        is_open := current_time >= open_time AND current_time <= close_time;
        
    -- 24/7 mode
    ELSIF business_hours->>'mode' = '24hr' THEN
        is_open := TRUE;
        
    -- Advanced mode (not implemented yet)
    ELSE
        -- For now, assume open if advanced mode
        is_open := TRUE;
    END IF;
    
    RETURN is_open;
END;
$$ LANGUAGE plpgsql;

-- Now create the overdue checking function
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
-- SELECT is_within_business_hours('your-bar-id-here'::uuid, NOW()) as is_open;
-- SELECT get_tab_balance('your-tab-id-here'::uuid) as balance;
-- SELECT should_tab_be_overdue('your-tab-id-here'::uuid) as is_overdue;
