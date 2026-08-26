import Login from "./Login";

export default function AdminLogin() {
    return (
        <Login
            portal="admin"
            endpoint="api/adminAuth/login"
            title="Saras Admin"
        />
    );
}