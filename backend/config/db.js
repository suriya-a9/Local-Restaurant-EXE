const { Pool } = require("pg");
require("dotenv").config();
const config = require("./default.js");
const logger = require("../logger");

const pool = new Pool({
    user: config.db_user,
    host: config.db_host,
    database: config.db_name,
    password: config.db_password,
    port: config.db_port,
});

pool.connect()
    .then(() => logger.info("PostgreSQL Connected"))
    .catch(err => logger.error("Connection Error:", err));

const saleNumberMigration = pool.query(`
    DO $$
    BEGIN
        IF EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_name = 'pos_sales' AND column_name = 'sale_number'
        ) THEN
            ALTER TABLE pos_sales ALTER COLUMN sale_number DROP NOT NULL;
        END IF;
    END
    $$;
`).catch((error) => {
    logger.error("Sale number compatibility migration failed:", error);
    throw error;
});

pool.query("ALTER TABLE products ADD COLUMN IF NOT EXISTS shortcut_number integer")
    .catch((error) => logger.error("Product shortcut migration failed:", error));

pool.saleNumberMigration = saleNumberMigration;
const cashSessionMigration = pool.query(`
CREATE TABLE IF NOT EXISTS pos_cash_sessions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
 business_location_id uuid NOT NULL REFERENCES business_locations(id) ON DELETE CASCADE, business_date date NOT NULL,
 opening_amount numeric(12,2) NOT NULL DEFAULT 0, closing_amount numeric(12,2), expected_cash numeric(12,2), difference_amount numeric(12,2),
 status varchar(10) NOT NULL DEFAULT 'open' CHECK(status IN ('open','closed')), opened_at timestamptz NOT NULL DEFAULT now(), closed_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(client_id,business_location_id,business_date)
);
`).catch((error)=>{ logger.error("Cash session migration failed:", error); throw error; });
pool.cashSessionMigration = cashSessionMigration;


module.exports = pool;