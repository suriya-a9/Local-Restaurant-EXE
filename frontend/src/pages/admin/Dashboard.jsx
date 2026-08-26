import React, { useEffect, useState } from "react";
import {
    Users,
    CreditCard,
    UserCheck,
    UserX,
    TrendingUp,
    TrendingDown,
    ArrowUpRight,
    Activity,
    Building2,
    Search,
    Filter,
    X,
} from "lucide-react";
import { useAuth } from "../../context/authContext";
import Pagination from "../../components/Pagination";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const emptyFilters = {
    status: "",
    plan_id: "",
    search: "",
    start_date: "",
    end_date: "",
};

const statusClass = {
    active: "bg-emerald-50 text-emerald-600",
    inactive: "bg-zinc-100 text-zinc-500",
    trial: "bg-purple-50 text-[#40295C]",
    suspended: "bg-rose-50 text-rose-600",
};

const AdminDashboard = () => {
    const { token } = useAuth();

    const [stats, setStats] = useState(null);
    const [loadingStats, setLoadingStats] = useState(true);

    const [plans, setPlans] = useState([]);

    const [clients, setClients] = useState([]);
    const [loadingClients, setLoadingClients] = useState(true);

    const [error, setError] = useState(null);

    const [filters, setFilters] = useState(emptyFilters);
    const [showFilters, setShowFilters] = useState(false);

    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const limit = 5;

    const headers = {
        Accept: "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    useEffect(() => {
        loadStats();
        loadPlans();
    }, []);

    useEffect(() => {
        loadClients();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, filters]);

    async function loadStats() {
        setLoadingStats(true);
        setError(null);

        try {
            const res = await fetch(`${API_BASE_URL}/api/dashboard/stats`, {
                headers,
            });

            const json = await res.json();

            if (!res.ok || !json.success) {
                throw new Error(
                    json.message || "Failed to load dashboard stats"
                );
            }

            setStats(json.data);
        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setLoadingStats(false);
        }
    }

    async function loadPlans() {
        try {
            const res = await fetch(
                `${API_BASE_URL}/api/subscription-plans`,
                { headers }
            );

            const json = await res.json();

            if (res.ok && json.success) {
                setPlans(json.data || []);
            }
        } catch (err) {
            console.error("Plans error:", err);
        }
    }

    async function loadClients() {
        setLoadingClients(true);
        setError(null);

        try {
            const params = new URLSearchParams();

            if (filters.status) params.set("status", filters.status);
            if (filters.plan_id) params.set("plan_id", filters.plan_id);
            if (filters.search) params.set("search", filters.search);
            if (filters.start_date)
                params.set("start_date", filters.start_date);
            if (filters.end_date) params.set("end_date", filters.end_date);

            params.set("page", page);
            params.set("limit", limit);

            const res = await fetch(
                `${API_BASE_URL}/api/dashboard/clients?${params.toString()}`,
                { headers }
            );

            const json = await res.json();

            if (!res.ok || !json.success) {
                throw new Error(
                    json.message || "Failed to load clients"
                );
            }

            setClients(json.data || []);
            setTotalPages(json.pagination?.total_pages || 1);
        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setLoadingClients(false);
        }
    }

    function handleFilterChange(e) {
        const { name, value } = e.target;

        setFilters((prev) => ({
            ...prev,
            [name]: value,
        }));

        setPage(1);
    }

    function clearFilters() {
        setFilters(emptyFilters);
        setPage(1);
    }

    const activeFilterCount = Object.values(filters).filter(Boolean).length;

    const totalClients = stats?.total_clients ?? 0;
    const activeClients = stats?.active_clients ?? 0;
    const inactiveClients = stats?.inactive_clients ?? 0;
    const trialClients = stats?.trial_clients ?? 0;
    const suspendedClients = stats?.suspended_clients ?? 0;
    const activeSubscriptions = stats?.active_subscriptions ?? 0;
    const activeClientPercentage = stats?.active_client_percentage ?? 0;
    const subscriptionRate = stats?.subscription_rate ?? 0;
    const planDistribution = stats?.plan_distribution ?? [];
    const growth = stats?.growth ?? { this_month: 0, last_month: 0, percentage: 0 };

    const cards = [
        {
            title: "Total Clients",
            value: totalClients,
            description: "Registered clients",
            icon: Users,
        },
        {
            title: "Active Clients",
            value: activeClients,
            description: "Currently active",
            icon: UserCheck,
        },
        {
            title: "Inactive Clients",
            value: inactiveClients,
            description: "Currently inactive",
            icon: UserX,
        },
        {
            title: "Subscriptions",
            value: activeSubscriptions,
            description: "Active subscriptions",
            icon: CreditCard,
        },
    ];

    function formatDate(date) {
        if (!date) return "-";

        return new Date(date).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    }

    return (
        <div className="min-h-screen bg-white p-6 text-zinc-800 antialiased md:p-8 lg:p-12">

            <div className="border-b border-zinc-100 pb-8">
                <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">

                    <div>
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#40295C]">
                            Super Admin
                        </p>

                        <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-[#40295C] sm:text-5xl">
                            Dashboard
                        </h1>

                        <p className="mt-2 max-w-xl text-sm text-zinc-500">
                            Overview of your clients, subscriptions, and
                            platform activity.
                        </p>
                    </div>

                    <div className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5">
                        <Activity
                            size={15}
                            className="text-[#40295C]"
                        />

                        <span className="text-xs font-semibold text-zinc-600">
                            System Overview
                        </span>

                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    </div>
                </div>
            </div>

            {error && (
                <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600">
                    {error}
                </div>
            )}

            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

                {loadingStats ? (
                    <p className="col-span-full text-sm font-medium text-zinc-400">
                        Loading stats...
                    </p>
                ) : (
                    cards.map((stat) => {
                        const Icon = stat.icon;

                        return (
                            <div
                                key={stat.title}
                                className="rounded-2xl border border-zinc-200/70 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] transition-all hover:-translate-y-0.5 hover:shadow-md"
                            >
                                <div className="flex items-start justify-between">

                                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#40295C]/5 text-[#40295C]">
                                        <Icon size={19} />
                                    </div>

                                    <div
                                        className={`flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold ${growth.percentage >= 0
                                            ? "bg-emerald-50 text-emerald-600"
                                            : "bg-rose-50 text-rose-600"
                                            }`}
                                    >
                                        {growth.percentage >= 0 ? (
                                            <TrendingUp size={11} />
                                        ) : (
                                            <TrendingDown size={11} />
                                        )}
                                        {Math.abs(growth.percentage)}%
                                    </div>
                                </div>

                                <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                                    {stat.title}
                                </p>

                                <h2 className="mt-1 text-3xl font-extrabold tracking-tight text-zinc-950">
                                    {stat.value}
                                </h2>

                                <p className="mt-1 text-xs text-zinc-400">
                                    {stat.description}
                                </p>
                            </div>
                        );
                    })
                )}
            </div>

            <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-3">

                <div className="xl:col-span-2 rounded-2xl border border-zinc-200/70 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">

                    <div className="flex items-center justify-between">

                        <div>
                            <h2 className="text-sm font-bold text-zinc-950">
                                Client Overview
                            </h2>

                            <p className="mt-1 text-xs text-zinc-400">
                                Current client account status
                            </p>
                        </div>

                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#40295C]/5 text-[#40295C]">
                            <Building2 size={17} />
                        </div>
                    </div>

                    <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">

                        <div className="rounded-xl border border-zinc-100 bg-zinc-50/50 p-5">
                            <div className="flex items-center gap-2">
                                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />

                                <span className="text-xs font-semibold text-zinc-500">
                                    Active
                                </span>
                            </div>

                            <p className="mt-3 text-2xl font-extrabold text-zinc-950">
                                {activeClients}
                            </p>

                            <p className="mt-1 text-xs text-zinc-400">
                                {activeClientPercentage}% of total clients
                            </p>
                        </div>

                        <div className="rounded-xl border border-zinc-100 bg-zinc-50/50 p-5">
                            <div className="flex items-center gap-2">
                                <span className="h-2.5 w-2.5 rounded-full bg-[#40295C]" />

                                <span className="text-xs font-semibold text-zinc-500">
                                    Trial
                                </span>
                            </div>

                            <p className="mt-3 text-2xl font-extrabold text-zinc-950">
                                {trialClients}
                            </p>

                            <p className="mt-1 text-xs text-zinc-400">
                                {totalClients === 0
                                    ? 0
                                    : Math.round(
                                        (trialClients / totalClients) * 100
                                    )}% of total clients
                            </p>
                        </div>

                        <div className="rounded-xl border border-zinc-100 bg-zinc-50/50 p-5">
                            <div className="flex items-center gap-2">
                                <span className="h-2.5 w-2.5 rounded-full bg-zinc-400" />

                                <span className="text-xs font-semibold text-zinc-500">
                                    Inactive
                                </span>
                            </div>

                            <p className="mt-3 text-2xl font-extrabold text-zinc-950">
                                {inactiveClients + suspendedClients}
                            </p>

                            <p className="mt-1 text-xs text-zinc-400">
                                {totalClients === 0
                                    ? 0
                                    : Math.round(
                                        ((inactiveClients + suspendedClients) /
                                            totalClients) *
                                        100
                                    )}% of total clients
                            </p>
                        </div>
                    </div>

                    <div className="mt-6">

                        <div className="mb-2 flex items-center justify-between">
                            <span className="text-xs font-semibold text-zinc-500">
                                Active client ratio
                            </span>

                            <span className="text-xs font-bold text-[#40295C]">
                                {activeClientPercentage}%
                            </span>
                        </div>

                        <div className="h-2 overflow-hidden rounded-full bg-zinc-100">
                            <div
                                className="h-full rounded-full bg-[#40295C]"
                                style={{ width: `${activeClientPercentage}%` }}
                            />
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border border-zinc-200/70 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">

                    <div className="flex items-center justify-between">

                        <div>
                            <h2 className="text-sm font-bold text-zinc-950">
                                Subscriptions
                            </h2>

                            <p className="mt-1 text-xs text-zinc-400">
                                Plan distribution
                            </p>
                        </div>

                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#40295C]/5 text-[#40295C]">
                            <CreditCard size={17} />
                        </div>
                    </div>

                    <div className="mt-6 space-y-5">

                        {planDistribution.length === 0 ? (
                            <p className="text-xs text-zinc-400">
                                No plan data yet.
                            </p>
                        ) : (
                            planDistribution.map((plan) => (
                                <div key={plan.id}>

                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-semibold text-zinc-600">
                                            {plan.name}
                                        </span>

                                        <span className="text-xs font-bold text-zinc-900">
                                            {plan.clients}
                                        </span>
                                    </div>

                                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-100">
                                        <div
                                            className="h-full rounded-full bg-[#40295C]"
                                            style={{
                                                width: `${plan.percentage}%`,
                                            }}
                                        />
                                    </div>

                                    <p className="mt-1 text-[10px] text-zinc-400">
                                        {plan.percentage}% of subscriptions
                                    </p>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="mt-6 border-t border-zinc-100 pt-5">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-zinc-500">
                                Total active subscriptions
                            </span>

                            <span className="text-lg font-extrabold text-zinc-950">
                                {activeSubscriptions}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-6 overflow-hidden rounded-2xl border border-zinc-200/70 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.03)]">

                <div className="flex flex-col gap-4 border-b border-zinc-100 p-6">

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                        <div>
                            <h2 className="text-sm font-bold text-zinc-950">
                                Clients
                            </h2>

                            <p className="mt-1 text-xs text-zinc-400">
                                Filter and browse client accounts
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() => setShowFilters((prev) => !prev)}
                            className="flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-xs font-semibold text-zinc-700 transition-colors hover:border-zinc-300"
                        >
                            <Filter size={13} />
                            Filters
                            {activeFilterCount > 0 && (
                                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#40295C] text-[10px] font-bold text-white">
                                    {activeFilterCount}
                                </span>
                            )}
                        </button>
                    </div>

                    {showFilters && (
                        <div className="grid grid-cols-1 gap-3 rounded-xl border border-zinc-200/70 bg-zinc-50/40 p-4 sm:grid-cols-2 lg:grid-cols-5">

                            <div className="relative lg:col-span-2">
                                <Search
                                    size={15}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
                                />

                                <input
                                    type="text"
                                    name="search"
                                    value={filters.search}
                                    onChange={handleFilterChange}
                                    placeholder="Search name, business, email..."
                                    className="w-full rounded-xl border border-zinc-200 bg-white py-2.5 pl-9 pr-3 text-xs outline-none focus:border-[#40295C]"
                                />
                            </div>

                            <select
                                name="status"
                                value={filters.status}
                                onChange={handleFilterChange}
                                className="rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-xs font-medium outline-none focus:border-[#40295C]"
                            >
                                <option value="">All statuses</option>
                                <option value="trial">Trial</option>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                                <option value="suspended">Suspended</option>
                            </select>

                            <select
                                name="plan_id"
                                value={filters.plan_id}
                                onChange={handleFilterChange}
                                className="rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-xs font-medium outline-none focus:border-[#40295C]"
                            >
                                <option value="">All plans</option>
                                {plans.map((plan) => (
                                    <option key={plan.id} value={plan.id}>
                                        {plan.name}
                                    </option>
                                ))}
                            </select>

                            <input
                                type="date"
                                name="start_date"
                                value={filters.start_date}
                                onChange={handleFilterChange}
                                className="rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-xs font-medium outline-none focus:border-[#40295C]"
                            />

                            <div className="flex items-center gap-2">
                                <input
                                    type="date"
                                    name="end_date"
                                    value={filters.end_date}
                                    onChange={handleFilterChange}
                                    className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-xs font-medium outline-none focus:border-[#40295C]"
                                />

                                {activeFilterCount > 0 && (
                                    <button
                                        type="button"
                                        onClick={clearFilters}
                                        title="Clear filters"
                                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-400 hover:text-zinc-700"
                                    >
                                        <X size={14} />
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="divide-y divide-zinc-100">

                    {loadingClients ? (
                        <p className="p-6 text-sm font-medium text-zinc-400">
                            Loading clients...
                        </p>
                    ) : clients.length === 0 ? (
                        <div className="p-10 text-center">
                            <Users
                                className="mx-auto text-zinc-300"
                                size={28}
                            />

                            <p className="mt-3 text-sm font-medium text-zinc-400">
                                No clients match these filters.
                            </p>
                        </div>
                    ) : (
                        clients.map((client) => (
                            <div
                                key={client.id}
                                className="flex flex-col gap-4 p-5 transition-colors hover:bg-zinc-50/40 md:flex-row md:items-center md:justify-between"
                            >

                                <div className="flex items-center gap-4">

                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#40295C]/5 text-[#40295C]">
                                        <Users size={17} />
                                    </div>

                                    <div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h3 className="text-sm font-semibold text-zinc-950">
                                                {client.business_name ||
                                                    "Unnamed Business"}
                                            </h3>

                                            <span
                                                className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${statusClass[client.status] ||
                                                    "bg-zinc-100 text-zinc-500"
                                                    }`}
                                            >
                                                {client.status}
                                            </span>
                                        </div>

                                        <p className="mt-1 text-xs text-zinc-500">
                                            {client.name} · {client.email}
                                        </p>

                                        <p className="mt-0.5 text-[11px] text-zinc-400">
                                            Joined {formatDate(client.created_at)}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between gap-5 md:justify-end">

                                    <div className="text-left md:text-right">
                                        <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                                            Plan
                                        </p>

                                        <p className="mt-1 text-xs font-semibold text-zinc-700">
                                            {client.plan_name || "No plan"}
                                        </p>
                                    </div>

                                    <ArrowUpRight
                                        size={15}
                                        className="text-zinc-300"
                                    />
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {!loadingClients && clients.length > 0 && totalPages > 1 && (
                    <div className="border-t border-zinc-100 p-4">
                        <Pagination
                            currentPage={page}
                            totalPages={totalPages}
                            onPageChange={setPage}
                        />
                    </div>
                )}
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">

                <div className="rounded-2xl border border-zinc-200/70 bg-[#40295C] p-6 text-white">
                    <p className="text-xs font-semibold uppercase tracking-wider text-white/60">
                        Platform Growth
                    </p>

                    <div className="mt-3 flex items-end gap-2">
                        <span className="text-3xl font-extrabold">
                            {growth.percentage >= 0 ? "+" : ""}
                            {growth.percentage}%
                        </span>

                        {growth.percentage >= 0 ? (
                            <TrendingUp size={18} className="mb-1" />
                        ) : (
                            <TrendingDown size={18} className="mb-1" />
                        )}
                    </div>

                    <p className="mt-2 text-xs text-white/60">
                        Client growth compared to last month
                    </p>
                </div>

                <div className="rounded-2xl border border-zinc-200/70 bg-white p-6">
                    <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                        Active Rate
                    </p>

                    <p className="mt-3 text-3xl font-extrabold text-zinc-950">
                        {activeClientPercentage}%
                    </p>

                    <p className="mt-2 text-xs text-zinc-400">
                        {activeClients} out of {totalClients} clients are active
                    </p>
                </div>

                <div className="rounded-2xl border border-zinc-200/70 bg-white p-6">
                    <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                        Subscription Rate
                    </p>

                    <p className="mt-3 text-3xl font-extrabold text-zinc-950">
                        {subscriptionRate}%
                    </p>

                    <p className="mt-2 text-xs text-zinc-400">
                        {activeSubscriptions} clients currently have subscriptions
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;