const {ipcMain}=require('electron');const repo=require('../repositories/cashSessions.repository');
function registerCashSessionsIpc(){ipcMain.handle('cashSessions:today',(_,d)=>repo.getToday(d.clientId,d.locationId));ipcMain.handle('cashSessions:open',(_,d)=>repo.open(d.clientId,d.locationId,d.openingAmount));ipcMain.handle('cashSessions:report',(_,d)=>repo.report(d.clientId,d.locationId));ipcMain.handle('cashSessions:close',(_,d)=>repo.close(d.clientId,d.locationId,d.closingAmount));}
module.exports={registerCashSessionsIpc};
