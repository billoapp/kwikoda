-- Check the actual column names in bars table
SELECT 
    'Bars Table Columns' as analysis_type,
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public'
  AND table_name = 'bars'
ORDER BY ordinal_position;

-- Check if there are any business hours related columns
SELECT 
    'Business Hours Columns' as analysis_type,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_schema = 'public'
  AND table_name = 'bars'
  AND (
    column_name LIKE '%business%' 
    OR column_name LIKE '%hour%'
    OR column_name LIKE '%time%'
  )
ORDER BY column_name;

-- Show sample data from bars table
SELECT 
    'Sample Bar Data' as analysis_type,
    id,
    name,
    -- Try common business hours column names
    business_hours,
    business_24_hours,
    opening_hours,
    operating_hours,
    hours,
    time_settings
FROM bars 
LIMIT 3;
