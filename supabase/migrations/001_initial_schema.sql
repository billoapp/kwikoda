-- ============================================
-- Tabeza - SUPABASE DATABASE SCHEMA
-- Tab-first ordering system for bars
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- SUPPLIERS & CATALOG (Your Platform)
-- ============================================

-- Suppliers who pay to list products
CREATE TABLE suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    logo_url TEXT,
    subscription_tier TEXT CHECK (subscription_tier IN ('basic', 'featured', 'premium')),
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Central product catalog (NO PRICES - bars set their own)
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    supplier_id UUID REFERENCES suppliers(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    sku TEXT UNIQUE NOT NULL,
    category TEXT NOT NULL, -- Beer, Spirits, Wine, Soft Drinks
    image_url TEXT,
    description TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_products_supplier ON products(supplier_id);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_sku ON products(sku);

-- ============================================
-- BARS (Multi-tenant)
-- ============================================

CREATE TABLE bars (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    location TEXT,
    phone TEXT,
    email TEXT,
    webhook_url TEXT, -- For POS integration
    qr_code_url TEXT, -- For customers to scan
    subscription_tier TEXT CHECK (subscription_tier IN ('free', 'pro', 'enterprise')) DEFAULT 'free',
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bar adopts products from catalog and sets price
CREATE TABLE bar_products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bar_id UUID REFERENCES bars(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    sale_price NUMERIC(10,2) NOT NULL, -- Bar's selling price
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(bar_id, product_id)
);

CREATE INDEX idx_bar_products_bar ON bar_products(bar_id);
CREATE INDEX idx_bar_products_product ON bar_products(product_id);

-- Bar's custom items (food, specials, etc)
CREATE TABLE custom_products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bar_id UUID REFERENCES bars(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    price NUMERIC(10,2) NOT NULL,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_custom_products_bar ON custom_products(bar_id);

-- ============================================
-- TABS (Core System)
-- ============================================

CREATE TABLE tabs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bar_id UUID NOT NULL REFERENCES bars(id) ON DELETE CASCADE,
    tab_number INTEGER NOT NULL,
    owner_identifier TEXT, -- Phone hash or telegram ID
    status TEXT CHECK (status IN ('open', 'closing', 'closed', 'disputed')) DEFAULT 'open',
    opened_at TIMESTAMPTZ DEFAULT NOW(),
    closed_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(bar_id, tab_number)
);

CREATE INDEX idx_tabs_bar ON tabs(bar_id);
CREATE INDEX idx_tabs_status ON tabs(status);
CREATE INDEX idx_tabs_owner ON tabs(owner_identifier);

-- Auto-increment tab number per bar
CREATE SEQUENCE IF NOT EXISTS tab_number_seq;

CREATE OR REPLACE FUNCTION generate_tab_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.tab_number IS NULL THEN
        SELECT COALESCE(MAX(tab_number), 0) + 1 
        INTO NEW.tab_number
        FROM tabs 
        WHERE bar_id = NEW.bar_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_tab_number
    BEFORE INSERT ON tabs
    FOR EACH ROW
    EXECUTE FUNCTION generate_tab_number();

-- ============================================
-- ORDERS (Immutable snapshots)
-- ============================================

CREATE TABLE tab_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tab_id UUID NOT NULL REFERENCES tabs(id) ON DELETE CASCADE,
    items JSONB NOT NULL, -- Array of {product_id/custom_id, name, quantity, price}
    total NUMERIC(10,2) NOT NULL,
    status TEXT CHECK (status IN ('pending', 'confirmed', 'cancelled')) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_orders_tab ON tab_orders(tab_id);
CREATE INDEX idx_orders_status ON tab_orders(status);
CREATE INDEX idx_orders_created ON tab_orders(created_at);

-- ============================================
-- PAYMENTS
-- ============================================

CREATE TABLE tab_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tab_id UUID NOT NULL REFERENCES tabs(id) ON DELETE CASCADE,
    amount NUMERIC(10,2) NOT NULL,
    method TEXT CHECK (method IN ('mpesa', 'cash', 'card')) NOT NULL,
    status TEXT CHECK (status IN ('pending', 'success', 'failed')) DEFAULT 'pending',
    reference TEXT, -- M-Pesa reference or receipt number
    metadata JSONB, -- Additional payment info
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payments_tab ON tab_payments(tab_id);
CREATE INDEX idx_payments_method ON tab_payments(method);
CREATE INDEX idx_payments_status ON tab_payments(status);
CREATE INDEX idx_payments_created ON tab_payments(created_at);

-- ============================================
-- AUDIT LOG (Staff actions)
-- ============================================

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bar_id UUID REFERENCES bars(id) ON DELETE CASCADE,
    tab_id UUID REFERENCES tabs(id) ON DELETE SET NULL,
    staff_id UUID, -- Future: staff accounts
    action TEXT NOT NULL, -- close_tab, add_order, add_payment, write_off, etc
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_bar ON audit_logs(bar_id);
CREATE INDEX idx_audit_tab ON audit_logs(tab_id);
CREATE INDEX idx_audit_created ON audit_logs(created_at);

-- ============================================
-- VIEWS (Computed queries)
-- ============================================

-- Tab balance view
CREATE OR REPLACE VIEW tab_balances AS
SELECT 
    t.id AS tab_id,
    t.bar_id,
    t.tab_number,
    t.status,
    COALESCE(SUM(o.total), 0) AS total_orders,
    COALESCE(SUM(p.amount), 0) AS total_payments,
    COALESCE(SUM(o.total), 0) - COALESCE(SUM(p.amount), 0) AS balance
FROM tabs t
LEFT JOIN tab_orders o ON t.id = o.tab_id
LEFT JOIN tab_payments p ON t.id = p.tab_id AND p.status = 'success'
GROUP BY t.id, t.bar_id, t.tab_number, t.status;

-- Bar menu view (combines catalog + custom)
CREATE OR REPLACE VIEW bar_menu_view AS
-- Products from catalog
SELECT 
    bp.id,
    bp.bar_id,
    p.id AS product_id,
    NULL AS custom_product_id,
    p.name,
    p.category,
    p.image_url,
    bp.sale_price AS price,
    s.name AS supplier_name,
    p.sku,
    'catalog' AS source,
    bp.active
FROM bar_products bp
JOIN products p ON bp.product_id = p.id
JOIN suppliers s ON p.supplier_id = s.id
WHERE bp.active = true AND p.active = true

UNION ALL

-- Custom products
SELECT 
    cp.id,
    cp.bar_id,
    NULL AS product_id,
    cp.id AS custom_product_id,
    cp.name,
    cp.category,
    NULL AS image_url,
    cp.price,
    NULL AS supplier_name,
    NULL AS sku,
    'custom' AS source,
    cp.active
FROM custom_products cp
WHERE cp.active = true;

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE bars ENABLE ROW LEVEL SECURITY;
ALTER TABLE tabs ENABLE ROW LEVEL SECURITY;
ALTER TABLE tab_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE tab_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE bar_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_products ENABLE ROW LEVEL SECURITY;

-- Policy: Bars can only see their own data
CREATE POLICY bars_isolation ON bars
    FOR ALL
    USING (id = current_setting('app.current_bar_id', true)::UUID);

CREATE POLICY tabs_isolation ON tabs
    FOR ALL
    USING (bar_id = current_setting('app.current_bar_id', true)::UUID);

CREATE POLICY orders_isolation ON tab_orders
    FOR ALL
    USING (tab_id IN (
        SELECT id FROM tabs WHERE bar_id = current_setting('app.current_bar_id', true)::UUID
    ));

CREATE POLICY payments_isolation ON tab_payments
    FOR ALL
    USING (tab_id IN (
        SELECT id FROM tabs WHERE bar_id = current_setting('app.current_bar_id', true)::UUID
    ));

CREATE POLICY bar_products_isolation ON bar_products
    FOR ALL
    USING (bar_id = current_setting('app.current_bar_id', true)::UUID);

CREATE POLICY custom_products_isolation ON custom_products
    FOR ALL
    USING (bar_id = current_setting('app.current_bar_id', true)::UUID);

-- Public access to suppliers and products (catalog)
CREATE POLICY suppliers_public ON suppliers
    FOR SELECT
    USING (active = true);

CREATE POLICY products_public ON products
    FOR SELECT
    USING (active = true);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to close a tab
CREATE OR REPLACE FUNCTION close_tab(
    p_tab_id UUID,
    p_write_off_amount NUMERIC DEFAULT 0
)
RETURNS JSONB AS $$
DECLARE
    v_balance NUMERIC;
    v_result JSONB;
BEGIN
    -- Get current balance
    SELECT balance INTO v_balance
    FROM tab_balances
    WHERE tab_id = p_tab_id;
    
    -- If write-off needed, create payment
    IF v_balance > 0 AND p_write_off_amount > 0 THEN
        INSERT INTO tab_payments (tab_id, amount, method, status, reference)
        VALUES (p_tab_id, p_write_off_amount, 'cash', 'success', 'WRITE_OFF');
    END IF;
    
    -- Close the tab
    UPDATE tabs
    SET status = 'closed',
        closed_at = NOW(),
        updated_at = NOW()
    WHERE id = p_tab_id;
    
    -- Log action
    INSERT INTO audit_logs (tab_id, action, details)
    VALUES (
        p_tab_id, 
        'close_tab',
        jsonb_build_object('write_off', p_write_off_amount)
    );
    
    SELECT jsonb_build_object(
        'success', true,
        'tab_id', p_tab_id,
        'write_off', p_write_off_amount
    ) INTO v_result;
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Function to get tab summary
CREATE OR REPLACE FUNCTION get_tab_summary(p_tab_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'tab', row_to_json(t),
        'balance', tb.balance,
        'orders', (
            SELECT json_agg(row_to_json(o))
            FROM tab_orders o
            WHERE o.tab_id = p_tab_id
            ORDER BY o.created_at DESC
        ),
        'payments', (
            SELECT json_agg(row_to_json(p))
            FROM tab_payments p
            WHERE p.tab_id = p_tab_id
            ORDER BY p.created_at DESC
        )
    ) INTO v_result
    FROM tabs t
    JOIN tab_balances tb ON t.id = tb.tab_id
    WHERE t.id = p_tab_id;
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- SEED DATA (Optional - for testing)
-- ============================================

-- Insert sample suppliers
INSERT INTO suppliers (name, logo_url, subscription_tier) VALUES
('East African Breweries Ltd', '/logos/eabl.png', 'premium'),
('Kenya Wine Agencies Ltd', '/logos/kwal.png', 'featured'),
('Africa Wines & Spirits', '/logos/aws.png', 'basic'),
('Coca-Cola East Africa', '/logos/cocacola.png', 'featured');

-- Insert sample products (no prices!)
INSERT INTO products (supplier_id, name, sku, category) VALUES
((SELECT id FROM suppliers WHERE name = 'East African Breweries Ltd'), 'Tusker Lager 500ml', 'TUS500', 'Beer'),
((SELECT id FROM suppliers WHERE name = 'East African Breweries Ltd'), 'Tusker Malt 500ml', 'TUSM500', 'Beer'),
((SELECT id FROM suppliers WHERE name = 'East African Breweries Ltd'), 'Guinness 500ml', 'GUI500', 'Beer'),
((SELECT id FROM suppliers WHERE name = 'Kenya Wine Agencies Ltd'), 'Smirnoff Vodka 750ml', 'SMI750', 'Spirits'),
((SELECT id FROM suppliers WHERE name = 'Kenya Wine Agencies Ltd'), 'Johnnie Walker Red', 'JWR750', 'Spirits'),
((SELECT id FROM suppliers WHERE name = 'Coca-Cola East Africa'), 'Coca-Cola 300ml', 'COKE300', 'Soft Drinks'),
((SELECT id FROM suppliers WHERE name = 'Coca-Cola East Africa'), 'Dasani Water 500ml', 'DAS500', 'Soft Drinks');

-- Insert a test bar
INSERT INTO bars (name, location, phone, subscription_tier) VALUES
('The Spot Lounge', 'Westlands, Nairobi', '+254712345678', 'pro');

-- Bar adopts products with their prices
INSERT INTO bar_products (bar_id, product_id, sale_price) VALUES
((SELECT id FROM bars LIMIT 1), (SELECT id FROM products WHERE sku = 'TUS500'), 300),
((SELECT id FROM bars LIMIT 1), (SELECT id FROM products WHERE sku = 'GUI500'), 350),
((SELECT id FROM bars LIMIT 1), (SELECT id FROM products WHERE sku = 'SMI750'), 2500),
((SELECT id FROM bars LIMIT 1), (SELECT id FROM products WHERE sku = 'COKE300'), 100);

-- Add custom items (food)
INSERT INTO custom_products (bar_id, name, category, price) VALUES
((SELECT id FROM bars LIMIT 1), 'Nyama Choma', 'Food', 1200),
((SELECT id FROM bars LIMIT 1), 'Chicken Wings', 'Food', 800),
((SELECT id FROM bars LIMIT 1), 'Chips Masala', 'Food', 400);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX idx_tabs_bar_status ON tabs(bar_id, status);
CREATE INDEX idx_orders_tab_created ON tab_orders(tab_id, created_at DESC);
CREATE INDEX idx_payments_tab_created ON tab_payments(tab_id, created_at DESC);

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bars_updated_at BEFORE UPDATE ON bars
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tabs_updated_at BEFORE UPDATE ON tabs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON tab_orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON tab_payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- COMMENTS (Documentation)
-- ============================================

COMMENT ON TABLE suppliers IS 'Suppliers who pay to list products in catalog';
COMMENT ON TABLE products IS 'Central product catalog - NO PRICES (bars set their own)';
COMMENT ON TABLE bars IS 'Multi-tenant bars using the system';
COMMENT ON TABLE bar_products IS 'Bar adopts catalog products and sets sale price';
COMMENT ON TABLE custom_products IS 'Bar-specific items (food, specials)';
COMMENT ON TABLE tabs IS 'Customer tabs - source of truth';
COMMENT ON TABLE tab_orders IS 'Immutable order snapshots';
COMMENT ON TABLE tab_payments IS 'Payments attached to tabs';
COMMENT ON TABLE audit_logs IS 'Staff actions for compliance';

COMMENT ON VIEW tab_balances IS 'Computed: total_orders - total_payments';
COMMENT ON VIEW bar_menu_view IS 'Combined view: catalog + custom products';

-- ============================================
-- END OF SCHEMA
-- ============================================

-- Verify setup
SELECT 'Schema created successfully!' AS status;