const {
  configure,
  getConfig,
  getSnapshot,
  applyServerSnapshot,
  setSyncResult,
  getStatus,
} = require("../repositories/sync.repository");

let syncing = false;
let timer = null;

async function readJson(response) {
  try {
    return await response.json();
  } catch (_) {
    return null;
  }
}

async function pushLocal(apiBaseUrl, token, clientId) {
  const snapshot = getSnapshot(clientId);
  const response = await fetch(`${apiBaseUrl}/api/client-sync/push`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ client_id: clientId, snapshot }),
  });

  const body = await readJson(response);
  if (!response.ok || !body?.success) {
    const message = body?.message || `Push server returned ${response.status}`;
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  return body.data || {};
}

async function pullServer(apiBaseUrl, token, clientId) {
  const url = `${apiBaseUrl}/api/client-sync/pull?client_id=${encodeURIComponent(clientId)}`;
  const response = await fetch(url, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });

  const body = await readJson(response);
  if (!response.ok || !body?.success) {
    const message = body?.message || `Pull server returned ${response.status}`;
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  const localCounts = applyServerSnapshot(clientId, body.data?.snapshot || {});
  return {
    serverCounts: body.data?.counts || {},
    localCounts,
    pulledAt: body.data?.pulled_at || new Date().toISOString(),
  };
}

async function syncNow() {
  if (syncing) return { ...getStatus(), skipped: true };

  const apiBaseUrl = getConfig("sync_api_base_url");
  const token = getConfig("sync_token");
  const clientId = getConfig("sync_client_id");
  const lastPulledAt = getConfig("sync_last_pulled_at");

  if (!apiBaseUrl || !token || !clientId) {
    return { ...getStatus(), skipped: true, reason: "Sync is not configured yet" };
  }

  syncing = true;
  setSyncResult("syncing");

  try {
    // Brand-new device: bootstrap from server first. This prevents an empty
    // local database from blocking the initial server -> SQLite population.
    if (!lastPulledAt) {
      console.log("[SYNC] First bootstrap: pulling server data into SQLite");

      const pull = await pullServer(apiBaseUrl, token, clientId);
      const syncedAt = new Date().toISOString();
      setSyncResult("synced", null, syncedAt);

      console.log("[SYNC] Bootstrap completed", {
        pulled: pull.serverCounts,
        imported: pull.localCounts,
      });

      return {
        success: true,
        bootstrap: true,
        ...getStatus(),
        pulled: pull.serverCounts,
        imported: pull.localCounts,
      };
    }

    // Existing device: push local changes first, then pull the latest server
    // snapshot back into SQLite. The UI continues to read SQLite at all times.
    console.log("[SYNC] Normal sync: push then pull");

    const push = await pushLocal(apiBaseUrl, token, clientId);
    const pull = await pullServer(apiBaseUrl, token, clientId);

    const syncedAt = push.synced_at || new Date().toISOString();
    setSyncResult("synced", null, syncedAt);

    console.log("[SYNC] Normal sync completed", {
      pushed: push.counts || {},
      pulled: pull.serverCounts,
      imported: pull.localCounts,
    });

    return {
      success: true,
      bootstrap: false,
      ...getStatus(),
      pushed: push.counts || {},
      pulled: pull.serverCounts,
      imported: pull.localCounts,
    };
  } catch (error) {
    const status = error?.status === 401 ? "auth_required" : "offline";
    setSyncResult(status, error.message || "Server unavailable");
    console.error("[SYNC] FAILED:", error);
    return { success: false, ...getStatus() };
  } finally {
    syncing = false;
  }
}

function startAutoSync() {
  if (timer) return;

  setTimeout(() => {
    console.log("[SYNC] Initial automatic sync");
    syncNow();
  }, 15000);

  timer = setInterval(() => {
    console.log("[SYNC] Automatic sync running");
    syncNow();
  }, 2 * 60 * 1000);
}

function stopAutoSync() {
  if (timer) clearInterval(timer);
  timer = null;
}

module.exports = {
  configure,
  syncNow,
  getStatus,
  startAutoSync,
  stopAutoSync,
};
