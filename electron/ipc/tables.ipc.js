const { ipcMain } = require('electron');
const repo = require('../repositories/tables.repository');

function registerTablesIpc() {
  ipcMain.handle('tables:getAll', (_, { clientId, businessLocationId = null }) => repo.getAllTables(clientId, businessLocationId));
  ipcMain.handle('tables:create', (_, data) => repo.createTable(data));
  ipcMain.handle('tables:update', (_, data) => repo.updateTable(data));
  ipcMain.handle('tables:updateStatus', (_, { id, clientId, status }) => repo.updateTableStatus(id, clientId, status));
  ipcMain.handle('tables:delete', (_, { id, clientId }) => repo.deleteTable(id, clientId));
}

module.exports = { registerTablesIpc };
