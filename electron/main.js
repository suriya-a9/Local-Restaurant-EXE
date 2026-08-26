const { app, BrowserWindow } = require("electron");
const path = require("path");

const {
    initializeDatabase,
} = require("./database/sqlite");

const {
    registerCategoryIpc,
} = require("./ipc/categories.ipc");
const { registerUnitsIpc } = require("./ipc/units.ipc");
const { registerSubCategoriesIpc } = require("./ipc/subCategories.ipc");
const { registerBusinessLocationsIpc } = require("./ipc/businessLocations.ipc");
const { registerTaxRatesIpc } = require("./ipc/taxRates.ipc");
const { registerEmployeesIpc } = require("./ipc/employees.ipc");
const { registerProductsIpc } = require("./ipc/products.ipc");
const { registerTablesIpc } = require("./ipc/tables.ipc");
const { registerCustomersIpc } = require("./ipc/customers.ipc");
const { registerSalesIpc } = require("./ipc/sales.ipc");
const { registerKotSettingsIpc } = require("./ipc/kotSettings.ipc");
const { registerAuthIpc } = require("./ipc/auth.ipc");
const { registerSyncIpc } = require("./ipc/sync.ipc");
const { registerDashboardIpc } = require("./ipc/dashboard.ipc");
const { startAutoSync, stopAutoSync } = require("./services/syncService");


function createWindow() {
    const win = new BrowserWindow({
        width: 1400,
        height: 900,

        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            contextIsolation: true,
            nodeIntegration: false,
        },
    });

    if (!app.isPackaged) {
        win.loadURL("http://localhost:5173");
    } else {
        win.loadFile(
            path.join(
                __dirname,
                "../frontend/dist/index.html"
            )
        );
    }
}

app.whenReady().then(() => {
    initializeDatabase();

    registerCategoryIpc();
    registerUnitsIpc();
    registerSubCategoriesIpc();
    registerBusinessLocationsIpc();
    registerTaxRatesIpc();
    registerEmployeesIpc();
    registerProductsIpc();
    registerTablesIpc();
    registerCustomersIpc();
    registerSalesIpc();
    registerKotSettingsIpc();
    registerAuthIpc();
    registerSyncIpc();
    registerDashboardIpc();
    startAutoSync();

    createWindow();
});

app.on("before-quit", () => stopAutoSync());

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit();
    }
});