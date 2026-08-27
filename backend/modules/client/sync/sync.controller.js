const { upsertSnapshot, getServerSnapshot } = require("./sync.model");

async function pushSnapshot(req, res) {
  try {
    const clientId = req.user?.id;
    if (!clientId) return res.status(401).json({ success: false, message: "Unauthorized" });
    const requestedClientId = req.body?.client_id;
    if (requestedClientId && String(requestedClientId) !== String(clientId)) {
      return res.status(403).json({ success: false, message: "Client mismatch" });
    }
    const counts = await upsertSnapshot(clientId, req.body?.snapshot || {});
    return res.json({ success: true, message: "Local data synced", data: { counts, synced_at: new Date().toISOString() } });
  } catch (error) {
    console.error("Sync push failed:", error);
    return res.status(500).json({ success: false, message: error.message || "Sync failed" });
  }
}

async function pullSnapshot(req, res) {
  try {
    const clientId = req.user?.id;
    if (!clientId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const requestedClientId = req.query?.client_id;
    if (requestedClientId && String(requestedClientId) !== String(clientId)) {
      return res.status(403).json({ success: false, message: "Client mismatch" });
    }

    const snapshot = await getServerSnapshot(clientId);
    const counts = Object.fromEntries(
      Object.entries(snapshot).map(([key, value]) => [key, Array.isArray(value) ? value.length : 0])
    );

    return res.json({
      success: true,
      message: "Server data downloaded",
      data: {
        snapshot,
        counts,
        pulled_at: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Sync pull failed:", error);
    return res.status(500).json({ success: false, message: error.message || "Pull failed" });
  }
}

module.exports = { pushSnapshot, pullSnapshot };