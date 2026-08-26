const { getDatabase } = require("../database/sqlite");
function getAllSubCategories(clientId){const rows=getDatabase().prepare(`SELECT sc.*,c.name category_name FROM sub_categories sc JOIN categories c ON c.id=sc.category_id WHERE sc.client_id=? ORDER BY sc.created_at DESC`).all(clientId);return rows.map(r=>({...r,category:{id:r.category_id,name:r.category_name}}))}
function createSubCategory(d){getDatabase().prepare("INSERT INTO sub_categories(id,client_id,category_id,name,created_at,updated_at) VALUES(?,?,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)").run(d.id,d.client_id,d.category_id,d.name);return{success:true,id:d.id}}
function updateSubCategory(d){getDatabase().prepare("UPDATE sub_categories SET category_id=?,name=?,updated_at=CURRENT_TIMESTAMP WHERE id=? AND client_id=?").run(d.category_id,d.name,d.id,d.client_id);return{success:true}}
function deleteSubCategory(id,clientId){getDatabase().prepare("DELETE FROM sub_categories WHERE id=? AND client_id=?").run(id,clientId);return{success:true}}
module.exports={getAllSubCategories,createSubCategory,updateSubCategory,deleteSubCategory};
