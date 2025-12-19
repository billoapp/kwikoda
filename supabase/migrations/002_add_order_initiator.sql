-- Add initiated_by field to track order origin
ALTER TABLE tab_orders 
ADD COLUMN initiated_by TEXT CHECK (initiated_by IN ('customer', 'staff')) DEFAULT 'customer';

-- Add index for filtering
CREATE INDEX idx_orders_initiated_by ON tab_orders(initiated_by);

-- Update existing orders to default to 'customer'
UPDATE tab_orders 
SET initiated_by = 'customer' 
WHERE initiated_by IS NULL;

-- Add comment
COMMENT ON COLUMN tab_orders.initiated_by IS 'Who initiated the order: customer or staff';
