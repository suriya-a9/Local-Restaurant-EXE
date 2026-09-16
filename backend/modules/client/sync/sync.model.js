const pool = require("../../../config/db");

async function upsertSnapshot(clientId, snapshot) {
  await pool.cashSessionMigration;
  const db = await pool.connect();
  const counts = {};
  const rows = (name) => Array.isArray(snapshot?.[name]) ? snapshot[name] : [];
  const count = (name, n = 1) => { counts[name] = (counts[name] || 0) + n; };

  try {
    await db.query("BEGIN");

    for (const r of rows("business_locations")) {
      await db.query(`INSERT INTO business_locations
        (id,client_id,name,code,gst_number,address,city,state,country,postal_code,phone,email,is_primary,created_at,updated_at)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
        ON CONFLICT(id) DO UPDATE SET name=EXCLUDED.name,code=EXCLUDED.code,gst_number=EXCLUDED.gst_number,
          address=EXCLUDED.address,city=EXCLUDED.city,state=EXCLUDED.state,country=EXCLUDED.country,
          postal_code=EXCLUDED.postal_code,phone=EXCLUDED.phone,email=EXCLUDED.email,is_primary=EXCLUDED.is_primary,
          updated_at=EXCLUDED.updated_at
        WHERE business_locations.client_id=$2`,
        [r.id, clientId, r.name, r.code, r.gst_number || null, r.address || null, r.city || null, r.state || null, r.country || null,
        r.postal_code || null, r.phone || null, r.email || null, !!r.is_primary, r.created_at || new Date(), r.updated_at || new Date()]);
      count("business_locations");
    }

    for (const r of rows("categories")) {
      await db.query(`INSERT INTO categories(id,client_id,name,description,created_at,updated_at)
        VALUES($1,$2,$3,$4,$5,$6)
        ON CONFLICT(id) DO UPDATE SET name=EXCLUDED.name,description=EXCLUDED.description,updated_at=EXCLUDED.updated_at
        WHERE categories.client_id=$2`, [r.id, clientId, r.name, r.description || null, r.created_at || new Date(), r.updated_at || new Date()]);
      count("categories");
    }

    for (const r of rows("sub_categories")) {
      await db.query(`INSERT INTO sub_categories(id,client_id,category_id,name,created_at,updated_at)
        VALUES($1,$2,$3,$4,$5,$6)
        ON CONFLICT(id) DO UPDATE SET category_id=EXCLUDED.category_id,name=EXCLUDED.name,updated_at=EXCLUDED.updated_at
        WHERE sub_categories.client_id=$2`, [r.id, clientId, r.category_id, r.name, r.created_at || new Date(), r.updated_at || new Date()]);
      count("sub_categories");
    }

    for (const r of rows("units")) {
      await db.query(`INSERT INTO units(id,client_id,name,short_name,allow_decimal,created_at,updated_at)
        VALUES($1,$2,$3,$4,$5,$6,$7)
        ON CONFLICT(id) DO UPDATE SET name=EXCLUDED.name,short_name=EXCLUDED.short_name,allow_decimal=EXCLUDED.allow_decimal,
          updated_at=EXCLUDED.updated_at WHERE units.client_id=$2`,
        [r.id, clientId, r.name, r.short_name, !!r.allow_decimal, r.created_at || new Date(), r.updated_at || new Date()]);
      count("units");
    }

    for (const r of rows("tax_rates")) {
      await db.query(`INSERT INTO tax_rates(id,client_id,name,rate_percent,tax_type,is_active,created_at,updated_at)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8)
        ON CONFLICT(id) DO UPDATE SET name=EXCLUDED.name,rate_percent=EXCLUDED.rate_percent,tax_type=EXCLUDED.tax_type,
          is_active=EXCLUDED.is_active,updated_at=EXCLUDED.updated_at WHERE tax_rates.client_id=$2`,
        [r.id, clientId, r.name, r.rate_percent, r.tax_type || "gst", !!r.is_active, r.created_at || new Date(), r.updated_at || new Date()]);
      count("tax_rates");
    }

    for (const r of rows("restaurant_tables")) {
      await db.query(`INSERT INTO restaurant_tables(id,client_id,business_location_id,name,capacity,status,created_at,updated_at)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8)
        ON CONFLICT(id) DO UPDATE SET business_location_id=EXCLUDED.business_location_id,name=EXCLUDED.name,
          capacity=EXCLUDED.capacity,status=EXCLUDED.status,updated_at=EXCLUDED.updated_at
        WHERE restaurant_tables.client_id=$2`,
        [r.id, clientId, r.business_location_id, r.name, r.capacity ?? null, r.status || "available", r.created_at || new Date(), r.updated_at || new Date()]);
      count("restaurant_tables");
    }

    for (const r of rows("customers")) {
      await db.query(`INSERT INTO customers(id,client_id,business_location_id,name,mobile_number,address,created_at,updated_at)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8)
        ON CONFLICT(id) DO UPDATE SET business_location_id=EXCLUDED.business_location_id,name=EXCLUDED.name,
          mobile_number=EXCLUDED.mobile_number,address=EXCLUDED.address,updated_at=EXCLUDED.updated_at
        WHERE customers.client_id=$2`,
        [r.id, clientId, r.business_location_id, r.name, r.mobile_number, r.address || null, r.created_at || new Date(), r.updated_at || new Date()]);
      count("customers");
    }

    for (const r of rows("employees")) {
      let roleId = null;
      if (r.role_name) {
        const role = await db.query(`SELECT id FROM roles WHERE LOWER(name)=LOWER($1) LIMIT 1`, [r.role_name]);
        roleId = role.rows[0]?.id || null;
      }
      if (!roleId) continue;
      await db.query(`INSERT INTO employees(id,client_id,business_location_id,role_id,name,email,password,phone,designation,date_of_joining,salary,created_at,updated_at)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
        ON CONFLICT(id) DO UPDATE SET business_location_id=EXCLUDED.business_location_id,role_id=EXCLUDED.role_id,
          name=EXCLUDED.name,email=EXCLUDED.email,password=EXCLUDED.password,phone=EXCLUDED.phone,
          designation=EXCLUDED.designation,date_of_joining=EXCLUDED.date_of_joining,salary=EXCLUDED.salary,
          updated_at=EXCLUDED.updated_at WHERE employees.client_id=$2`,
        [r.id, clientId, r.business_location_id, roleId, r.name, r.email, r.password, r.phone || null, r.designation || null,
        r.date_of_joining || null, r.salary ?? null, r.created_at || new Date(), r.updated_at || new Date()]);
      count("employees");
    }

    for (const r of rows("products")) {
      await db.query(`INSERT INTO products
        (id,client_id,name,sku,barcode,shortcut_number,image,unit_id,category_id,sub_category_id,applicable_tax_id,product_type,
         selling_price_tax_type,enable_stock,alert_quantity,margin_percent,default_purchase_price_exc_tax,
         default_purchase_price_inc_tax,default_selling_price_exc_tax,default_selling_price_inc_tax,created_at,updated_at)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22)
        ON CONFLICT(id) DO UPDATE SET name=EXCLUDED.name,sku=EXCLUDED.sku,barcode=EXCLUDED.barcode,shortcut_number=EXCLUDED.shortcut_number,image=EXCLUDED.image,
          unit_id=EXCLUDED.unit_id,category_id=EXCLUDED.category_id,sub_category_id=EXCLUDED.sub_category_id,
          applicable_tax_id=EXCLUDED.applicable_tax_id,product_type=EXCLUDED.product_type,
          selling_price_tax_type=EXCLUDED.selling_price_tax_type,enable_stock=EXCLUDED.enable_stock,
          alert_quantity=EXCLUDED.alert_quantity,margin_percent=EXCLUDED.margin_percent,
          default_purchase_price_exc_tax=EXCLUDED.default_purchase_price_exc_tax,
          default_purchase_price_inc_tax=EXCLUDED.default_purchase_price_inc_tax,
          default_selling_price_exc_tax=EXCLUDED.default_selling_price_exc_tax,
          default_selling_price_inc_tax=EXCLUDED.default_selling_price_inc_tax,updated_at=EXCLUDED.updated_at
        WHERE products.client_id=$2`,
        [r.id, clientId, r.name, r.sku, r.barcode || null, r.shortcut_number ?? null, r.image || null, r.unit_id || null, r.category_id || null, r.sub_category_id || null,
        r.applicable_tax_id || null, r.product_type || "single", r.selling_price_tax_type || "exclusive", !!r.enable_stock,
        r.alert_quantity ?? null, r.margin_percent || 0, r.default_purchase_price_exc_tax || 0, r.default_purchase_price_inc_tax || 0,
        r.default_selling_price_exc_tax || 0, r.default_selling_price_inc_tax || 0, r.created_at || new Date(), r.updated_at || new Date()]);
      count("products");
    }

    const productIds = rows("products").map(r => r.id);
    if (productIds.length) {
      await db.query(`DELETE FROM product_business_locations WHERE product_id = ANY($1::uuid[])`, [productIds]);
      for (const r of rows("product_business_locations")) {
        await db.query(`INSERT INTO product_business_locations(product_id,business_location_id) VALUES($1,$2) ON CONFLICT DO NOTHING`, [r.product_id, r.business_location_id]);
        count("product_business_locations");
      }
    }

    for (const r of rows("kot_printer_settings")) {
      await db.query(`INSERT INTO kot_printer_settings
        (id,client_id,business_location_id,system_ip,billing_printer_ip,billing_printer_port,default_kot_ip,default_kot_port,has_extra_kot,created_at,updated_at)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
        ON CONFLICT(id) DO UPDATE SET business_location_id=EXCLUDED.business_location_id,system_ip=EXCLUDED.system_ip,
          billing_printer_ip=EXCLUDED.billing_printer_ip,billing_printer_port=EXCLUDED.billing_printer_port,
          default_kot_ip=EXCLUDED.default_kot_ip,default_kot_port=EXCLUDED.default_kot_port,has_extra_kot=EXCLUDED.has_extra_kot,
          updated_at=EXCLUDED.updated_at WHERE kot_printer_settings.client_id=$2`,
        [r.id, clientId, r.business_location_id, r.system_ip || null, r.billing_printer_ip || null, r.billing_printer_port ?? 9100,
        r.default_kot_ip || null, r.default_kot_port ?? 9100, r.has_extra_kot ? "yes" : "no", r.created_at || new Date(), r.updated_at || new Date()]);
      count("kot_printer_settings");
    }

    const settingsIds = rows("kot_printer_settings").map(r => r.id);
    if (settingsIds.length) {
      await db.query(`DELETE FROM kot_printer_stations WHERE kot_printer_settings_id = ANY($1::uuid[])`, [settingsIds]);
      for (const r of rows("kot_printer_stations")) {
        await db.query(`INSERT INTO kot_printer_stations(id,kot_printer_settings_id,category_id,printer_ip,printer_port,created_at,updated_at)
          VALUES($1,$2,$3,$4,$5,$6,$7) ON CONFLICT(id) DO UPDATE SET category_id=EXCLUDED.category_id,
          printer_ip=EXCLUDED.printer_ip,printer_port=EXCLUDED.printer_port,updated_at=EXCLUDED.updated_at`,
          [r.id, r.kot_printer_settings_id, r.category_id || null, r.printer_ip, r.printer_port, r.created_at || new Date(), r.updated_at || new Date()]);
        count("kot_printer_stations");
      }
    }

    for (const r of rows("pos_cash_sessions")) {
      await db.query(`INSERT INTO pos_cash_sessions(id,client_id,business_location_id,business_date,opening_amount,closing_amount,expected_cash,difference_amount,status,opened_at,closed_at,created_at,updated_at)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
        ON CONFLICT(id) DO UPDATE SET opening_amount=EXCLUDED.opening_amount,closing_amount=EXCLUDED.closing_amount,expected_cash=EXCLUDED.expected_cash,difference_amount=EXCLUDED.difference_amount,status=EXCLUDED.status,opened_at=EXCLUDED.opened_at,closed_at=EXCLUDED.closed_at,updated_at=EXCLUDED.updated_at
        WHERE pos_cash_sessions.client_id=$2`, [r.id,clientId,r.business_location_id,r.business_date,r.opening_amount||0,r.closing_amount??null,r.expected_cash??null,r.difference_amount??null,r.status||"open",r.opened_at||new Date(),r.closed_at||null,r.created_at||new Date(),r.updated_at||new Date()]);
      count("pos_cash_sessions");
    }

    for (const r of rows("pos_sales")) {
      await db.query(`INSERT INTO pos_sales
        (id,client_id,business_location_id,invoice_number,sale_number,sale_type,customer_name,subtotal,discount_amount,
         order_tax_amount,round_off_amount,total_amount,payment_status,status,created_at,updated_at)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
        ON CONFLICT(id) DO UPDATE SET business_location_id=EXCLUDED.business_location_id,invoice_number=EXCLUDED.invoice_number,
          sale_number=EXCLUDED.sale_number,sale_type=EXCLUDED.sale_type,customer_name=EXCLUDED.customer_name,
          subtotal=EXCLUDED.subtotal,discount_amount=EXCLUDED.discount_amount,order_tax_amount=EXCLUDED.order_tax_amount,
          round_off_amount=EXCLUDED.round_off_amount,total_amount=EXCLUDED.total_amount,payment_status=EXCLUDED.payment_status,
          status=EXCLUDED.status,updated_at=EXCLUDED.updated_at WHERE pos_sales.client_id=$2`,
        [r.id, clientId, r.business_location_id, r.invoice_number, r.sale_number ?? null, r.sale_type || "dining",
        r.customer_name || "Walk-In Customer", r.subtotal || 0, r.discount_amount || 0, r.order_tax_amount || 0, r.round_off_amount || 0,
        r.total_amount || 0, r.payment_status || "paid", r.status || "completed", r.created_at || new Date(), r.updated_at || new Date()]);
      count("pos_sales");
    }

    for (const r of rows("pos_sale_items")) {
      await db.query(`INSERT INTO pos_sale_items(id,sale_id,product_id,quantity,unit_price_inc_tax,discount_amount,line_total,created_at)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8)
        ON CONFLICT(id) DO UPDATE SET quantity=EXCLUDED.quantity,unit_price_inc_tax=EXCLUDED.unit_price_inc_tax,
          discount_amount=EXCLUDED.discount_amount,line_total=EXCLUDED.line_total`,
        [r.id, r.sale_id, r.product_id, r.quantity, r.unit_price_inc_tax, r.discount_amount || 0, r.line_total, r.created_at || new Date()]);
      count("pos_sale_items");
    }

    for (const r of rows("pos_sale_payments")) {
      await db.query(`INSERT INTO pos_sale_payments(id,sale_id,payment_method,amount,created_at)
        VALUES($1,$2,$3,$4,$5) ON CONFLICT(id) DO UPDATE SET payment_method=EXCLUDED.payment_method,amount=EXCLUDED.amount`,
        [r.id, r.sale_id, r.payment_method, r.amount, r.created_at || new Date()]);
      count("pos_sale_payments");
    }

    await db.query("COMMIT");
    return counts;
  } catch (error) {
    await db.query("ROLLBACK");
    throw error;
  } finally {
    db.release();
  }
}



