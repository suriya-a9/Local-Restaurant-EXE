const { ipcMain } = require('electron');
const repo = require('../repositories/sales.repository');
const kotSettingsRepo = require('../repositories/kotSettings.repository');
const { printBillingReceipt, printKotTickets } = require('../services/printerService');

function registerSalesIpc() {
  ipcMain.handle('sales:create', async (_, data) => {
    // Persist the sale first. Printer failures must never roll back the sale.
    const sale = repo.createSale(data);

    const printerConfig = kotSettingsRepo.getByLocation(data.client_id, data.business_location_id);

    let receiptPrint;
    try {
      receiptPrint = await printBillingReceipt(sale, printerConfig?.settings);
    } catch (error) {
      receiptPrint = {
        success: false,
        skipped: false,
        message: error.message || 'Receipt printing failed',
      };
    }

    let kotPrint;
    try {
      // Run after the receipt job, not in parallel. If the billing printer,
      // category KOT printer, and/or Default KOT printer are the same device,
      // sequential jobs prevent raw print data from colliding.
      kotPrint = await printKotTickets(sale, printerConfig);
    } catch (error) {
      kotPrint = {
        success: false,
        skipped: false,
        results: [],
        message: error.message || 'KOT printing failed',
      };
    }

    return { ...sale, receipt_print: receiptPrint, kot_print: kotPrint };
  });
  ipcMain.handle('sales:getAll', (_, { clientId, locationId = null }) => repo.listSales(clientId, locationId));
  ipcMain.handle('sales:getById', (_, { clientId, id, locationId = null }) => repo.getSaleById(clientId, id, locationId));
  ipcMain.handle('sales:cancel', (_, { clientId, id, locationId = null }) => repo.cancelSale(clientId, id, locationId));
  // Only reprint an existing, tenant-scoped sale. No sale or payment is created.
  ipcMain.handle('sales:hasKot', (_, { clientId, id, locationId = null }) => {
    const sale = repo.getSaleById(clientId, id, locationId);
    if (!sale) throw new Error('Sale not found');
    const config = kotSettingsRepo.getByLocation(clientId, sale.business_location_id);
    const categories = new Set((config?.stations || []).filter(s => s.category_id && s.printer_ip).map(s => String(s.category_id)));
    return sale.items.some(item => categories.has(String(item.category_id)));
  });
  ipcMain.handle('sales:reprint', async (_, { clientId, id, locationId = null, includeKot = false }) => {
    const sale = repo.getSaleById(clientId, id, locationId);
    if (!sale) throw new Error('Sale not found');
    const config = kotSettingsRepo.getByLocation(clientId, sale.business_location_id);
    // Print sequentially, as billing and KOT may use the same physical printer.
    let receiptPrint;
    try { receiptPrint = await printBillingReceipt(sale, config?.settings); }
    catch (error) { receiptPrint = { success: false, message: error.message || 'Receipt printing failed' }; }
    let kotPrint = null;
    if (includeKot) {
      try { kotPrint = await printKotTickets(sale, config); }
      catch (error) { kotPrint = { success: false, message: error.message || 'KOT printing failed' }; }
    }
    return { receipt_print: receiptPrint, kot_print: kotPrint };
  });
}

module.exports = { registerSalesIpc };