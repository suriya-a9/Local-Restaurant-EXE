const { getDatabase } = require("../database/sqlite");

function setConfig(key, value) {
  getDatabase().prepare(`INSERT INTO app_config(key,value,updated_at) VALUES(?,?,CURRENT_TIMESTAMP)
    ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=CURRENT_TIMESTAMP`).run(key, value == null ? "" : String(value));
}
function getConfig(key) { return getDatabase().prepare("SELECT value FROM app_config WHERE key=?").get(key)?.value || null; }

function configure({ apiBaseUrl, token, clientId }) {
  if (apiBaseUrl) setConfig("sync_api_base_url", String(apiBaseUrl).replace(/\/$/, ""));
  if (clientId) setConfig("sync_client_id", clientId);
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
  const inRows = (table, col, ids) => ids.length ? db.prepare(`SELECT * FROM ${table} WHERE ${col} IN (${placeholders(ids)})`).all(...ids) : [];
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
    pos_sales: sales,
    pos_sale_items: inRows("pos_sale_items", "sale_id", saleIds),
    pos_sale_payments: inRows("pos_sale_payments", "sale_id", saleIds),
  };
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
    client_id: getConfig("sync_client_id") || null,
    api_base_url: getConfig("sync_api_base_url") || null,
  };
}

module.exports = { configure, getConfig, getSnapshot, setSyncResult, getStatus };
