const { getDatabase } = require("../database/sqlite");
function getAllTaxRates(clientId){return getDatabase().prepare("SELECT * FROM tax_rates WHERE client_id=? ORDER BY created_at DESC").all(clientId)}
function createTaxRate(d){getDatabase().prepare(`INSERT INTO tax_rates(id,client_id,name,rate_percent,tax_type,is_active,created_at,updated_at) VALUES(?,?,?,?,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`).run(d.id,d.client_id,d.name,Number(d.rate_percent),d.tax_type||"gst",d.is_active===false?0:1);return getDatabase().prepare("SELECT * FROM tax_rates WHERE id=?").get(d.id)}
module.exports={getAllTaxRates,createTaxRate};
