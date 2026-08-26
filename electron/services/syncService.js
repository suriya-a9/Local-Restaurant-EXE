const { configure, getConfig, getSnapshot, setSyncResult, getStatus } = require("../repositories/sync.repository");
let syncing = false;
let timer = null;

async function syncNow() {
  if (syncing) return { ...getStatus(), skipped: true };
  const apiBaseUrl = getConfig("sync_api_base_url");
  const token = getConfig("sync_token");
  const clientId = getConfig("sync_client_id");
  if (!apiBaseUrl || !token || !clientId) return { ...getStatus(), skipped: true, reason: "Sync is not configured yet" };
  syncing = true;
  setSyncResult("syncing");
  try {
    const snapshot = getSnapshot(clientId);
    const response = await fetch(`${apiBaseUrl}/api/client-sync/push`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ client_id: clientId, snapshot }),
    });
    let body = null;
    try { body = await response.json(); } catch (_) { }
    if (!response.ok || !body?.success) {
      const message = body?.message || `Sync server returned ${response.status}`;
      setSyncResult(response.status === 401 ? "auth_required" : "failed", message);
      throw new Error(message);
    }
    const syncedAt = body.data?.synced_at || new Date().toISOString();
    setSyncResult("synced", null, syncedAt);
    return { success: true, ...getStatus(), counts: body.data?.counts || {} };
  } catch (error) {
    if (getStatus().status === "syncing") setSyncResult("offline", error.message || "Server unavailable");
    return { success: false, ...getStatus() };
  } finally {
    syncing = false;
  }
}

function startAutoSync() {
  if (timer) return;
  setTimeout(() => syncNow(), 15000);
  timer = setInterval(() => syncNow(), 5 * 60 * 1000);
}

function stopAutoSync() { if (timer) clearInterval(timer); timer = null; }
module.exports = { configure, syncNow, getStatus, startAutoSync, stopAutoSync };