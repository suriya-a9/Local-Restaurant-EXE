import { Navigate } from "react-router-dom";
import { useAuth } from "../context/authContext";

export default function PrivateRoute({ children, portal, loginPath = "/client-login" }) {
    const { token, portal: authenticatedPortal, loading } = useAuth();

    if (loading) {
        return <div>Loading...</div>;
    }

    if (!token) {
        return <Navigate to={loginPath} replace />;
    }

    if (portal && authenticatedPortal !== portal) {
        return <Navigate to={loginPath} replace />;
    }

    return children;
}