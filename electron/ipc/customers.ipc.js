const { ipcMain } = require('electron');
const repo = require('../repositories/customers.repository');

function registerCustomersIpc() {
  ipcMain.handle('customers:getAll', (_, { clientId, locationId = null, search = '' }) => repo.getCustomers(clientId, locationId, search));
  ipcMain.handle('customers:create', (_, data) => repo.createCustomer(data));
}

module.exports = { registerCustomersIpc };
