import React, { useEffect, useState } from "react";
import {
    CreditCard,
    History,
    RefreshCw,
    Search,
    User,
    CalendarDays,
    CheckCircle2,
    Clock,
    XCircle,
    Plus,
    RotateCcw,
} from "lucide-react";
import { useAuth } from "../../context/authContext";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const ClientSubscriptions = () => {
    const { token } = useAuth();

    const [clients, setClients] = useState([]);
    const [plans, setPlans] = useState([]);

    const [selectedClient, setSelectedClient] = useState(null);

    const [currentSubscription, setCurrentSubscription] = useState(null);
    const [subscriptionHistory, setSubscriptionHistory] = useState([]);

    const [loadingClients, setLoadingClients] = useState(true);
    const [loadingSubscription, setLoadingSubscription] = useState(false);
    const [assigning, setAssigning] = useState(false);
    const [renewingId, setRenewingId] = useState(null);

    const [error, setError] = useState(null);

    const [search, setSearch] = useState("");

    const [showAssignForm, setShowAssignForm] = useState(false);

    const [assignForm, setAssignForm] = useState({
        subscription_plan_id: "",
        billing_cycle: "monthly",
    });

    useEffect(() => {
        loadClients();
        loadPlans();
    }, []);

    async function loadClients() {
        setLoadingClients(true);
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

            if (!res.ok || !json.success) {
                throw new Error(
                    json.message || "Failed to load clients"
                );
            }

            const clientData = Array.isArray(json.data)
                ? json.data
                : Array.isArray(json.data?.clients)
                    ? json.data.clients
                    : Array.isArray(json.data?.data)
                        ? json.data.data
                        : [];

            setClients(clientData);
        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setLoadingClients(false);
        }
    }

    async function loadPlans() {
        try {
            const res = await fetch(
                `${API_BASE_URL}/api/subscription-plans`,
                {
                    headers: {
                        Accept: "application/json",
                        ...(token
                            ? {
                                Authorization: `Bearer ${token}`,
                            }
                            : {}),
                    },
                }
            );

            const json = await res.json();

            if (!res.ok || !json.success) {
                throw new Error(
                    json.message || "Failed to load plans"
                );
            }

            const planData = Array.isArray(json.data)
                ? json.data
                : Array.isArray(json.data?.data)
                    ? json.data.data
                    : [];

            setPlans(planData);
        } catch (err) {
            console.error("Plans error:", err);
        }
    }

    async function selectClient(client) {
        setSelectedClient(client);

        setCurrentSubscription(null);
        setSubscriptionHistory([]);

        setShowAssignForm(false);

        await loadClientSubscriptions(client.id);
    }

    async function loadClientSubscriptions(clientId) {
        setLoadingSubscription(true);
        setError(null);

        try {
            const headers = {
                Accept: "application/json",
                ...(token
                    ? {
                        Authorization: `Bearer ${token}`,
                    }
                    : {}),
            };

            const [currentRes, historyRes] = await Promise.all([
                fetch(
                    `${API_BASE_URL}/api/clients/${clientId}/current-subscription`,
                    {
                        headers,
                    }
                ),

                fetch(
                    `${API_BASE_URL}/api/clients/${clientId}/subscription-history`,
                    {
                        headers,
                    }
                ),
            ]);

            const currentJson = await currentRes.json();
            const historyJson = await historyRes.json();

            if (!currentRes.ok || !currentJson.success) {
                throw new Error(
                    currentJson.message ||
                    "Failed to load current subscription"
                );
            }

            if (!historyRes.ok || !historyJson.success) {
                throw new Error(
                    historyJson.message ||
                    "Failed to load subscription history"
                );
            }

            setCurrentSubscription(
                currentJson.data || null
            );

            const historyData = Array.isArray(historyJson.data)
                ? historyJson.data
                : Array.isArray(historyJson.data?.data)
                    ? historyJson.data.data
                    : Array.isArray(historyJson.data?.subscriptions)
                        ? historyJson.data.subscriptions
                        : [];

            setSubscriptionHistory(historyData);
        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setLoadingSubscription(false);
        }
    }

    async function handleAssignPlan(e) {
        e.preventDefault();

        if (!selectedClient) return;

        if (!assignForm.subscription_plan_id) {
            setError("Please select a subscription plan.");
            return;
        }

        setAssigning(true);
        setError(null);

        try {
            const res = await fetch(
                `${API_BASE_URL}/api/clients/${selectedClient.id}/assign-plan`,
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
                        subscription_plan_id:
                            assignForm.subscription_plan_id,

                        billing_cycle:
                            assignForm.billing_cycle,
                    }),
                }
            );

            const json = await res.json();

            console.log("ASSIGN PLAN RESPONSE:", json);

            if (!res.ok || !json.success) {
                throw new Error(
                    json.message ||
                    "Failed to assign subscription plan"
                );
            }

            setShowAssignForm(false);

            setAssignForm({
                subscription_plan_id: "",
                billing_cycle: "monthly",
            });

            await loadClientSubscriptions(
                selectedClient.id
            );
        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setAssigning(false);
        }
    }

    async function renewPlan(subscription) {
        if (!selectedClient) return;

        const planId =
            subscription.subscription_plan_id ||
            subscription.subscription_plan?.id ||
            subscription.plan?.id;

        const billingCycle = subscription.billing_cycle || "monthly";

        if (!planId) {
            setError("Could not determine which plan to renew.");
            return;
        }

        setRenewingId(subscription.id);
        setError(null);

        try {
            const res = await fetch(
                `${API_BASE_URL}/api/clients/${selectedClient.id}/assign-plan`,
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
                        subscription_plan_id: planId,
                        billing_cycle: billingCycle,
                    }),
                }
            );

            const json = await res.json();

            if (!res.ok || !json.success) {
                throw new Error(
                    json.message || "Failed to renew subscription plan"
                );
            }

            await loadClientSubscriptions(selectedClient.id);
        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setRenewingId(null);
        }
    }

    const filteredClients = clients.filter((client) => {
        const value = search.toLowerCase();

        return (
            client.business_name
                ?.toLowerCase()
                .includes(value) ||
            client.name?.toLowerCase().includes(value) ||
            client.email?.toLowerCase().includes(value) ||
            client.phone?.toLowerCase().includes(value)
        );
    });

    function formatDate(date) {
        if (!date) return "-";

        return new Date(date).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    }

    function getStatusClass(status) {
        switch (status) {
            case "active":
                return "bg-emerald-50 text-emerald-600";

            case "trial":
                return "bg-purple-50 text-[#40295C]";

            case "expired":
                return "bg-rose-50 text-rose-600";

            case "cancelled":
                return "bg-zinc-100 text-zinc-500";

            default:
                return "bg-zinc-100 text-zinc-500";
        }
    }

    function getStatusIcon(status) {
        switch (status) {
            case "active":
                return <CheckCircle2 size={14} />;

            case "trial":
                return <Clock size={14} />;

            case "expired":
                return <XCircle size={14} />;

            default:
                return <Clock size={14} />;
        }
    }

    return (
        <div className="min-h-screen bg-white text-zinc-800 antialiased p-6 md:p-8 lg:p-12">

            <div className="border-b border-zinc-100 pb-8">
                <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">

                    <div>
                        <h1 className="text-4xl font-extrabold tracking-tight text-[#40295C] sm:text-5xl">
                            Client Subscriptions
                        </h1>

                        <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                            Manage client subscription plans
                        </p>
                    </div>

                </div>
            </div>

            {error && (
                <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600">
                    {error}
                </div>
            )}

            <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">

                <div className="rounded-2xl border border-zinc-200/60 bg-white shadow-sm">

                    <div className="border-b border-zinc-100 p-5">

                        <div className="flex items-center gap-2">
                            <User
                                size={17}
                                className="text-[#40295C]"
                            />

                            <h2 className="text-sm font-bold text-zinc-900">
                                Clients
                            </h2>
                        </div>

                        <div className="relative mt-4">
                            <Search
                                size={16}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
                            />

                            <input
                                type="text"
                                value={search}
                                onChange={(e) =>
                                    setSearch(e.target.value)
                                }
                                placeholder="Search clients..."
                                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#40295C]"
                            />
                        </div>
                    </div>

                    <div className="max-h-[650px] overflow-y-auto">

                        {loadingClients ? (
                            <p className="p-5 text-sm text-zinc-400">
                                Loading clients...
                            </p>
                        ) : filteredClients.length === 0 ? (
                            <p className="p-5 text-sm text-zinc-400">
                                No clients found.
                            </p>
                        ) : (
                            filteredClients.map((client) => {
                                const selected =
                                    selectedClient?.id ===
                                    client.id;

                                return (
                                    <button
                                        key={client.id}
                                        type="button"
                                        onClick={() =>
                                            selectClient(client)
                                        }
                                        className={`w-full border-b border-zinc-100 p-4 text-left transition-colors ${selected
                                            ? "bg-[#40295C]/5"
                                            : "hover:bg-zinc-50"
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">

                                            <div
                                                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${selected
                                                    ? "bg-[#40295C] text-white"
                                                    : "bg-[#40295C]/5 text-[#40295C]"
                                                    }`}
                                            >
                                                <User size={17} />
                                            </div>

                                            <div className="min-w-0">

                                                <p className="truncate text-sm font-semibold text-zinc-900">
                                                    {client.business_name ||
                                                        client.name ||
                                                        "Unnamed Client"}
                                                </p>

                                                <p className="truncate text-xs text-zinc-400">
                                                    {client.email}
                                                </p>

                                            </div>
                                        </div>
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>

                <div>
                    {!selectedClient ? (
                        <div className="flex min-h-[500px] items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/30">

                            <div className="text-center">

                                <CreditCard
                                    size={40}
                                    className="mx-auto text-zinc-300"
                                />

                                <h2 className="mt-4 text-sm font-semibold text-zinc-600">
                                    Select a client
                                </h2>

                                <p className="mt-1 text-xs text-zinc-400">
                                    Select a client to view and
                                    manage subscriptions.
                                </p>

                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="flex flex-col gap-4 rounded-2xl border border-zinc-200/60 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">

                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                                        Selected Client
                                    </p>

                                    <h2 className="mt-1 text-xl font-bold text-zinc-900">
                                        {selectedClient.business_name ||
                                            selectedClient.name}
                                    </h2>

                                    <p className="mt-1 text-sm text-zinc-400">
                                        {selectedClient.email}
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowAssignForm(
                                            (prev) => !prev
                                        )
                                    }
                                    className="flex items-center justify-center gap-2 rounded-xl bg-[#40295C] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#321f49]"
                                >
                                    <Plus size={16} />

                                    Assign Plan
                                </button>
                            </div>

                            {showAssignForm && (
                                <form
                                    onSubmit={handleAssignPlan}
                                    className="mt-5 rounded-2xl border border-zinc-200/60 bg-zinc-50/30 p-5"
                                >
                                    <div className="mb-5 flex items-center gap-2">
                                        <CreditCard
                                            size={17}
                                            className="text-[#40295C]"
                                        />

                                        <h3 className="text-sm font-bold text-zinc-900">
                                            Assign Subscription
                                        </h3>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

                                        <div>
                                            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                                                Subscription Plan
                                            </label>

                                            <select
                                                value={
                                                    assignForm.subscription_plan_id
                                                }
                                                onChange={(e) =>
                                                    setAssignForm(
                                                        (prev) => ({
                                                            ...prev,
                                                            subscription_plan_id:
                                                                e.target
                                                                    .value,
                                                        })
                                                    )
                                                }
                                                required
                                                className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm font-medium outline-none focus:border-[#40295C]"
                                            >
                                                <option value="">
                                                    Select plan
                                                </option>

                                                {plans.map(
                                                    (plan) => (
                                                        <option
                                                            key={
                                                                plan.id
                                                            }
                                                            value={
                                                                plan.id
                                                            }
                                                        >
                                                            {
                                                                plan.name
                                                            }
                                                        </option>
                                                    )
                                                )}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                                                Billing Cycle
                                            </label>

                                            <select
                                                value={
                                                    assignForm.billing_cycle
                                                }
                                                onChange={(e) =>
                                                    setAssignForm(
                                                        (prev) => ({
                                                            ...prev,
                                                            billing_cycle:
                                                                e.target
                                                                    .value,
                                                        })
                                                    )
                                                }
                                                className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm font-medium outline-none focus:border-[#40295C]"
                                            >
                                                <option value="monthly">
                                                    Monthly
                                                </option>

                                                <option value="yearly">
                                                    Yearly
                                                </option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="mt-5 flex gap-3">

                                        <button
                                            type="submit"
                                            disabled={assigning}
                                            className="rounded-xl bg-[#40295C] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#321f49] disabled:opacity-50"
                                        >
                                            {assigning
                                                ? "Assigning..."
                                                : "Assign Plan"}
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                setShowAssignForm(
                                                    false
                                                )
                                            }
                                            className="rounded-xl border border-zinc-200 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-600 hover:bg-zinc-50"
                                        >
                                            Cancel
                                        </button>

                                    </div>
                                </form>
                            )}

                            {loadingSubscription ? (
                                <div className="mt-5 rounded-2xl border border-zinc-200/60 p-8 text-center">
                                    <RefreshCw
                                        size={22}
                                        className="mx-auto animate-spin text-[#40295C]"
                                    />

                                    <p className="mt-3 text-sm text-zinc-400">
                                        Loading subscriptions...
                                    </p>
                                </div>
                            ) : (
                                <>

                                    <div className="mt-5">

                                        <div className="mb-3 flex items-center gap-2">
                                            <CreditCard
                                                size={17}
                                                className="text-[#40295C]"
                                            />

                                            <h3 className="text-sm font-bold text-zinc-900">
                                                Current Subscription
                                            </h3>
                                        </div>

                                        {!currentSubscription ? (
                                            <div className="rounded-2xl border border-dashed border-zinc-200 p-8 text-center">

                                                <CreditCard
                                                    size={30}
                                                    className="mx-auto text-zinc-300"
                                                />

                                                <p className="mt-3 text-sm font-medium text-zinc-500">
                                                    No active subscription
                                                </p>

                                                <p className="mt-1 text-xs text-zinc-400">
                                                    Assign a plan to this
                                                    client.
                                                </p>

                                                {subscriptionHistory.length > 0 && (
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            renewPlan(
                                                                subscriptionHistory[0]
                                                            )
                                                        }
                                                        disabled={
                                                            renewingId ===
                                                            subscriptionHistory[0]
                                                                .id
                                                        }
                                                        className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[#40295C] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#321f49] disabled:opacity-50"
                                                    >
                                                        <RotateCcw size={13} />

                                                        {renewingId ===
                                                            subscriptionHistory[0]
                                                                .id
                                                            ? "Renewing..."
                                                            : `Renew "${subscriptionHistory[0].plan_name ||
                                                            subscriptionHistory[0]
                                                                .name ||
                                                            "Same Plan"
                                                            }"`}
                                                    </button>
                                                )}

                                            </div>
                                        ) : (
                                            <div className="rounded-2xl border border-zinc-200/60 bg-white p-6 shadow-sm">

                                                <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">

                                                    <div>
                                                        <div className="flex flex-wrap items-center gap-2">

                                                            <h4 className="text-lg font-bold text-zinc-950">
                                                                {currentSubscription.plan_name ||
                                                                    currentSubscription.subscription_plan?.name ||
                                                                    currentSubscription.plan?.name ||
                                                                    currentSubscription.name ||
                                                                    "Subscription"}
                                                            </h4>

                                                            {currentSubscription.status && (
                                                                <span
                                                                    className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${getStatusClass(
                                                                        currentSubscription.status
                                                                    )}`}
                                                                >
                                                                    {getStatusIcon(
                                                                        currentSubscription.status
                                                                    )}

                                                                    {
                                                                        currentSubscription.status
                                                                    }
                                                                </span>
                                                            )}
                                                        </div>

                                                        <p className="mt-1 text-sm text-zinc-400">
                                                            {currentSubscription.billing_cycle
                                                                ? `${currentSubscription.billing_cycle
                                                                    .charAt(
                                                                        0
                                                                    )
                                                                    .toUpperCase() +
                                                                currentSubscription.billing_cycle.slice(
                                                                    1
                                                                )} billing`
                                                                : ""}
                                                        </p>
                                                    </div>

                                                    <div className="text-left md:text-right">

                                                        {currentSubscription.amount !==
                                                            undefined &&
                                                            currentSubscription.amount !==
                                                            null && (
                                                                <p className="text-xl font-bold text-[#40295C]">
                                                                    ₹
                                                                    {Number(
                                                                        currentSubscription.amount
                                                                    ).toFixed(
                                                                        2
                                                                    )}
                                                                </p>
                                                            )}

                                                        {currentSubscription.ends_at && (
                                                            <p className="mt-1 text-xs text-zinc-400">
                                                                Renews / ends{" "}
                                                                {formatDate(
                                                                    currentSubscription.ends_at
                                                                )}
                                                            </p>
                                                        )}

                                                    </div>
                                                </div>

                                                <div className="mt-6 grid grid-cols-1 gap-4 border-t border-zinc-100 pt-5 sm:grid-cols-3">

                                                    <div>
                                                        <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                                                            Started
                                                        </p>

                                                        <p className="mt-1 text-sm font-semibold text-zinc-700">
                                                            {formatDate(
                                                                currentSubscription.starts_at ||
                                                                currentSubscription.start_date
                                                            )}
                                                        </p>
                                                    </div>

                                                    <div>
                                                        <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                                                            Billing
                                                        </p>

                                                        <p className="mt-1 text-sm font-semibold text-zinc-700">
                                                            {currentSubscription.billing_cycle ||
                                                                "-"}
                                                        </p>
                                                    </div>

                                                    <div>
                                                        <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                                                            Ends
                                                        </p>

                                                        <p className="mt-1 text-sm font-semibold text-zinc-700">
                                                            {formatDate(
                                                                currentSubscription.ends_at ||
                                                                currentSubscription.end_date
                                                            )}
                                                        </p>
                                                    </div>

                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="mt-8">

                                        <div className="mb-3 flex items-center justify-between">

                                            <div className="flex items-center gap-2">
                                                <History
                                                    size={17}
                                                    className="text-[#40295C]"
                                                />

                                                <h3 className="text-sm font-bold text-zinc-900">
                                                    Subscription History
                                                </h3>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    loadClientSubscriptions(
                                                        selectedClient.id
                                                    )
                                                }
                                                className="flex items-center gap-1.5 text-xs font-semibold text-[#40295C] hover:underline"
                                            >
                                                <RefreshCw size={13} />

                                                Refresh
                                            </button>

                                        </div>

                                        <div className="overflow-hidden rounded-2xl border border-zinc-200/60 bg-white shadow-sm">

                                            {subscriptionHistory.length ===
                                                0 ? (
                                                <div className="p-8 text-center">

                                                    <History
                                                        size={30}
                                                        className="mx-auto text-zinc-300"
                                                    />

                                                    <p className="mt-3 text-sm font-medium text-zinc-500">
                                                        No subscription
                                                        history
                                                    </p>

                                                </div>
                                            ) : (
                                                <div className="divide-y divide-zinc-100">

                                                    {subscriptionHistory.map(
                                                        (
                                                            subscription,
                                                            index
                                                        ) => (
                                                            <div
                                                                key={
                                                                    subscription.id ||
                                                                    index
                                                                }
                                                                className="p-5"
                                                            >

                                                                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

                                                                    <div className="flex items-start gap-3">

                                                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#40295C]/5 text-[#40295C]">
                                                                            <CreditCard
                                                                                size={
                                                                                    17
                                                                                }
                                                                            />
                                                                        </div>

                                                                        <div>

                                                                            <h4 className="text-sm font-semibold text-zinc-900">
                                                                                {subscription.plan_name ||
                                                                                    subscription.subscription_plan?.name ||
                                                                                    subscription.plan?.name ||
                                                                                    subscription.name ||
                                                                                    "Subscription"}
                                                                            </h4>

                                                                            <p className="mt-1 text-xs text-zinc-400">
                                                                                {subscription.billing_cycle
                                                                                    ? `${subscription.billing_cycle
                                                                                    } billing`
                                                                                    : ""}
                                                                            </p>

                                                                        </div>

                                                                    </div>

                                                                    <div className="flex flex-wrap items-center gap-5">

                                                                        <div>
                                                                            {/* <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                                                                                Started
                                                                            </p> */}

                                                                            <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-zinc-600">
                                                                                <CalendarDays
                                                                                    size={
                                                                                        12
                                                                                    }
                                                                                />

                                                                                {formatDate(
                                                                                    subscription.starts_at ||
                                                                                    subscription.start_date
                                                                                )}
                                                                            </p>
                                                                        </div>
                                                                        -
                                                                        <div>
                                                                            {/* <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                                                                                Ended
                                                                            </p> */}

                                                                            <p className="mt-1 text-xs font-semibold text-zinc-600">
                                                                                {formatDate(
                                                                                    subscription.ends_at ||
                                                                                    subscription.end_date
                                                                                )}
                                                                            </p>
                                                                        </div>

                                                                        {subscription.status && (
                                                                            <span
                                                                                className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${getStatusClass(
                                                                                    subscription.status
                                                                                )}`}
                                                                            >
                                                                                {getStatusIcon(
                                                                                    subscription.status
                                                                                )}

                                                                                {
                                                                                    subscription.status
                                                                                }
                                                                            </span>
                                                                        )}

                                                                    </div>

                                                                </div>

                                                            </div>
                                                        )
                                                    )}

                                                </div>
                                            )}

                                        </div>
                                    </div>
                                </>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ClientSubscriptions;