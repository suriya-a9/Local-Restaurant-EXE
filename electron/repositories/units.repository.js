const { getDatabase } = require("../database/sqlite");
function getAllUnits(clientId){return getDatabase().prepare("SELECT * FROM units WHERE client_id=? ORDER BY created_at DESC").all(clientId)}
function createUnit(d){getDatabase().prepare("INSERT INTO units(id,client_id,name,short_name,allow_decimal,created_at,updated_at) VALUES(?,?,?,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)").run(d.id,d.client_id,d.name,d.short_name,d.allow_decimal?1:0);return{success:true,id:d.id}}
function updateUnit(d){getDatabase().prepare("UPDATE units SET name=?,short_name=?,allow_decimal=?,updated_at=CURRENT_TIMESTAMP WHERE id=? AND client_id=?").run(d.name,d.short_name,d.allow_decimal?1:0,d.id,d.client_id);return{success:true}}
function deleteUnit(id,clientId){getDatabase().prepare("DELETE FROM units WHERE id=? AND client_id=?").run(id,clientId);return{success:true}}
module.exports={getAllUnits,createUnit,updateUnit,deleteUnit};
