const { ipcMain } = require("electron");
const syncService = require("../services/syncService");
function registerSyncIpc() {
  ipcMain.handle("sync:configure", (_, data) => syncService.configure(data || {}));
  ipcMain.handle("sync:now", () => syncService.syncNow());
  ipcMain.handle("sync:pushNow", () => syncService.pushNow());
  ipcMain.handle("sync:pullNow", () => syncService.pullNow());
  ipcMain.handle("sync:status", () => syncService.getStatus());
}
module.exports = { registerSyncIpc };