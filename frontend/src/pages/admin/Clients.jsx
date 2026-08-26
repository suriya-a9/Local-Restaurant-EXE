import React, { useEffect, useState } from "react";
import {
    Users,
    Plus,
    X,
    Check,
    Search,
    Power,
} from "lucide-react";
import { useAuth } from "../../context/authContext";
import Pagination from "../../components/Pagination";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const emptyForm = {
    business_name: "",
    name: "",
    email: "",
    password: "",
    password_confirmation: "",
    phone: "",
};

const ClientList = () => {
    const { token } = useAuth();

    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [statusLoading, setStatusLoading] = useState(null);

    const [error, setError] = useState(null);
    const [formErrors, setFormErrors] = useState({});

    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState(emptyForm);

    const [search, setSearch] = useState("");

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    useEffect(() => {
        loadClients();
    }, []);

    async function loadClients() {
        setLoading(true);
        setError(null);

        try {
            const res = await fetch(`${API_BASE_URL}/api/clients`, {
                headers: {
                    Accept: "application/json",
                    ...(token
                        ? {
                            Authorization: `Bearer ${token}`,
                        }
                        : {}),
                },
            });

            const json = await res.json();

            console.log("CLIENT API RESPONSE:", json);

            if (!res.ok || !json.success) {
                throw new Error(
                    json.message || "Failed to load clients"
                );
            }

            setClients(
                Array.isArray(json.data)
                    ? json.data
                    : Array.isArray(json.data?.clients)
                        ? json.data.clients
                        : Array.isArray(json.data?.data)
                            ? json.data.data
                            : []
            );
        } catch (err) {
            console.error("Load clients error:", err);
            setError(err.message);
            setClients([]);
        } finally {
            setLoading(false);
        }
    }

    function openCreateForm() {
        setForm(emptyForm);
        setFormErrors({});
        setError(null);
        setShowForm(true);
    }

    function closeForm() {
        if (saving) return;

        setShowForm(false);
        setForm(emptyForm);
        setFormErrors({});
    }

    function handleChange(e) {
        const { name, value } = e.target;

        setForm((prev) => ({
            ...prev,
            [name]: value,
        }));

        setFormErrors((prev) => ({
            ...prev,
            [name]: "",
        }));
    }

    async function handleSubmit(e) {
        e.preventDefault();

        setSaving(true);
        setError(null);
        setFormErrors({});

        if (form.password !== form.password_confirmation) {
            setFormErrors({
                password_confirmation: "Passwords do not match.",
            });

            setSaving(false);
            return;
        }

        const payload = {
            business_name: form.business_name.trim(),
            name: form.name.trim(),
            email: form.email.trim(),
            password: form.password,
            password_confirmation: form.password_confirmation,
            phone: form.phone.trim(),
        };

        try {
            const res = await fetch(
                `${API_BASE_URL}/api/clients`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                        ...(token
                            ? {
                                Authorization: `Bearer ${token}`,
                            }
                            : {}),
                    },
                    body: JSON.stringify(payload),
                }
            );

            const json = await res.json();

            if (!res.ok || !json.success) {
                if (json.errors) {
                    setFormErrors(json.errors);
                }

                throw new Error(
                    json.message || "Failed to create client"
                );
            }

            closeForm();
            setCurrentPage(1);
            await loadClients();
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    }

    async function changeStatus(client, newStatus) {
        setStatusLoading(client.id);
        setError(null);

        try {
            const res = await fetch(
                `${API_BASE_URL}/api/clients/${client.id}/change-status`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                        ...(token
                            ? {
                                Authorization: `Bearer ${token}`,
                            }
                            : {}),
                    },
                    body: JSON.stringify({
                        status: newStatus,
                    }),
                }
            );

            const json = await res.json();

            console.log("CHANGE STATUS RESPONSE:", json);

            if (!res.ok || !json.success) {
                throw new Error(
                    json.message || "Failed to change client status"
                );
            }

            await loadClients();

        } catch (err) {
            console.error("Change status error:", err);
            setError(err.message);
        } finally {
            setStatusLoading(null);
        }
    }

    function getStatusClass(status) {
        switch (status) {
            case "active":
                return "bg-emerald-50 text-emerald-600";

            case "trial":
                return "bg-purple-50 text-[#40295C]";

            case "inactive":
                return "bg-zinc-100 text-zinc-500";

            case "suspended":
                return "bg-rose-50 text-rose-600";

            default:
                return "bg-zinc-100 text-zinc-500";
        }
    }

    const filteredClients = Array.isArray(clients)
        ? clients.filter((client) => {
            const searchValue = search.toLowerCase();

            return (
                client.business_name
                    ?.toLowerCase()
                    .includes(searchValue) ||
                client.name
                    ?.toLowerCase()
                    .includes(searchValue) ||
                client.email
                    ?.toLowerCase()
                    .includes(searchValue) ||
                client.phone
                    ?.toLowerCase()
                    .includes(searchValue)
            );
        })
        : [];

    const totalPages = Math.ceil(
        filteredClients.length / itemsPerPage
    );

    const startIndex = (currentPage - 1) * itemsPerPage;

    const paginatedClients = filteredClients.slice(
        startIndex,
        startIndex + itemsPerPage
    );

    return (
        <div className="min-h-screen bg-white text-zinc-800 antialiased p-6 md:p-8 lg:p-12">

            <div className="flex flex-col gap-6 border-b border-zinc-100 pb-8 md:flex-row md:items-center md:justify-between">

                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight text-[#40295C] sm:text-5xl">
                        Clients
                    </h1>

                    <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                        {clients.length} Client
                        {clients.length === 1 ? "" : "s"}
                    </p>
                </div>

                <button
                    onClick={openCreateForm}
                    className="group flex items-center justify-center gap-2 rounded-full bg-[#40295C] px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#321f49] hover:scale-[1.01] active:scale-[0.99]"
                >
                    <Plus
                        size={16}
                        className="transition-transform group-hover:rotate-90"
                    />

                    New Client
                </button>
            </div>

            {error && (
                <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600">
                    {error}
                </div>
            )}

            {showForm && (
                <form
                    onSubmit={handleSubmit}
                    className="mt-6 rounded-2xl border border-zinc-200/60 bg-zinc-50/30 p-6"
                >
                    <div className="mb-6 flex items-center justify-between">
                        <div>
                            <h2 className="text-sm font-bold text-zinc-900">
                                New Client
                            </h2>

                            <p className="mt-1 text-xs text-zinc-400">
                                Create a new restaurant client account.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={closeForm}
                            className="text-zinc-400 transition-colors hover:text-zinc-700"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

                        <div>
                            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                                Business Name
                            </label>

                            <input
                                type="text"
                                name="business_name"
                                required
                                value={form.business_name}
                                onChange={handleChange}
                                placeholder="Pizza Palace Restaurant"
                                className={`mt-1.5 w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm font-medium text-zinc-900 outline-none focus:border-[#40295C] ${formErrors.business_name
                                    ? "border-rose-400"
                                    : "border-zinc-200/80"
                                    }`}
                            />

                            {formErrors.business_name && (
                                <p className="mt-1 text-xs text-rose-500">
                                    {Array.isArray(
                                        formErrors.business_name
                                    )
                                        ? formErrors.business_name[0]
                                        : formErrors.business_name}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                                Client Name
                            </label>

                            <input
                                type="text"
                                name="name"
                                required
                                value={form.name}
                                onChange={handleChange}
                                placeholder="John Doe"
                                className={`mt-1.5 w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm font-medium text-zinc-900 outline-none focus:border-[#40295C] ${formErrors.name
                                    ? "border-rose-400"
                                    : "border-zinc-200/80"
                                    }`}
                            />

                            {formErrors.name && (
                                <p className="mt-1 text-xs text-rose-500">
                                    {Array.isArray(formErrors.name)
                                        ? formErrors.name[0]
                                        : formErrors.name}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                                Email
                            </label>

                            <input
                                type="email"
                                name="email"
                                required
                                value={form.email}
                                onChange={handleChange}
                                placeholder="admin@pizzapalace.com"
                                className={`mt-1.5 w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm font-medium text-zinc-900 outline-none focus:border-[#40295C] ${formErrors.email
                                    ? "border-rose-400"
                                    : "border-zinc-200/80"
                                    }`}
                            />

                            {formErrors.email && (
                                <p className="mt-1 text-xs text-rose-500">
                                    {Array.isArray(formErrors.email)
                                        ? formErrors.email[0]
                                        : formErrors.email}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                                Phone
                            </label>

                            <input
                                type="text"
                                name="phone"
                                required
                                value={form.phone}
                                onChange={handleChange}
                                placeholder="+91-9876543210"
                                className={`mt-1.5 w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm font-medium text-zinc-900 outline-none focus:border-[#40295C] ${formErrors.phone
                                    ? "border-rose-400"
                                    : "border-zinc-200/80"
                                    }`}
                            />

                            {formErrors.phone && (
                                <p className="mt-1 text-xs text-rose-500">
                                    {Array.isArray(formErrors.phone)
                                        ? formErrors.phone[0]
                                        : formErrors.phone}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                                Password
                            </label>

                            <input
                                type="password"
                                name="password"
                                required
                                value={form.password}
                                onChange={handleChange}
                                placeholder="SecurePassword@123"
                                className={`mt-1.5 w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm font-medium text-zinc-900 outline-none focus:border-[#40295C] ${formErrors.password
                                    ? "border-rose-400"
                                    : "border-zinc-200/80"
                                    }`}
                            />

                            {formErrors.password && (
                                <p className="mt-1 text-xs text-rose-500">
                                    {Array.isArray(
                                        formErrors.password
                                    )
                                        ? formErrors.password[0]
                                        : formErrors.password}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                                Confirm Password
                            </label>

                            <input
                                type="password"
                                name="password_confirmation"
                                required
                                value={form.password_confirmation}
                                onChange={handleChange}
                                placeholder="Confirm password"
                                className={`mt-1.5 w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm font-medium text-zinc-900 outline-none focus:border-[#40295C] ${formErrors.password_confirmation
                                    ? "border-rose-400"
                                    : "border-zinc-200/80"
                                    }`}
                            />

                            {formErrors.password_confirmation && (
                                <p className="mt-1 text-xs text-rose-500">
                                    {Array.isArray(
                                        formErrors.password_confirmation
                                    )
                                        ? formErrors.password_confirmation[0]
                                        : formErrors.password_confirmation}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="mt-6 flex gap-3">
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex items-center gap-1.5 rounded-xl bg-[#40295C] px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-[#321f49] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <Check size={14} />

                            {saving
                                ? "Creating..."
                                : "Create Client"}
                        </button>

                        <button
                            type="button"
                            onClick={closeForm}
                            disabled={saving}
                            className="rounded-xl border border-zinc-200 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-600 hover:bg-zinc-50"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            )}

            <div className="mt-8">
                <div className="relative max-w-md">
                    <Search
                        size={17}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400"
                    />

                    <input
                        type="text"
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setCurrentPage(1);
                        }}
                        placeholder="Search clients..."
                        className="w-full rounded-xl border border-zinc-200 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-[#40295C]"
                    />
                </div>
            </div>

            <div className="mt-6 overflow-hidden rounded-2xl border border-zinc-200/60 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.02)]">

                {loading ? (
                    <p className="p-6 text-sm font-medium text-zinc-400">
                        Loading clients...
                    </p>
                ) : filteredClients.length === 0 ? (
                    <div className="p-10 text-center">
                        <Users
                            className="mx-auto text-zinc-300"
                            size={30}
                        />

                        <p className="mt-3 text-sm font-medium text-zinc-400">
                            {search
                                ? "No clients found."
                                : "No clients yet."}
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-zinc-100">

                        {paginatedClients.map((client) => (
                            <div
                                key={client.id}
                                className="flex flex-col gap-5 p-6 transition-colors hover:bg-zinc-50/30 lg:flex-row lg:items-center lg:justify-between"
                            >
                                <div className="flex items-start gap-4">

                                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#40295C]/5 text-[#40295C]">
                                        <Users size={18} />
                                    </div>

                                    <div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h3 className="text-sm font-semibold text-zinc-950">
                                                {client.business_name ||
                                                    "Unnamed Business"}
                                            </h3>

                                            <span
                                                className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${getStatusClass(
                                                    client.status
                                                )}`}
                                            >
                                                {client.status ||
                                                    "unknown"}
                                            </span>
                                        </div>

                                        <p className="mt-1 text-sm text-zinc-600">
                                            {client.name}
                                        </p>

                                        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-400">
                                            {client.email && (
                                                <span>
                                                    {client.email}
                                                </span>
                                            )}

                                            {client.phone && (
                                                <span>
                                                    {client.phone}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-2 lg:justify-end">

                                    <div className="flex items-center gap-2">
                                        <Power
                                            size={14}
                                            className="text-zinc-400"
                                        />

                                        <select
                                            value={client.status || "trial"}
                                            disabled={statusLoading === client.id}
                                            onChange={(e) =>
                                                changeStatus(client, e.target.value)
                                            }
                                            className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 outline-none focus:border-[#40295C] disabled:opacity-50"
                                        >
                                            <option value="trial">Trial</option>
                                            <option value="active">Active</option>
                                            <option value="inactive">Inactive</option>
                                            <option value="suspended">Suspended</option>
                                        </select>
                                    </div>

                                    {statusLoading === client.id && (
                                        <span className="text-xs text-zinc-400">
                                            Updating...
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            {!loading && filteredClients.length > 0 && totalPages > 1 && (
                <div className="mt-6">
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                    />
                </div>
            )}
        </div>
    );
};

export default ClientList;