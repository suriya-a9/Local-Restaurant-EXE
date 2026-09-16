const { getDatabase } = require("../database/sqlite");

function setConfig(key, value) {
  getDatabase().prepare(`INSERT INTO app_config(key,value,updated_at) VALUES(?,?,CURRENT_TIMESTAMP)
    ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=CURRENT_TIMESTAMP`).run(key, value == null ? "" : String(value));
}

function getConfig(key) {
  return getDatabase().prepare("SELECT value FROM app_config WHERE key=?").get(key)?.value || null;
}

function configure({ apiBaseUrl, token, clientId, clientName }) {
  if (apiBaseUrl) setConfig("sync_api_base_url", String(apiBaseUrl).replace(/\/$/, ""));
  if (clientId) setConfig("sync_client_id", clientId);
  if (clientName) setConfig("sync_client_name", clientName);
  if (token && !String(token).startsWith("offline:")) setConfig("sync_token", token);
  return getStatus();
}

function getSnapshot(clientId) {
  const db = getDatabase();
  const byClient = (table) => db.prepare(`SELECT * FROM ${table} WHERE client_id=?`).all(clientId);
  const products = byClient("products");
  const productIds = products.map(r => r.id);
  const settings = byClient("kot_printer_settings");
  const settingsIds = settings.map(r => r.id);
  const sales = byClient("pos_sales");
  const saleIds = sales.map(r => r.id);
  const placeholders = (arr) => arr.map(() => "?").join(",");
  const inRows = (table, col, ids) => ids.length
    ? db.prepare(`SELECT * FROM ${table} WHERE ${col} IN (${placeholders(ids)})`).all(...ids)
    : [];
  const employees = db.prepare(`SELECT e.*, r.name AS role_name FROM employees e JOIN roles r ON r.id=e.role_id WHERE e.client_id=?`).all(clientId);

  return {
    business_locations: byClient("business_locations"),
    categories: byClient("categories"),
    sub_categories: byClient("sub_categories"),
    units: byClient("units"),
    tax_rates: byClient("tax_rates"),
    employees,
    products,
    product_business_locations: inRows("product_business_locations", "product_id", productIds),
    customers: byClient("customers"),
    restaurant_tables: byClient("restaurant_tables"),
    kot_printer_settings: settings,
    kot_printer_stations: inRows("kot_printer_stations", "kot_printer_settings_id", settingsIds),
    pos_cash_sessions: byClient("pos_cash_sessions"),
    pos_sales: sales,
    pos_sale_items: inRows("pos_sale_items", "sale_id", saleIds),
    pos_sale_payments: inRows("pos_sale_payments", "sale_id", saleIds),
  };
}

function normalizeValue(table, column, value) {
  if (value === undefined) return null;
  if (typeof value === "boolean") return value ? 1 : 0;

  if (table === "kot_printer_settings" && column === "has_extra_kot") {
    return value === true || value === 1 || String(value).toLowerCase() === "yes" ? 1 : 0;
  }

  return value;
}

function tableColumns(db, table) {
  return db.prepare(`PRAGMA table_info(${table})`).all();
}

function upsertRows(db, table, rows, { clientId = null, transformRow = null } = {}) {
  if (!Array.isArray(rows) || rows.length === 0) return 0;

  const info = tableColumns(db, table);
  const allowed = new Set(info.map(c => c.name));
  const primaryKeys = info
    .filter(c => Number(c.pk) > 0)
    .sort((a, b) => a.pk - b.pk)
    .map(c => c.name);

  let count = 0;

  for (const source of rows) {
    let row = { ...source };
    if (transformRow) row = transformRow(row);
    if (!row) continue;

    if (clientId && allowed.has("client_id")) row.client_id = clientId;

    const columns = Object.keys(row).filter(col => allowed.has(col) && row[col] !== undefined);
    if (!columns.length) continue;

    const values = columns.map(col => normalizeValue(table, col, row[col]));
    const quotedCols = columns.map(col => `"${col}"`).join(",");
    const marks = columns.map(() => "?").join(",");

    let sql = `INSERT INTO "${table}" (${quotedCols}) VALUES (${marks})`;

    if (primaryKeys.length && primaryKeys.every(pk => columns.includes(pk))) {
      const updateCols = columns.filter(col => !primaryKeys.includes(col));
      sql += ` ON CONFLICT(${primaryKeys.map(pk => `"${pk}"`).join(",")}) `;
      if (updateCols.length) {
        sql += `DO UPDATE SET ${updateCols.map(col => `"${col}"=excluded."${col}"`).join(",")}`;
      } else {
        sql += "DO NOTHING";
      }
    } else {
      sql = `INSERT OR IGNORE INTO "${table}" (${quotedCols}) VALUES (${marks})`;
    }

    db.prepare(sql).run(...values);
    count += 1;
  }

  return count;
}

