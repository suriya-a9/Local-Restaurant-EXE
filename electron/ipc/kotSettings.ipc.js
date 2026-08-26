const { ipcMain } = require('electron');
const repo = require('../repositories/kotSettings.repository');

function registerKotSettingsIpc() {
  ipcMain.handle('kotSettings:getByLocation', (_, { clientId, locationId }) => repo.getByLocation(clientId, locationId));
  ipcMain.handle('kotSettings:save', (_, data) => repo.saveConfiguration(data));
  ipcMain.handle('kotSettings:deleteStation', (_, { id, clientId }) => repo.deleteStation(id, clientId));
}

module.exports = { registerKotSettingsIpc };
