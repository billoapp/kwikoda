-- Set proper business hours and fix overdue logic
-- The issue: tabs created days ago should be overdue regardless of current time

-- First, set default business hours for all bars that don't have them
UPDATE bars 
SET business_hours = '{"enabled": true, "type": "simple", "simple": {"open": "09:00", "close": "23:00"}}'
WHERE business_hours IS NULL OR business_hours = '{}';

-- Show which bars were updated
SELECT 
    'Business Hours Updated' as analysis_type,
    COUNT(*) as bars_updated,
    STRING_AGG(name, ', ') as updated_bars
FROM bars 
WHERE business_hours IS NOT NULL
  AND business_hours->>'type' = 'simple'
  AND business_hours->'simple'->>'open' = '09:00'
  AND business_hours->'simple'->>'close' = '23:00';

-- Now create a better overdue logic that considers tab age
CREATE OR REPLACE FUNCTION should_tab_be_overdue(p_tab_id UUID)
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
        ELSIF NOT is_within_business_hours_for_overdue(v_bar_id, check_time) THEN
            is_overdue := TRUE;
        END IF;
    END IF;
    
    RETURN is_overdue;
END;
$$ LANGUAGE plpgsql;

-- Now manually update tabs that should be overdue based on age
UPDATE tabs 
SET 
    status = 'overdue',
    moved_to_overdue_at = NOW(),
    overdue_reason = 'Backfilled: Tab older than 24 hours with outstanding balance'
WHERE status = 'open'
  AND get_tab_balance(id) > 0
  AND opened_at < NOW() - INTERVAL '24 hours';

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