function deleteChildrenForParents(db, table, foreignKey, parentIds) {
  if (!parentIds.length) return;
  const marks = parentIds.map(() => "?").join(",");
  db.prepare(`DELETE FROM "${table}" WHERE "${foreignKey}" IN (${marks})`).run(...parentIds);
}

function applyServerSnapshot(clientId, snapshot) {
  const db = getDatabase();
  const rows = (name) => Array.isArray(snapshot?.[name]) ? snapshot[name] : [];
  const counts = {};
  const add = (name, n) => { counts[name] = (counts[name] || 0) + n; };

  const tx = db.transaction(() => {
    // Roles need special handling because older offline databases may already
    // contain synthetic local-role-* IDs with the same unique role name.
    const roleIdMap = new Map();
    for (const serverRole of rows("roles")) {
      const existing = db.prepare("SELECT id FROM roles WHERE LOWER(name)=LOWER(?) LIMIT 1").get(serverRole.name);
      if (existing) {
        roleIdMap.set(String(serverRole.id), existing.id);
        db.prepare("UPDATE roles SET name=?, updated_at=COALESCE(?,CURRENT_TIMESTAMP) WHERE id=?")
          .run(serverRole.name, serverRole.updated_at || null, existing.id);
      } else {
        upsertRows(db, "roles", [serverRole]);
        roleIdMap.set(String(serverRole.id), serverRole.id);
      }
      add("roles", 1);
    }

    add("business_locations", upsertRows(db, "business_locations", rows("business_locations"), { clientId }));
    add("categories", upsertRows(db, "categories", rows("categories"), { clientId }));
    add("units", upsertRows(db, "units", rows("units"), { clientId }));
    add("tax_rates", upsertRows(db, "tax_rates", rows("tax_rates"), { clientId }));
    add("sub_categories", upsertRows(db, "sub_categories", rows("sub_categories"), { clientId }));

    add("employees", upsertRows(db, "employees", rows("employees"), {
      clientId,
      transformRow: (row) => ({
        ...row,
        role_id: roleIdMap.get(String(row.role_id)) || row.role_id,
      }),
    }));

    add("products", upsertRows(db, "products", rows("products"), { clientId }));

    const productIds = rows("products").map(r => r.id).filter(Boolean);
    deleteChildrenForParents(db, "product_business_locations", "product_id", productIds);
    add("product_business_locations", upsertRows(db, "product_business_locations", rows("product_business_locations")));

    add("customers", upsertRows(db, "customers", rows("customers"), { clientId }));
    add("restaurant_tables", upsertRows(db, "restaurant_tables", rows("restaurant_tables"), { clientId }));
    add("kot_printer_settings", upsertRows(db, "kot_printer_settings", rows("kot_printer_settings"), { clientId }));

    const settingsIds = rows("kot_printer_settings").map(r => r.id).filter(Boolean);
    deleteChildrenForParents(db, "kot_printer_stations", "kot_printer_settings_id", settingsIds);
    add("kot_printer_stations", upsertRows(db, "kot_printer_stations", rows("kot_printer_stations")));

    add("pos_cash_sessions", upsertRows(db, "pos_cash_sessions", rows("pos_cash_sessions"), { clientId }));

    add("pos_sales", upsertRows(db, "pos_sales", rows("pos_sales"), { clientId }));

    const saleIds = rows("pos_sales").map(r => r.id).filter(Boolean);
    deleteChildrenForParents(db, "pos_sale_items", "sale_id", saleIds);
    deleteChildrenForParents(db, "pos_sale_payments", "sale_id", saleIds);
    add("pos_sale_items", upsertRows(db, "pos_sale_items", rows("pos_sale_items")));
    add("pos_sale_payments", upsertRows(db, "pos_sale_payments", rows("pos_sale_payments")));

    setConfig("sync_last_pulled_at", new Date().toISOString());
  });

  tx();
  return counts;
}

function setSyncResult(status, error = null, syncedAt = null) {
  setConfig("sync_status", status);
  setConfig("sync_last_error", error || "");
  if (syncedAt) setConfig("sync_last_synced_at", syncedAt);
}

function getStatus() {
  return {
    status: getConfig("sync_status") || "never",
    last_error: getConfig("sync_last_error") || null,
    last_synced_at: getConfig("sync_last_synced_at") || null,
    last_pulled_at: getConfig("sync_last_pulled_at") || null,
    client_id: getConfig("sync_client_id") || null,
    api_base_url: getConfig("sync_api_base_url") || null,
  };
}

module.exports = {
  configure,
  getConfig,
  getSnapshot,
  applyServerSnapshot,
  setSyncResult,
  getStatus,
};
