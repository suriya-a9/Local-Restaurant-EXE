import { useState } from "react";
import { Eye, EyeOff, Mail, Phone } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../services/api";
import loginBanner from "../../assets/Restaurant_software_banner1.jpg.jpeg";
import sarasLogo from "../../assets/SaraS-Web-Solution.png";
import { useAuth } from "../../context/authContext";

export default function Login({ portal = "client", endpoint = "/clientAuth/login", title = "Saras RMS" }) {
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState({});
    const navigate = useNavigate();
    const { login } = useAuth();

    const isAdmin = portal === "admin";

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
    });

    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));

        setErrors((prev) => ({
            ...prev,
            [name]: "",
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            setLoading(true);

            const clientIdentifier = formData.name.trim();
            const payload = {
                ...(isAdmin
                    ? { email: formData.email.trim() }
                    : { name: clientIdentifier, email: clientIdentifier }),
                password: formData.password,
            };

            const { data } = await api.post(endpoint, payload);

            if (data?.success) {
                const authToken = data.token || data.data?.token;
                const user = data.user || data.data?.user || data.data?.client || data.admin;
                const subscription = data.subscription || data.data?.subscription || null;

                if (!authToken || !user) {
                    throw new Error("Invalid login response");
                }

                // Cache a verified client login locally so the same account can sign in
                // when this Electron device is offline later. Admin portal stays server-only.
                if (portal === "client" && window.electronAPI?.auth) {
                    await window.electronAPI.auth.cacheLogin({
                        name: formData.name,
                        password: formData.password,
                        user,
                        subscription,
                        portal,
                        token: authToken,
                    });
                    if (window.electronAPI?.sync) {
                        await window.electronAPI.sync.configure({
                            apiBaseUrl: import.meta.env.VITE_API_BASE_URL,
                            token: authToken,
                            clientId: user.client_id ?? user.id,
                        });
                        window.electronAPI.sync.now().catch(() => { });
                    }
                }

                login(authToken, user, subscription, portal);

                toast.success("Login successful");

                navigate(portal === "admin" ? "/dashboard" : "/admin-dashboard", { replace: true });
            }
        } catch (error) {
            // If the cloud API cannot be reached, try the credentials cached on this device.
            // We do not fall back for an HTTP 4xx/5xx response because the server did answer.
            if (portal === "client" && window.electronAPI?.auth && !error?.response) {
                try {
                    const offlineAuth = await window.electronAPI.auth.loginOffline(
                        formData.name,
                        formData.password
                    );

                    login(
                        offlineAuth.token,
                        offlineAuth.user,
                        offlineAuth.subscription || null,
                        portal
                    );
                    toast.success("Logged in offline");
                    navigate("/admin-dashboard", { replace: true });
                    return;
                } catch (offlineError) {
                    console.error("Offline login failed:", offlineError);
                    toast.error(offlineError?.message || "Offline login failed");
                    return;
                }
            }

            console.error(error);

            if (
                error.response?.status === 400 &&
                error.response?.data?.errors
            ) {
                const validationErrors = {};

                if (Array.isArray(error.response.data.errors)) {
                    error.response.data.errors.forEach((err) => {
                        if (err?.path) validationErrors[err.path] = err.msg || "Invalid value";
                    });
                } else if (typeof error.response.data.errors === "object") {
                    Object.entries(error.response.data.errors).forEach(([field, message]) => {
                        validationErrors[field] = Array.isArray(message) ? message[0] : String(message);
                    });
                }

                setErrors(validationErrors);
                if (Object.keys(validationErrors).length === 0) {
                    toast.error(error.response.data.message || "Validation failed");
                }
                return;
            }

            toast.error(
                error?.response?.data?.message || "Something went wrong"
            );
        } finally {
            setLoading(false);
        }
    };

    const loginForm = (
        <div className="w-full max-w-md mx-auto">
            <div className="text-center mb-6">
                <img
                    src={sarasLogo}
                    alt="Saras RMS"
                    className="h-16 w-auto max-w-[180px] object-contain mx-auto mb-4"
                />

                <p className="text-gray-500 mt-2 text-sm">
                    Log in to your{" "}
                    <span className="text-[#40295C]">
                        {isAdmin ? "Saras RMS admin" : title}
                    </span>{" "}
                    account
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <input
                    type={isAdmin ? "email" : "text"}
                    name={isAdmin ? "email" : "name"}
                    value={isAdmin ? formData.email : formData.name}
                    onChange={handleChange}
                    placeholder={isAdmin ? "Admin email" : "Client or staff name"}
                    className={`w-full h-14 rounded-lg border px-4 outline-none transition-colors
                        ${(isAdmin ? errors.email : (errors.name || errors.email))
                            ? "border-red-500"
                            : "border-gray-300 focus:border-[#40295C]"
                        }`}
                />
                {!isAdmin && (errors.name || errors.email) && (
                    <p className="-mt-2 text-sm text-red-600">{errors.name || errors.email}</p>
                )}

                <div className="relative">
                    <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Password"
                        className={`w-full h-14 rounded-lg border pl-4 pr-12 outline-none transition-colors
                            ${errors.password
                                ? "border-red-500"
                                : "border-gray-300 focus:border-[#40295C]"
                            }`}
                    />

                    <button
                        type="button"
                        onClick={() =>
                            setShowPassword(!showPassword)
                        }
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#40295C] transition-colors"
                    >
                        {showPassword ? (
                            <EyeOff size={20} />
                        ) : (
                            <Eye size={20} />
                        )}
                    </button>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-14 rounded-lg bg-[#40295C] hover:bg-[#321F49] font-semibold text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? "Please wait..." : "Log In"}
                </button>
            </form>

            {!isAdmin && (
                <div className="mt-8 pt-6 border-t border-gray-200">
                    <p className="text-center text-sm font-semibold text-gray-700 mb-4">
                        Getting problem to enter the Restaurant Software?
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        {/* <a
                            href="mailto:support@saraswebsolutions.com"
                            className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#40295C] transition-colors"
                        >
                            <Mail size={17} />
                            <span>support@saraswebsolutions.com</span>
                        </a> */}

                        <a
                            href="https://wa.me/916381221046"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#40295C] transition-colors"
                        >
                            <Phone size={17} />
                            <span>WhatsApp: +91 63812 21046</span>
                        </a>
                    </div>
                </div>
            )}
        </div>
    );

    if (isAdmin) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-white px-6">
                {loginForm}
            </div>
        );
    }

    return (
        <div className="h-screen w-full overflow-hidden grid grid-cols-1 lg:grid-cols-2 bg-white">
            <div className="relative hidden lg:block h-full overflow-hidden">
                <img
                    src={loginBanner}
                    alt=""
                    className="h-full w-full object-cover"
                />
            </div>

            <div className="h-full overflow-y-auto flex flex-col justify-center px-6 py-6 sm:px-12 lg:px-16">
                {loginForm}
            </div>
        </div>
    );
}