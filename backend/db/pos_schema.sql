CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS pos_sales (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    business_location_id uuid NOT NULL REFERENCES business_locations(id) ON DELETE RESTRICT,
    invoice_number varchar(50) NOT NULL UNIQUE,
    sale_type varchar(20) NOT NULL DEFAULT 'dining'
        CHECK (sale_type IN ('dining', 'parcel', 'zomato', 'swiggy', 'delivery')),
    customer_name varchar(255) NOT NULL DEFAULT 'Walk-In Customer',
    subtotal numeric(12,2) NOT NULL CHECK (subtotal >= 0),
    discount_amount numeric(12,2) NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
    order_tax_amount numeric(12,2) NOT NULL DEFAULT 0 CHECK (order_tax_amount >= 0),
    round_off_amount numeric(12,2) NOT NULL DEFAULT 0,
    total_amount numeric(12,2) NOT NULL CHECK (total_amount >= 0),
    payment_status varchar(20) NOT NULL DEFAULT 'paid'
        CHECK (payment_status IN ('paid', 'partial', 'credit', 'cancelled')),
    status varchar(20) NOT NULL DEFAULT 'completed'
        CHECK (status IN ('completed', 'cancelled')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pos_sale_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id uuid NOT NULL REFERENCES pos_sales(id) ON DELETE CASCADE,
    product_id uuid NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity numeric(12,3) NOT NULL CHECK (quantity > 0),
    unit_price_inc_tax numeric(12,2) NOT NULL CHECK (unit_price_inc_tax >= 0),
    discount_amount numeric(12,2) NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
    line_total numeric(12,2) NOT NULL CHECK (line_total >= 0),
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pos_sale_payments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id uuid NOT NULL REFERENCES pos_sales(id) ON DELETE CASCADE,
    payment_method varchar(20) NOT NULL
        CHECK (payment_method IN ('cash', 'card', 'gpay', 'credit')),
    amount numeric(12,2) NOT NULL CHECK (amount > 0),
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS pos_sales_client_location_idx
    ON pos_sales (client_id, business_location_id, created_at DESC);

CREATE INDEX IF NOT EXISTS pos_sale_items_sale_idx
    ON pos_sale_items (sale_id);

CREATE INDEX IF NOT EXISTS pos_sale_payments_sale_idx
    ON pos_sale_payments (sale_id);