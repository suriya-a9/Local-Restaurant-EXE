CREATE TABLE IF NOT EXISTS customers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    business_location_id uuid NOT NULL REFERENCES business_locations(id) ON DELETE CASCADE,
    name varchar(255) NOT NULL,
    mobile_number varchar(30) NOT NULL,
    address text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (client_id, business_location_id, mobile_number)
);

CREATE INDEX IF NOT EXISTS customers_client_location_idx
    ON customers (client_id, business_location_id, created_at DESC);