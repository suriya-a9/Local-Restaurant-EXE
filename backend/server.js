require("dotenv").config();
const express = require("express");
const app = express();
const config = require("./config/default");
const logger = require("./logger");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const adminAuthRoutes = require("./modules/admin/auth/adminAuth.routes");
const adminFeaturesRoutes = require("./modules/admin/features/features.routes");
const adminSubscriptionPlanRoutes = require("./modules/admin/subscriptionPlans/subscriptionPlans.routes");
const adminClientRoutes = require("./modules/admin/clients/clients.routes");
const startSubscriptionExpiryJob = require("./jobs/subscriptionExpiry.job");
const adminDashboardRoutes = require("./modules/admin/dashboard/dashboard.routes");
const clientAuthRouter = require("./modules/client/auth/auth.routes");
const clientBussinessLocations = require("./modules/client/businessLocations/businessLocations.routes");
const clientCategoryRoutes = require("./modules/client/categories/categories.routes");
const clientSubCategoryRoutes = require("./modules/client/subCategories/subCategories.routes");
const clientEmployeeRoutes = require("./modules/client/employees/employees.routes");
const clientRolesRoutes = require("./modules/client/roles/roles.routes");
const clientProductUnitsRoutes = require("./modules/client/units/units.routes");
const clientTaxRates = require("./modules/client/taxRates/taxRates.routes");
const clientProducts = require("./modules/client/product/products.routes");
const clientSales = require("./modules/client/sales/sales.routes");
const clientDashboard = require("./modules/client/dashboard/dashboard.routes");
const clientKOTSettings = require("./modules/client/kotPrinterSettings/kotPrinterSettings.routes");
const clientTableRoutes = require("./modules/client/tables/tables.routes");
const clientCustomerRoutes = require("./modules/client/customers/customers.routes");
const clientSyncRoutes = require("./modules/client/sync/sync.routes");

startSubscriptionExpiryJob();

app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));
app.use(express.static('public'));

app.use(cors());
app.use(helmet());
app.set("trust proxy", true);

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    message: "Request limit reached. Please try again later.",
});

app.use("/api/adminAuth", adminAuthRoutes);
app.use("/api/admin-features", adminFeaturesRoutes);
app.use("/api/subscription-plans", adminSubscriptionPlanRoutes);
app.use("/api/clients", adminClientRoutes);
app.use("/api/dashboard", adminDashboardRoutes);
app.use("/api/clientAuth", clientAuthRouter);
app.use("/api/client/business-locations", clientBussinessLocations);
app.use("/api/client/categories", clientCategoryRoutes);
app.use("/api/client/sub-categories", clientSubCategoryRoutes);
app.use("/api/client/employees/", clientEmployeeRoutes);
app.use("/api/client/roles", clientRolesRoutes);
app.use("/api/client/units", clientProductUnitsRoutes);
app.use("/api/products", clientProducts);
app.use("/api/sales", clientSales);
app.use("/api/client/dashboard", clientDashboard);
app.use("/api/tax-rates", clientTaxRates);
app.use("/api/kot-printer-settings", clientKOTSettings);
app.use("/api/tables", clientTableRoutes);
app.use("/api/customers", clientCustomerRoutes);
app.use("/api/client-sync", clientSyncRoutes);

app.use((err, req, res, next) => {
    logger.error(err.stack);
    res.status(err.status || 500).json({
        message: err.message || "internal server error",
    });
});

const PORT = config.port
app.listen(PORT, "0.0.0.0", () => {
    logger.info(`Server running on ${PORT} and 0.0.0.0`);
});