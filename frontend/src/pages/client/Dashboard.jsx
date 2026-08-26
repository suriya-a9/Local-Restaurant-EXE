import React, { useEffect, useState } from "react";
import {
    Wallet,
    ShoppingCart,
    AlertCircle,
    Banknote,
    CreditCard,
    Smartphone,
    Clock,
    CalendarDays,
    Sparkles,
} from "lucide-react";
import { useAuth } from "../../context/authContext";
import { getPrimaryLocationId } from "../../utils/primaryLocation";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const PERIOD_OPTIONS = [
    { key: "today", label: "Today" },
    { key: "yesterday", label: "Yesterday" },
    { key: "this_week", label: "This Week" },
    { key: "this_month", label: "This Month" },
    { key: "this_year", label: "This Year" },
    { key: "last_year", label: "Last Year" },
    { key: "custom", label: "Custom Range" },
];

function todayISO() {
    return new Date().toISOString().slice(0, 10);
}

const ClientDashboard = () => {
    const { token, clientId, businessLocationId: authBusinessLocationId, loading: authLoading } = useAuth();
    const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

    const [locations, setLocations] = useState([]);
    const [loadingLocations, setLoadingLocations] = useState(true);

    const [selectedLocationId, setSelectedLocationId] = useState("");

    const [period, setPeriod] = useState("today");
    const [fromDate, setFromDate] = useState(todayISO());
    const [toDate, setToDate] = useState(todayISO());
    const [showCustomPicker, setShowCustomPicker] = useState(false);

    const [summary, setSummary] = useState(null);
    const [loadingSummary, setLoadingSummary] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (authLoading || !token) return;
        loadLocations();
    }, [authLoading, token, clientId]);

    useEffect(() => {
        if (authBusinessLocationId) {
            setSelectedLocationId(String(authBusinessLocationId));
        }
    }, [authBusinessLocationId]);

    useEffect(() => {
        if (authLoading || !token) return;
        if (period === "custom" && showCustomPicker) return;
        loadSummary();
    }, [authLoading, token, clientId, period, selectedLocationId, fromDate, toDate, showCustomPicker]);

    async function loadLocations() {
        setLoadingLocations(true);

        try {
            if (window.electronAPI?.businessLocations) {
                const data = await window.electronAPI.businessLocations.getAll(clientId);
                const nextLocations = Array.isArray(data) ? data : [];
                setLocations(nextLocations);
                if (!authBusinessLocationId) setSelectedLocationId(getPrimaryLocationId(nextLocations));
                return;
            }
            const res = await fetch(`${API_BASE_URL}/api/client/business-locations?per_page=1000&client_id=${clientId}`, {
                headers: { Accept: "application/json", ...authHeaders },
            });
            const json = await res.json();

            if (!res.ok || !json.success) {
                throw new Error(json.message || "Failed to load business locations");
            }

            const data = json.data;
            const nextLocations = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
            setLocations(nextLocations);
            if (!authBusinessLocationId) setSelectedLocationId(getPrimaryLocationId(nextLocations));
        } catch (err) {
            console.error("Load business locations error:", err);
            setLocations([]);
        } finally {
            setLoadingLocations(false);
        }
    }

    function buildParams() {
        const params = new URLSearchParams();

        params.set("client_id", clientId);
        params.set("period", period);

        if (period === "custom") {
            params.set("from_date", fromDate);
            params.set("to_date", toDate);
        }

        if (selectedLocationId) {
            params.set("business_location_id", selectedLocationId);
        }

        return params;
    }

    async function loadSummary() {
        setLoadingSummary(true);
        setError(null);

        try {
            if (window.electronAPI?.dashboard) {
                const data = await window.electronAPI.dashboard.getSummary(clientId, {
                    period,
                    fromDate,
                    toDate,
                    locationId: selectedLocationId || null,
                });
                setSummary(data);
                return;
            }
            const params = buildParams();

            const res = await fetch(`${API_BASE_URL}/api/client/dashboard/summary?${params.toString()}`, {
                headers: { Accept: "application/json", ...authHeaders },
            });
            const json = await res.json();

            if (!res.ok || !json.success) {
                throw new Error(json.message || "Failed to load dashboard summary");
            }

            setSummary(json.data);
        } catch (err) {
            console.error("Load dashboard summary error:", err);
            setError(err.message);
            setSummary(null);
        } finally {
            setLoadingSummary(false);
        }
    }

    function handlePeriodClick(key) {
        setPeriod(key);
        setShowCustomPicker(key === "custom");
    }

    function applyCustomRange() {
        setShowCustomPicker(false);
    }

    function formatCurrency(amount) {
        return `₹${Number(amount ?? 0).toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;
    }

    // Colors pulled from the POS screen: indigo = primary/credit, emerald = cash/success,
    // sky = card, pink = GPay/UPI, rose = due/danger, amber = warning (reserved for future use)
    const paymentMethods = [
        { key: "cash", label: "Cash", icon: Banknote, iconBg: "bg-emerald-50", iconText: "text-emerald-600" },
        { key: "card", label: "Card", icon: CreditCard, iconBg: "bg-sky-50", iconText: "text-sky-600" },
        { key: "gpay", label: "GPay", icon: Smartphone, iconBg: "bg-pink-50", iconText: "text-pink-600" },
        { key: "credit", label: "Credit", icon: Clock, iconBg: "bg-indigo-50", iconText: "text-indigo-600" },
    ];

    const activeRangeLabel =
        period === "custom"
            ? fromDate === toDate
                ? fromDate
                : `${fromDate} to ${toDate}`
            : summary
                ? summary.from_date === summary.to_date
                    ? summary.from_date
                    : `${summary.from_date} to ${summary.to_date}`
                : "";

    if (authLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center text-sm text-zinc-400">
                Loading...
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white text-zinc-800 antialiased">

            {/* Toolbar */}
            <div className="flex flex-col gap-4 border-b border-zinc-100 px-6 py-6 md:flex-row md:items-center md:justify-between md:px-8 lg:px-12">

                <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">
                        Analytics Dashboard
                    </p>
                    <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-indigo-950 sm:text-4xl">
                        Sales Overview
                    </h1>
                </div>

                <div className="flex items-center gap-3">
                    {authBusinessLocationId ? (
                        <span className="rounded-xl border border-zinc-200/80 bg-zinc-50/50 px-3.5 py-2.5 text-sm font-medium text-zinc-700">
                            {locations.find((l) => String(l.id) === String(authBusinessLocationId))?.name ??
                                "Your location"}
                        </span>
                    ) : (
                        <select
                            value={selectedLocationId}
                            onChange={(e) => setSelectedLocationId(e.target.value)}
                            disabled={loadingLocations}
                            className="rounded-xl border border-zinc-200/80 bg-white px-3.5 py-2.5 text-sm font-medium text-zinc-900 outline-none focus:border-indigo-500"
                        >
                            <option value="">All Branches</option>
                            {locations.map((loc) => (
                                <option key={loc.id} value={loc.id}>
                                    {loc.name}
                                </option>
                            ))}
                        </select>
                    )}
                </div>
            </div>

            <div className="flex flex-col gap-3 border-b border-zinc-100 px-6 py-4 md:flex-row md:items-center md:justify-between md:px-8 lg:px-12">

                <div className="flex flex-wrap gap-2">
                    {PERIOD_OPTIONS.map((opt) => (
                        <button
                            key={opt.key}
                            type="button"
                            onClick={() => handlePeriodClick(opt.key)}
                            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${period === opt.key
                                ? "bg-indigo-600 text-white shadow-sm"
                                : "border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"
                                }`}
                        >
                            {opt.key === "custom" && (
                                <CalendarDays size={12} className="mr-1.5 inline -mt-0.5" />
                            )}
                            {opt.label}
                        </button>
                    ))}
                </div>

                {activeRangeLabel && (
                    <span className="rounded-lg border border-indigo-100 bg-indigo-50/50 px-3.5 py-1.5 text-xs font-semibold text-indigo-600">
                        {activeRangeLabel}
                    </span>
                )}
            </div>

            {showCustomPicker && (
                <div className="flex flex-wrap items-end gap-3 border-b border-zinc-100 bg-zinc-50/50 px-6 py-4 md:px-8 lg:px-12">
                    <div>
                        <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                            From
                        </label>
                        <input
                            type="date"
                            value={fromDate}
                            max={toDate}
                            onChange={(e) => setFromDate(e.target.value)}
                            className="mt-1.5 rounded-xl border border-zinc-200/80 bg-white px-3.5 py-2.5 text-sm font-medium text-zinc-900 outline-none focus:border-indigo-500"
                        />
                    </div>

                    <div>
                        <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                            To
                        </label>
                        <input
                            type="date"
                            value={toDate}
                            min={fromDate}
                            onChange={(e) => setToDate(e.target.value)}
                            className="mt-1.5 rounded-xl border border-zinc-200/80 bg-white px-3.5 py-2.5 text-sm font-medium text-zinc-900 outline-none focus:border-indigo-500"
                        />
                    </div>

                    <button
                        type="button"
                        onClick={applyCustomRange}
                        className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
                    >
                        Apply
                    </button>
                </div>
            )}

            <div className="p-6 md:p-8 lg:p-12">

                <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                    Sales Overview
                </p>

                {error && (
                    <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600">
                        {error}
                    </div>
                )}

                {loadingSummary ? (
                    <p className="mt-6 text-sm font-medium text-zinc-400">Loading summary...</p>
                ) : summary ? (
                    <>
                        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">

                            <div className="rounded-2xl border border-zinc-200/70 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                                    <ShoppingCart size={19} />
                                </div>
                                <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                                    Total Orders
                                </p>
                                <h2 className="mt-1 text-3xl font-extrabold tracking-tight text-zinc-950">
                                    {summary.total_orders}
                                </h2>
                            </div>

                            <div className="rounded-2xl border border-zinc-200/70 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                                    <Wallet size={19} />
                                </div>
                                <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                                    Total Sales
                                </p>
                                <h2 className="mt-1 text-3xl font-extrabold tracking-tight text-zinc-950">
                                    {formatCurrency(summary.total_sales_amount)}
                                </h2>
                            </div>

                            <div className="rounded-2xl border border-zinc-200/70 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                                    <AlertCircle size={19} />
                                </div>
                                <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                                    Total Due
                                </p>
                                <h2 className="mt-1 text-3xl font-extrabold tracking-tight text-zinc-950">
                                    {formatCurrency(summary.total_due_amount)}
                                </h2>
                            </div>
                        </div>

                        <div className="mt-6 rounded-2xl border border-zinc-200/70 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
                            <h2 className="text-sm font-bold text-zinc-950">Payment Breakdown</h2>
                            <p className="mt-1 text-xs text-zinc-400">
                                Sales split by payment method for the selected period
                            </p>

                            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                {paymentMethods.map(({ key, label, icon: Icon, iconBg, iconText }) => (
                                    <div
                                        key={key}
                                        className="flex items-center gap-3 rounded-xl border border-zinc-200/80 bg-zinc-50/40 p-4"
                                    >
                                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconBg} ${iconText}`}>
                                            <Icon size={16} />
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                                                {label}
                                            </p>
                                            <p className="mt-0.5 text-sm font-bold text-zinc-900">
                                                {formatCurrency(summary.payment_breakdown?.[key])}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                ) : (
                    <p className="mt-6 text-sm font-medium text-zinc-400">No data for this range.</p>
                )}
            </div>
        </div>
    );
};

export default ClientDashboard;