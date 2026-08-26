const bcrypt = require('bcryptjs');
const { getDatabase } = require('../database/sqlite');

function cacheLogin({ name, password, user, subscription = null, portal = 'client', token = null }) {
  if (!name || !password || !user) throw new Error('Login data is incomplete');
  const db = getDatabase();
  const hash = bcrypt.hashSync(password, 10);
  db.prepare(`INSERT INTO local_auth_users(name,password_hash,user_json,subscription_json,portal,server_token,updated_at)
    VALUES(?,?,?,?,?,?,CURRENT_TIMESTAMP)
    ON CONFLICT(name) DO UPDATE SET password_hash=excluded.password_hash,user_json=excluded.user_json,
      subscription_json=excluded.subscription_json,portal=excluded.portal,server_token=COALESCE(excluded.server_token,local_auth_users.server_token),updated_at=CURRENT_TIMESTAMP`)
    .run(String(name).trim().toLowerCase(), hash, JSON.stringify(user), subscription ? JSON.stringify(subscription) : null, portal, token);
  return { success: true };
}

function loginOffline(name, password) {
  const db = getDatabase();
  const normalized = String(name || '').trim().toLowerCase();
  const cached = db.prepare('SELECT * FROM local_auth_users WHERE name = ? AND portal = ?').get(normalized, 'client');
  if (cached && bcrypt.compareSync(password, cached.password_hash)) {
    return {
      success: true,
      token: `offline:${Date.now()}`,
      user: JSON.parse(cached.user_json),
      subscription: cached.subscription_json ? JSON.parse(cached.subscription_json) : null,
      offline: true,
    };
  }

  const employee = db.prepare(`SELECT e.*, r.name AS role_name, bl.name AS business_location_name
    FROM employees e JOIN roles r ON r.id=e.role_id JOIN business_locations bl ON bl.id=e.business_location_id
    WHERE LOWER(e.name)=LOWER(?) LIMIT 1`).get(normalized);
  if (employee && bcrypt.compareSync(password, employee.password)) {
    return {
      success: true,
      token: `offline:${Date.now()}`,
      user: {
        id: employee.client_id,
        employee_id: employee.id,
        client_id: employee.client_id,
        name: employee.name,
        email: employee.email,
        role: employee.role_name,
        business_location_id: employee.business_location_id,
        business_location: employee.business_location_name,
        roles: [{ name: employee.role_name }],
      },
      subscription: null,
      offline: true,
    };
  }
  throw new Error('Invalid name or password, or this account has not logged in online on this device yet');
}

module.exports = { cacheLogin, loginOffline };
