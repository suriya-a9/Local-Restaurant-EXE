import { Navigate } from "react-router-dom";
import { useAuth } from "../context/authContext";

export default function PublicRoute({ children, portal, redirectPath }) {
    const { token, portal: authenticatedPortal, loading } = useAuth();

    if (loading) {
        return <div>Loading...</div>;
    }

    if (!token) {
        return children;
    }

    if (portal && authenticatedPortal !== portal) {
        return children;
    }

    return <Navigate to={redirectPath} replace />;
}