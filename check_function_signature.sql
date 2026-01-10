-- Check the exact signature of is_within_business_hours function
SELECT 
    'Function Signature' as analysis_type,
    proname as function_name,
    proargtypes as argument_types_oid,
    proargnames as argument_names,
    prosrc as function_source
FROM pg_proc 
WHERE proname = 'is_within_business_hours';

-- Based on the diagnostic output, the function exists but expects different parameters
-- Let me create a wrapper function that matches what should_tab_be_overdue expects

CREATE OR REPLACE FUNCTION is_within_business_hours_wrapper(bar_uuid UUID, check_time TIMESTAMPTZ)
RETURNS BOOLEAN AS $$
DECLARE
    business_hours JSONB;
    current_hour INTEGER;
    current_minute INTEGER;
    current_total_minutes INTEGER;
    open_hour INTEGER;
    open_minute INTEGER;
    close_hour INTEGER;
    close_minute INTEGER;
    open_total_minutes INTEGER;
    close_total_minutes INTEGER;
BEGIN
    -- Get business hours for the bar
    SELECT business_hours INTO business_hours
    FROM bars 
    WHERE id = bar_uuid;
    
    -- If business hours not enabled, always open
    IF NOT (business_hours->>'enabled')::BOOLEAN THEN
        RETURN TRUE;
    END IF;
    
    -- If type is not simple, assume open for MVP
    IF (business_hours->>'type') != 'simple' THEN
        RETURN TRUE;
    END IF;
    
    -- Get current time
    current_hour := EXTRACT(HOUR FROM check_time);
    current_minute := EXTRACT(MINUTE FROM check_time);
    current_total_minutes := current_hour * 60 + current_minute;
    
    -- Parse open time (format: "HH:MM")
    open_hour := CAST(SPLIT_PART(business_hours->'simple'->>'open', ':', 1) AS INTEGER);
    open_minute := CAST(SPLIT_PART(business_hours->'simple'->>'open', ':', 2) AS INTEGER);
    open_total_minutes := open_hour * 60 + open_minute;
    
    -- Parse close time
    close_hour := CAST(SPLIT_PART(business_hours->'simple'->>'close', ':', 1) AS INTEGER);
    close_minute := CAST(SPLIT_PART(business_hours->'simple'->>'close', ':', 2) AS INTEGER);
    close_total_minutes := close_hour * 60 + close_minute;
    
    -- Handle overnight hours (e.g., 20:00 to 04:00)
    IF close_total_minutes < open_total_minutes THEN
        -- Overnight: current time must be >= open OR <= close
        RETURN current_total_minutes >= open_total_minutes OR current_total_minutes <= close_total_minutes;
    ELSE
        -- Normal hours: current time must be between open and close
        RETURN current_total_minutes >= open_total_minutes AND current_total_minutes <= close_total_minutes;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Or simpler: just call the existing function with correct parameters
-- First, let's see what the existing function expects
-- From the diagnostic, it seems to expect different parameters
-- Let me create a simple wrapper that calls the existing function correctly
