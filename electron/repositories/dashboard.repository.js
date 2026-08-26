const { getDatabase } = require("../database/sqlite");
function iso(d){ return d.toISOString().slice(0,10); }
function periodDates(period, fromDate, toDate) {
  const now = new Date();
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  if (period === "custom") return { fromDate, toDate };
  if (period === "yesterday") { const x=new Date(d); x.setUTCDate(x.getUTCDate()-1); return {fromDate:iso(x),toDate:iso(x)}; }
  if (period === "this_week") { const s=new Date(d); s.setUTCDate(d.getUTCDate()-((d.getUTCDay()+6)%7)); const e=new Date(s);e.setUTCDate(e.getUTCDate()+6); return {fromDate:iso(s),toDate:iso(e)}; }
  if (period === "this_month") return {fromDate:`${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,"0")}-01`,toDate:iso(new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+1,0)))};
  if (period === "this_year") return {fromDate:`${d.getUTCFullYear()}-01-01`,toDate:`${d.getUTCFullYear()}-12-31`};
  if (period === "last_year") { const y=d.getUTCFullYear()-1; return {fromDate:`${y}-01-01`,toDate:`${y}-12-31`}; }
  return {fromDate:iso(d),toDate:iso(d)};
}
function getSummary(clientId,{locationId=null,period="today",fromDate=null,toDate=null}={}) {
  const db=getDatabase(); const range=periodDates(period,fromDate,toDate);
  const params=[clientId,range.fromDate,range.toDate]; let locationSql="";
  if(locationId){locationSql=" AND s.business_location_id=?";params.push(locationId)}
  const sales=db.prepare(`SELECT s.id,s.total_amount,s.payment_status FROM pos_sales s WHERE s.client_id=? AND s.status<>'cancelled' AND date(s.created_at)>=date(?) AND date(s.created_at)<=date(?)${locationSql}`).all(...params);
  if(!sales.length) return {total_orders:0,total_sales_amount:0,total_due_amount:0,payment_breakdown:{cash:0,card:0,gpay:0,credit:0},from_date:range.fromDate,to_date:range.toDate};
  const ids=sales.map(s=>s.id); const ph=ids.map(()=>"?").join(",");
  const payments=db.prepare(`SELECT sale_id,payment_method,SUM(amount) amount FROM pos_sale_payments WHERE sale_id IN (${ph}) GROUP BY sale_id,payment_method`).all(...ids);
  const bySale=new Map(); const breakdown={cash:0,card:0,gpay:0,credit:0};
  for(const p of payments){const amt=Number(p.amount||0);breakdown[p.payment_method]=(breakdown[p.payment_method]||0)+amt;bySale.set(p.sale_id,(bySale.get(p.sale_id)||0)+amt)}
  let total=0,due=0; for(const s of sales){const amt=Number(s.total_amount||0);total+=amt;if(s.payment_status==='credit')due+=amt;else if(s.payment_status==='partial')due+=Math.max(amt-(bySale.get(s.id)||0),0)}
  return {total_orders:sales.length,total_sales_amount:total,total_due_amount:due,payment_breakdown:breakdown,from_date:range.fromDate,to_date:range.toDate};
}
module.exports={getSummary};
