const { ipcMain } = require('electron');
const repo = require('../repositories/sales.repository');

function registerSalesIpc() {
  ipcMain.handle('sales:create', (_, data) => repo.createSale(data));
  ipcMain.handle('sales:getAll', (_, { clientId, locationId = null }) => repo.listSales(clientId, locationId));
  ipcMain.handle('sales:getById', (_, { clientId, id, locationId = null }) => repo.getSaleById(clientId, id, locationId));
  ipcMain.handle('sales:cancel', (_, { clientId, id, locationId = null }) => repo.cancelSale(clientId, id, locationId));
}

module.exports = { registerSalesIpc };