async function getServerSnapshot(clientId) {
  await pool.cashSessionMigration;
  const db = await pool.connect();
  try {
    const one = async (sql, params = [clientId]) => (await db.query(sql, params)).rows;

    const business_locations = await one(
      `SELECT * FROM business_locations WHERE client_id = $1 ORDER BY created_at ASC`
    );
    const categories = await one(
      `SELECT * FROM categories WHERE client_id = $1 ORDER BY created_at ASC`
    );
    const sub_categories = await one(
      `SELECT * FROM sub_categories WHERE client_id = $1 ORDER BY created_at ASC`
    );
    const units = await one(
      `SELECT * FROM units WHERE client_id = $1 ORDER BY created_at ASC`
    );
    const tax_rates = await one(
      `SELECT * FROM tax_rates WHERE client_id = $1 ORDER BY created_at ASC`
    );

    const roles = await one(
      `SELECT DISTINCT r.*
       FROM roles r
       JOIN employees e ON e.role_id = r.id
       WHERE e.client_id = $1
       ORDER BY r.name ASC`
    );

    const employees = await one(
      `SELECT e.*
       FROM employees e
       WHERE e.client_id = $1
       ORDER BY e.created_at ASC`
    );

    const products = await one(
      `SELECT * FROM products WHERE client_id = $1 ORDER BY created_at ASC`
    );
    const product_business_locations = await one(
      `SELECT pbl.*
       FROM product_business_locations pbl
       JOIN products p ON p.id = pbl.product_id
       WHERE p.client_id = $1`
    );

    const customers = await one(
      `SELECT * FROM customers WHERE client_id = $1 ORDER BY created_at ASC`
    );
    const restaurant_tables = await one(
      `SELECT * FROM restaurant_tables WHERE client_id = $1 ORDER BY created_at ASC`
    );

    const kot_printer_settings = await one(
      `SELECT * FROM kot_printer_settings WHERE client_id = $1 ORDER BY created_at ASC`
    );
    const kot_printer_stations = await one(
      `SELECT kps.*
       FROM kot_printer_stations kps
       JOIN kot_printer_settings kpt ON kpt.id = kps.kot_printer_settings_id
       WHERE kpt.client_id = $1
       ORDER BY kps.created_at ASC`
    );

    const pos_cash_sessions = await one(
      `SELECT * FROM pos_cash_sessions WHERE client_id = $1 ORDER BY business_date ASC`
    );
    const pos_sales = await one(
      `SELECT * FROM pos_sales WHERE client_id = $1 ORDER BY created_at ASC`
    );
    const pos_sale_items = await one(
      `SELECT psi.*
       FROM pos_sale_items psi
       JOIN pos_sales ps ON ps.id = psi.sale_id
       WHERE ps.client_id = $1
       ORDER BY psi.created_at ASC`
    );
    const pos_sale_payments = await one(
      `SELECT psp.*
       FROM pos_sale_payments psp
       JOIN pos_sales ps ON ps.id = psp.sale_id
       WHERE ps.client_id = $1
       ORDER BY psp.created_at ASC`
    );

    return {
      roles,
      business_locations,
      categories,
      sub_categories,
      units,
      tax_rates,
      employees,
      products,
      product_business_locations,
      customers,
      restaurant_tables,
      kot_printer_settings,
      kot_printer_stations,
      pos_cash_sessions,
      pos_sales,
      pos_sale_items,
      pos_sale_payments,
    };
  } finally {
    db.release();
  }
}

module.exports = { upsertSnapshot, getServerSnapshot };