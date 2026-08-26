import { Navigate } from "react-router-dom";
import { useAuth } from "../context/authContext";

export default function PermissionRoute({
    children,
    allowedRoles = [],
    fallbackPath = "/dashboard",
    portal = "client",
}) {
    const { token, role, portal: authenticatedPortal, loading } = useAuth();

    if (loading) {
        return <div>Loading...</div>;
    }

    if (!token) {
        return <Navigate to="/client-login" replace />;
    }

    if (authenticatedPortal !== portal) {
        return <Navigate to={portal === "admin" ? "/admin-login" : "/client-login"} replace />;
    }

    const normalizedAllowedRoles = allowedRoles.map((value) =>
        String(value).toLowerCase()
    );
    const currentRole = role?.toLowerCase?.() || "";

    if (normalizedAllowedRoles.length > 0 && !normalizedAllowedRoles.includes(currentRole)) {
        return <Navigate to={fallbackPath} replace />;
    }

    return children;
}