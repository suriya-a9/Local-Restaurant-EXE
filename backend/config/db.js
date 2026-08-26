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

module.exports = pool;