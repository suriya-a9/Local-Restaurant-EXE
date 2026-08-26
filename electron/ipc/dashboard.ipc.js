const { ipcMain } = require("electron");
const { getSummary } = require("../repositories/dashboard.repository");
function registerDashboardIpc(){ipcMain.handle("dashboard:getSummary",(_,args)=>getSummary(args.clientId,args));}
module.exports={registerDashboardIpc};
