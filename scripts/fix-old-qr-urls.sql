-- scripts/fix-old-qr-urls.sql
-- Preview rows that contain the old domain
SELECT id, slug, static_menu_url, (CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bars' AND column_name='qr_url') THEN qr_url ELSE NULL END) AS qr_url
FROM bars
WHERE (static_menu_url IS NOT NULL AND static_menu_url LIKE '%mteja.vercel.app%')
   OR (COALESCE(NULLIF((CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bars' AND column_name='qr_url') THEN qr_url ELSE NULL END), ''), '') LIKE '%mteja.vercel.app%')
LIMIT 100;

-- If you want to update stored URLs in place, run one of the following (UNCOMMENT to execute):
-- Note: test/preview the SELECT above before running updates.

-- Update static_menu_url if it contains the old domain
-- UPDATE bars
-- SET static_menu_url = REPLACE(static_menu_url, 'https://mteja.vercel.app/?bar=', 'https://tabz-mteja.vercel.app/menu?bar=')
-- WHERE static_menu_url LIKE '%mteja.vercel.app%';

-- Update qr_url column if it exists
-- UPDATE bars
-- SET qr_url = REPLACE(qr_url, 'https://mteja.vercel.app/?bar=', 'https://tabz-mteja.vercel.app/menu?bar=')
-- WHERE EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bars' AND column_name='qr_url')
--   AND qr_url LIKE '%mteja.vercel.app%';

-- If you do not control the mteja.vercel.app domain and many printed QR codes exist, consider adding an HTTP redirect from mteja.vercel.app to the new origin to avoid broken QR codes.