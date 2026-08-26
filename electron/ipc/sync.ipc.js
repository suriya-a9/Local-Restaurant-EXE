const { ipcMain } = require("electron");
const syncService = require("../services/syncService");
function registerSyncIpc() {
  ipcMain.handle("sync:configure", (_, data) => syncService.configure(data || {}));
  ipcMain.handle("sync:now", () => syncService.syncNow());
  ipcMain.handle("sync:status", () => syncService.getStatus());
}
module.exports = { registerSyncIpc };
