function runMigrations(db) {
    db.pragma("foreign_keys = ON");

    // =========================================================
    // LOCAL APPLICATION CONFIG
    // =========================================================

    db.exec(`
    CREATE TABLE IF NOT EXISTS app_config (
      key TEXT PRIMARY KEY,
      value TEXT,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

    // =========================================================
    // LOCAL OFFLINE LOGIN CACHE
    // =========================================================

    db.exec(`
    CREATE TABLE IF NOT EXISTS local_auth_users (
      name TEXT PRIMARY KEY,
      password_hash TEXT NOT NULL,
      user_json TEXT NOT NULL,
      subscription_json TEXT,
      portal TEXT NOT NULL DEFAULT 'client',
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

    const localAuthColumns = db.prepare("PRAGMA table_info(local_auth_users)").all();
    if (localAuthColumns.some((column) => column.name === "email") && !localAuthColumns.some((column) => column.name === "name")) {
      db.exec("ALTER TABLE local_auth_users RENAME COLUMN email TO name");
    }
    if (!localAuthColumns.some((column) => column.name === "server_token")) {
      db.exec("ALTER TABLE local_auth_users ADD COLUMN server_token TEXT");
    }

    // =========================================================
    // ROLES
    // =========================================================

    db.exec(`
    CREATE TABLE IF NOT EXISTS roles (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

    // =========================================================
    // BUSINESS LOCATIONS
    // =========================================================

    db.exec(`
    CREATE TABLE IF NOT EXISTS business_locations (
      id TEXT PRIMARY KEY,
      client_id TEXT NOT NULL,

      name TEXT NOT NULL,
      code TEXT NOT NULL,
      gst_number TEXT,

      address TEXT,
      city TEXT,
      state TEXT,
      country TEXT,
      postal_code TEXT,

      phone TEXT,
      email TEXT,

      is_primary INTEGER NOT NULL DEFAULT 0,

      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,

      UNIQUE(client_id, code)
    );
  `);

    // =========================================================
    // CATEGORIES
    // =========================================================

    db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      client_id TEXT NOT NULL,

      name TEXT NOT NULL,
      description TEXT,

      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,

      UNIQUE(client_id, name)
    );
  `);

    // =========================================================
    // SUB CATEGORIES
    // =========================================================

    db.exec(`
    CREATE TABLE IF NOT EXISTS sub_categories (
      id TEXT PRIMARY KEY,
      client_id TEXT NOT NULL,
      category_id TEXT NOT NULL,

      name TEXT NOT NULL,

      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,

      FOREIGN KEY (category_id)
        REFERENCES categories(id)
        ON DELETE CASCADE,

      UNIQUE(category_id, name)
    );
  `);

    // =========================================================
    // UNITS
    // =========================================================

    db.exec(`
    CREATE TABLE IF NOT EXISTS units (
      id TEXT PRIMARY KEY,
      client_id TEXT NOT NULL,

      name TEXT NOT NULL,
      short_name TEXT NOT NULL,

      allow_decimal INTEGER NOT NULL DEFAULT 0,

      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,

      UNIQUE(client_id, name),
      UNIQUE(client_id, short_name)
    );
  `);

    // =========================================================
    // TAX RATES
    // =========================================================

    db.exec(`
    CREATE TABLE IF NOT EXISTS tax_rates (
      id TEXT PRIMARY KEY,
      client_id TEXT NOT NULL,

      name TEXT NOT NULL,
      rate_percent REAL NOT NULL DEFAULT 0,
      tax_type TEXT NOT NULL DEFAULT 'gst',
      is_active INTEGER NOT NULL DEFAULT 1,

      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

    // =========================================================
    // EMPLOYEES
    // =========================================================

    db.exec(`
    CREATE TABLE IF NOT EXISTS employees (
      id TEXT PRIMARY KEY,

      client_id TEXT NOT NULL,
      business_location_id TEXT NOT NULL,
      role_id TEXT NOT NULL,

      name TEXT NOT NULL,
      email TEXT NOT NULL,
      password TEXT NOT NULL,

      phone TEXT,
      designation TEXT,
      date_of_joining TEXT,
      salary REAL,

      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,

      FOREIGN KEY (business_location_id)
        REFERENCES business_locations(id),

      FOREIGN KEY (role_id)
        REFERENCES roles(id),

      UNIQUE(client_id, email)
    );
  `);

    // =========================================================
    // PRODUCTS
    // =========================================================

    db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      client_id TEXT NOT NULL,

      name TEXT NOT NULL,

      sku TEXT NOT NULL,
      barcode TEXT,
      shortcut_number INTEGER,
      image TEXT,

      unit_id TEXT,
      category_id TEXT,
      sub_category_id TEXT,
      applicable_tax_id TEXT,

      product_type TEXT NOT NULL DEFAULT 'single',

      selling_price_tax_type TEXT NOT NULL DEFAULT 'exclusive',

      enable_stock INTEGER NOT NULL DEFAULT 0,

      alert_quantity INTEGER,

      margin_percent REAL DEFAULT 0,

      default_purchase_price_exc_tax REAL DEFAULT 0,
      default_purchase_price_inc_tax REAL DEFAULT 0,

      default_selling_price_exc_tax REAL DEFAULT 0,
      default_selling_price_inc_tax REAL DEFAULT 0,

      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,

      FOREIGN KEY (unit_id)
        REFERENCES units(id),

      FOREIGN KEY (category_id)
        REFERENCES categories(id),

      FOREIGN KEY (sub_category_id)
        REFERENCES sub_categories(id),

      FOREIGN KEY (applicable_tax_id)
        REFERENCES tax_rates(id),

      UNIQUE(client_id, sku)
    );
  `);

    try { db.exec("ALTER TABLE products ADD COLUMN shortcut_number INTEGER"); } catch (error) { if (!error.message.includes("duplicate column name")) throw error; }

    // =========================================================
    // PRODUCT -> BUSINESS LOCATION
    // =========================================================

    db.exec(`
    CREATE TABLE IF NOT EXISTS product_business_locations (
      product_id TEXT NOT NULL,
      business_location_id TEXT NOT NULL,

      PRIMARY KEY (
        product_id,
        business_location_id
      ),

      FOREIGN KEY (product_id)
        REFERENCES products(id)
        ON DELETE CASCADE,

      FOREIGN KEY (business_location_id)
        REFERENCES business_locations(id)
        ON DELETE CASCADE
    );
  `);

    // =========================================================
    // CUSTOMERS
    // =========================================================

    db.exec(`
    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,

      client_id TEXT NOT NULL,
      business_location_id TEXT NOT NULL,

      name TEXT NOT NULL,
      mobile_number TEXT NOT NULL,
      address TEXT,

      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,

      FOREIGN KEY (business_location_id)
        REFERENCES business_locations(id)
        ON DELETE CASCADE,

      UNIQUE(
        client_id,
        business_location_id,
        mobile_number
      )
    );
  `);

    // =========================================================
    // RESTAURANT TABLES
    // =========================================================

    db.exec(`
    CREATE TABLE IF NOT EXISTS restaurant_tables (
      id TEXT PRIMARY KEY,

      client_id TEXT NOT NULL,
      business_location_id TEXT NOT NULL,

      name TEXT NOT NULL,
      capacity INTEGER,

      status TEXT NOT NULL DEFAULT 'available',

      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,

      FOREIGN KEY (business_location_id)
        REFERENCES business_locations(id)
        ON DELETE CASCADE
    );
  `);

    // =========================================================
    // KOT PRINTER SETTINGS
    // =========================================================

    db.exec(`
    CREATE TABLE IF NOT EXISTS kot_printer_settings (
      id TEXT PRIMARY KEY,

      client_id TEXT NOT NULL,
      business_location_id TEXT NOT NULL,

      system_ip TEXT,

      billing_printer_ip TEXT,
      billing_printer_port INTEGER,

      default_kot_ip TEXT,
      default_kot_port INTEGER,

      has_extra_kot INTEGER NOT NULL DEFAULT 0,

      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,

      FOREIGN KEY (business_location_id)
        REFERENCES business_locations(id)
        ON DELETE CASCADE,

      UNIQUE(client_id, business_location_id)
    );
  `);

    // =========================================================
    // KOT PRINTER STATIONS
    // =========================================================

    db.exec(`
    CREATE TABLE IF NOT EXISTS kot_printer_stations (
      id TEXT PRIMARY KEY,

      kot_printer_settings_id TEXT NOT NULL,
      category_id TEXT,

      printer_ip TEXT NOT NULL,
      printer_port INTEGER NOT NULL,

      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,

      FOREIGN KEY (kot_printer_settings_id)
        REFERENCES kot_printer_settings(id)
        ON DELETE CASCADE,

      FOREIGN KEY (category_id)
        REFERENCES categories(id)
        ON DELETE SET NULL
    );
  `);

    // =========================================================
    // POS SALES
    // =========================================================

    db.exec(`
    CREATE TABLE IF NOT EXISTS pos_sales (
      id TEXT PRIMARY KEY,

      client_id TEXT NOT NULL,
      business_location_id TEXT NOT NULL,

      invoice_number TEXT NOT NULL UNIQUE,
      sale_number INTEGER,

      sale_type TEXT NOT NULL DEFAULT 'dining',

      customer_name TEXT NOT NULL DEFAULT 'Walk-In Customer',

      subtotal REAL NOT NULL DEFAULT 0,

      discount_amount REAL NOT NULL DEFAULT 0,
      order_tax_amount REAL NOT NULL DEFAULT 0,
      round_off_amount REAL NOT NULL DEFAULT 0,

      total_amount REAL NOT NULL DEFAULT 0,

      payment_status TEXT NOT NULL DEFAULT 'paid',

      status TEXT NOT NULL DEFAULT 'completed',

      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,

      FOREIGN KEY (business_location_id)
        REFERENCES business_locations(id)
    );
  `);

    // Existing installations may already have pos_sales without sale_number.
    const posSaleColumns = db.prepare("PRAGMA table_info(pos_sales)").all();
    if (!posSaleColumns.some((column) => column.name === "sale_number")) {
      db.exec("ALTER TABLE pos_sales ADD COLUMN sale_number INTEGER");
    }

    // =========================================================
    // POS SALE ITEMS
    // =========================================================

    db.exec(`
    CREATE TABLE IF NOT EXISTS pos_sale_items (
      id TEXT PRIMARY KEY,

      sale_id TEXT NOT NULL,
      product_id TEXT NOT NULL,

      quantity REAL NOT NULL,

      unit_price_inc_tax REAL NOT NULL,

      discount_amount REAL NOT NULL DEFAULT 0,

      line_total REAL NOT NULL,

      created_at TEXT DEFAULT CURRENT_TIMESTAMP,

      FOREIGN KEY (sale_id)
        REFERENCES pos_sales(id)
        ON DELETE CASCADE,

      FOREIGN KEY (product_id)
        REFERENCES products(id)
    );
  `);

    // =========================================================
    // POS PAYMENTS
    // =========================================================

    db.exec(`
    CREATE TABLE IF NOT EXISTS pos_sale_payments (
      id TEXT PRIMARY KEY,

      sale_id TEXT NOT NULL,

      payment_method TEXT NOT NULL,

      amount REAL NOT NULL,

      created_at TEXT DEFAULT CURRENT_TIMESTAMP,

      FOREIGN KEY (sale_id)
        REFERENCES pos_sales(id)
        ON DELETE CASCADE
    );
  `);

    // =========================================================
    // SYNC QUEUE
    // =========================================================

    db.exec(`
    CREATE TABLE IF NOT EXISTS sync_queue (
      id TEXT PRIMARY KEY,

      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,

      action TEXT NOT NULL,

      payload TEXT NOT NULL,

      status TEXT NOT NULL DEFAULT 'pending',

      retry_count INTEGER NOT NULL DEFAULT 0,

      last_error TEXT,

      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      synced_at TEXT
    );
  `);

    // =========================================================
    // INDEXES
    // =========================================================

    db.exec(`
    CREATE INDEX IF NOT EXISTS idx_business_locations_client
    ON business_locations(client_id);

    CREATE INDEX IF NOT EXISTS idx_categories_client
    ON categories(client_id);

    CREATE INDEX IF NOT EXISTS idx_sub_categories_client
    ON sub_categories(client_id);

    CREATE INDEX IF NOT EXISTS idx_products_client
    ON products(client_id);

    CREATE INDEX IF NOT EXISTS idx_products_name
    ON products(name);

    CREATE INDEX IF NOT EXISTS idx_products_sku
    ON products(sku);

    CREATE INDEX IF NOT EXISTS idx_customers_client_location
    ON customers(client_id, business_location_id);

    CREATE INDEX IF NOT EXISTS idx_pos_sales_client_location
    ON pos_sales(client_id, business_location_id, created_at);

    CREATE INDEX IF NOT EXISTS idx_pos_sale_items_sale
    ON pos_sale_items(sale_id);

    CREATE INDEX IF NOT EXISTS idx_pos_sale_payments_sale
    ON pos_sale_payments(sale_id);

    CREATE INDEX IF NOT EXISTS idx_sync_queue_status
    ON sync_queue(status, created_at);
  `);
}

module.exports = {
    runMigrations,
};