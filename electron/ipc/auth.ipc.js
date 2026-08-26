const { ipcMain } = require('electron');
const repo = require('../repositories/auth.repository');
function registerAuthIpc() {
  ipcMain.handle('auth:cacheLogin', (_, data) => repo.cacheLogin(data));
  ipcMain.handle('auth:loginOffline', (_, { name, password }) => repo.loginOffline(name, password));
}
module.exports = { registerAuthIpc };
