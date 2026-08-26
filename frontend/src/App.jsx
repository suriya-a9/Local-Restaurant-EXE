import { Routes, Route, Navigate } from "react-router-dom";
import PublicRoute from "./utils/publicRoute";
import PrivateRoute from "./utils/privateRoute";
import PermissionRoute from "./utils/permissionRoute";
import Dashboard from "./pages/admin/Dashboard";
import { Toaster } from "react-hot-toast";
import ClientDashboard from "./pages/client/Dashboard";
import MainLayout from "./layout/MainLayout";
import AdminLogin from "./pages/commonPages/AdminLogin";
import ClientLogin from "./pages/commonPages/ClientLogin";
import AdminFeatures from "./pages/admin/Features";
import AdminSubscriptionPlans from "./pages/admin/Subscription";
import ClientList from "./pages/admin/Clients";
import ClientSubscriptions from "./pages/admin/ClientSubscriptions";
import BusinessLocations from "./pages/client/BusinessLocations";
import Employees from "./pages/client/Employees";
import Categories from "./pages/client/Categories";
import SubCategories from "./pages/client/SubCategories";
import Units from "./pages/client/UnitTypes";
import Products from "./pages/client/Products";
import POS from "./pages/client/Pos";
import Sales from "./pages/client/Sales";
import KotPrinterSettings from "./pages/client/KotPrinterSettings";
import POSDashboard from "./pages/client/StaticPOS";
import Tables from "./pages/client/Tables";
import Customers from "./pages/client/Customers";

const CLIENT_ROLES = ["admin", "manager", "cashier", "waiter"];

function ClientPermission({ children, allowedRoles = CLIENT_ROLES }) {
    return (
        <PermissionRoute
            portal="client"
            allowedRoles={allowedRoles}
            fallbackPath="/admin-dashboard"
        >
            {children}
        </PermissionRoute>
    );
}

function App() {
    return (
        <>
            <Routes>
                <Route path="/" element={<Navigate to="/client-login" replace />} />
                <Route
                    path="/admin-login"
                    element={
                        <PublicRoute portal="admin" redirectPath="/dashboard">
                            <AdminLogin />
                        </PublicRoute>
                    }
                />
                <Route
                    path="/client-login"
                    element={
                        <PublicRoute portal="client" redirectPath="/admin-dashboard">
                            <ClientLogin />
                        </PublicRoute>
                    }
                />

                <Route
                    element={
                        <PrivateRoute portal="admin" loginPath="/admin-login">
                            <MainLayout />
                        </PrivateRoute>
                    }
                >
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/features" element={<AdminFeatures />} />
                    <Route path="/subscription" element={<AdminSubscriptionPlans />} />
                    <Route path="/clients" element={<ClientList />} />
                    <Route path="/client-subscriptions" element={<ClientSubscriptions />} />
                </Route>

                <Route
                    element={
                        <PrivateRoute portal="client" loginPath="/client-login">
                            <MainLayout />
                        </PrivateRoute>
                    }
                >
                    <Route path="/admin-dashboard" element={<ClientPermission><ClientDashboard /></ClientPermission>} />
                    <Route path="/admin-locations" element={<ClientPermission allowedRoles={["admin"]}><BusinessLocations /></ClientPermission>} />
                    <Route path="/admin-employees" element={<ClientPermission allowedRoles={["admin"]}><Employees /></ClientPermission>} />
                    <Route path="/admin-categories" element={<ClientPermission><Categories /></ClientPermission>} />
                    <Route path="/admin-subcategories" element={<ClientPermission><SubCategories /></ClientPermission>} />
                    <Route path="/admin-unit-types" element={<ClientPermission><Units /></ClientPermission>} />
                    <Route path="/admin-product" element={<ClientPermission><Products /></ClientPermission>} />
                    <Route path="/admin-table" element={<ClientPermission><Tables /></ClientPermission>} />
                    <Route path="/admin-customers" element={<ClientPermission><Customers /></ClientPermission>} />
                    {/* <Route path="/admin-pos" element={<ClientPermission><POS /></ClientPermission>} /> */}
                    <Route path="/admin-sales" element={<ClientPermission><Sales /></ClientPermission>} />
                    <Route path="/admin-kot-settings" element={<ClientPermission><KotPrinterSettings /></ClientPermission>} />
                </Route>

                <Route
                    element={
                        <PrivateRoute portal="client" loginPath="/client-login">
                            <MainLayout hideHeader fullscreen />
                        </PrivateRoute>
                    }
                >
                    <Route path="/admin-pos" element={<ClientPermission><POS /></ClientPermission>} />
                </Route>
            </Routes>
            <Toaster position="top-right" reverseOrder={false} duration={2000} />
        </>
    );
}

export default App;