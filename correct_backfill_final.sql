-- Correct backfill script using actual schema
-- Uses the correct column names from the actual database

-- First, set default business hours for bars that don't have proper simple hours
UPDATE bars 
SET business_hours_simple = '{"open": "09:00", "close": "23:00"}'
WHERE business_hours_simple IS NULL 
  AND business_hours_mode = 'simple';

-- Show which bars were updated
SELECT 
    'Business Hours Updated' as analysis_type,
    COUNT(*) as bars_updated,
    STRING_AGG(name, ', ') as updated_bars
FROM bars 
WHERE business_hours_mode = 'simple'
  AND business_hours_simple->>'open' = '09:00'
  AND business_hours_simple->>'close' = '23:00';

-- Create correct is_within_business_hours function using actual schema
CREATE OR REPLACE FUNCTION is_within_business_hours_correct(bar_uuid UUID, check_time TIMESTAMPTZ)
RETURNS BOOLEAN AS $$
DECLARE
    business_mode TEXT;
    business_simple JSONB;
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
    -- Get business hours mode and settings for the bar
    SELECT business_hours_mode, business_hours_simple INTO business_mode, business_simple
    FROM bars 
    WHERE id = bar_uuid;
    
    -- Handle different modes
    IF business_mode = '24hours' OR business_24_hours = true THEN
        RETURN TRUE;
    ELSIF business_mode = 'simple' AND business_simple IS NOT NULL THEN
        -- Get open/close times
        open_hour := CAST(SPLIT_PART(business_simple->>'open', ':', 1) AS INTEGER);
        open_minute := CAST(SPLIT_PART(business_simple->>'open', ':', 2) AS INTEGER);
        close_hour := CAST(SPLIT_PART(business_simple->>'close', ':', 1) AS INTEGER);
        close_minute := CAST(SPLIT_PART(business_simple->>'close', ':', 2) AS INTEGER);
        
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
    ELSE
        -- Advanced mode or missing data - assume open
        RETURN TRUE;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Create correct should_tab_be_overdue function
CREATE OR REPLACE FUNCTION should_tab_be_overdue_correct(p_tab_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    tab_balance NUMERIC;
    is_overdue BOOLEAN := FALSE;
    v_bar_id UUID;
    check_time TIMESTAMPTZ := NOW();
    tab_created_at TIMESTAMPTZ;
    tab_age_hours NUMERIC;
BEGIN
    -- Get tab details
    SELECT bar_id, opened_at INTO v_bar_id, tab_created_at
    FROM tabs 
    WHERE id = p_tab_id;
    
    -- Get current balance
    tab_balance := get_tab_balance(p_tab_id);
    
    -- Only check overdue status if there's an outstanding balance
    IF tab_balance > 0 THEN
        -- Calculate how old the tab is in hours
        tab_age_hours := EXTRACT(EPOCH FROM (check_time - tab_created_at)) / 3600;
        
        -- Tab should be overdue if:
        -- 1. It's older than 24 hours AND has balance
        -- 2. OR it's currently outside business hours
        IF tab_age_hours > 24 THEN
            is_overdue := TRUE;
        ELSIF NOT is_within_business_hours_correct(v_bar_id, check_time) THEN
            is_overdue := TRUE;
        END IF;
    END IF;
    
    RETURN is_overdue;
END;
$$ LANGUAGE plpgsql;

-- Now manually update tabs that should be overdue based on age and business hours
UPDATE tabs 
SET 
    status = 'overdue',
    moved_to_overdue_at = NOW(),
    overdue_reason = 'Backfilled: Tab older than 24 hours with outstanding balance'
WHERE status = 'open'
  AND get_tab_balance(id) > 0
  AND (
    opened_at < NOW() - INTERVAL '24 hours'
    OR NOT is_within_business_hours_correct(bar_id, NOW())
  );

-- Show results
SELECT 
    'Manual Overdue Update' as analysis_type,
    COUNT(*) as tabs_marked_overdue
FROM tabs 
WHERE status = 'overdue' 
  AND overdue_reason = 'Backfilled: Tab older than 24 hours with outstanding balance';

-- Show final status
SELECT 
    'Final Status' as analysis_type,
    COUNT(*) as total_tabs,
    COUNT(CASE WHEN status = 'open' THEN 1 END) as open_tabs,
    COUNT(CASE WHEN status = 'overdue' THEN 1 END) as overdue_tabs,
    COUNT(CASE WHEN status = 'closed' THEN 1 END) as closed_tabs
FROM tabs;

-- Show tabs that are now overdue with their ages
SELECT 
    'Newly Overdue Tabs' as analysis_type,
    t.id,
    t.tab_number,
    t.status,
    get_tab_balance(t.id) as balance,
    t.opened_at,
    EXTRACT(EPOCH FROM (NOW() - t.opened_at)) / 3600 as age_hours,
    t.moved_to_overdue_at,
    t.overdue_reason,
    b.name as bar_name
FROM tabs t
JOIN bars b ON t.bar_id = b.id
WHERE t.status = 'overdue'
  AND t.overdue_reason = 'Backfilled: Tab older than 24 hours with outstanding balance'
ORDER BY t.moved_to_overdue_at DESC;
