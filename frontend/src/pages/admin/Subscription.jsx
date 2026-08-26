import React, { useEffect, useState } from "react";
import {
    CreditCard,
    Plus,
    Trash2,
    Pencil,
    X,
    Check,
} from "lucide-react";
import { useAuth } from "../../context/authContext";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const emptyForm = {
    name: "",
    description: "",
    monthly_price: "",
    yearly_price: "",
    max_branches: "",
    max_users: "",
    max_products: "",
    is_active: true,
    features: [],
};

const AdminSubscriptionPlans = () => {
    const { token } = useAuth();

    const [plans, setPlans] = useState([]);
    const [availableFeatures, setAvailableFeatures] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        setLoading(true);
        setError(null);

        try {
            const headers = token
                ? {
                    Authorization: `Bearer ${token}`,
                }
                : {};

            const [plansRes, featuresRes] = await Promise.all([
                fetch(`${API_BASE_URL}/api/subscription-plans`, {
                    headers,
                }),
                fetch(`${API_BASE_URL}/api/admin-features`, {
                    headers,
                }),
            ]);

            const plansJson = await plansRes.json();
            const featuresJson = await featuresRes.json();

            if (!plansRes.ok || !plansJson.success) {
                throw new Error(
                    plansJson.message || "Failed to load subscription plans"
                );
            }

            if (!featuresRes.ok || !featuresJson.success) {
                throw new Error(
                    featuresJson.message || "Failed to load features"
                );
            }

            setPlans(plansJson.data || []);
            setAvailableFeatures(featuresJson.data || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    function openCreateForm() {
        setEditingId(null);

        setForm({
            ...emptyForm,
            features: availableFeatures.map((feature) => ({
                feature_id: feature.id,
                enabled: false,
            })),
        });

        setShowForm(true);
        setError(null);
    }

    function openEditForm(plan) {
        const planFeatures = plan.features || [];

        setEditingId(plan.id);

        setForm({
            name: plan.name || "",
            description: plan.description || "",
            monthly_price: plan.monthly_price ?? "",
            yearly_price: plan.yearly_price ?? "",
            max_branches: plan.max_branches ?? "",
            max_users: plan.max_users ?? "",
            max_products: plan.max_products ?? "",
            is_active: plan.is_active ?? true,

            features: availableFeatures.map((feature) => {
                const existingFeature = planFeatures.find(
                    (item) => item.feature_id === feature.id
                );

                return {
                    feature_id: feature.id,
                    enabled: existingFeature
                        ? existingFeature.enabled ?? true
                        : false,
                };
            }),
        });

        setShowForm(true);
        setError(null);
    }

    function closeForm() {
        setShowForm(false);
        setEditingId(null);
        setForm(emptyForm);
    }

    function handleChange(e) {
        const { name, value, type, checked } = e.target;

        setForm((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    }

    function toggleFeature(featureId) {
        setForm((prev) => ({
            ...prev,
            features: prev.features.map((feature) =>
                feature.feature_id === featureId
                    ? {
                        ...feature,
                        enabled: !feature.enabled,
                    }
                    : feature
            ),
        }));
    }

    async function handleSubmit(e) {
        e.preventDefault();

        setSaving(true);
        setError(null);

        const payload = {
            name: form.name.trim(),
            description: form.description.trim(),

            monthly_price:
                form.monthly_price === ""
                    ? null
                    : parseFloat(form.monthly_price),

            yearly_price:
                form.yearly_price === ""
                    ? null
                    : parseFloat(form.yearly_price),

            max_branches:
                form.max_branches === ""
                    ? null
                    : parseInt(form.max_branches, 10),

            max_users:
                form.max_users === ""
                    ? null
                    : parseInt(form.max_users, 10),

            max_products:
                form.max_products === ""
                    ? null
                    : parseInt(form.max_products, 10),

            is_active: form.is_active,

            features: form.features
                .filter((feature) => feature.enabled)
                .map((feature) => ({
                    feature_id: feature.feature_id,
                    enabled: true,
                })),
        };

        try {
            const url = editingId
                ? `${API_BASE_URL}/api/subscription-plans/${editingId}`
                : `${API_BASE_URL}/api/subscription-plans`;

            const method = editingId ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    ...(token
                        ? {
                            Authorization: `Bearer ${token}`,
                        }
                        : {}),
                },
                body: JSON.stringify(payload),
            });

            const json = await res.json();

            if (!res.ok || !json.success) {
                throw new Error(
                    json.message || "Failed to save subscription plan"
                );
            }

            closeForm();
            await loadData();
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(plan) {
        const confirmed = window.confirm(
            `Are you sure you want to delete "${plan.name}"?`
        );

        if (!confirmed) {
            return;
        }

        setError(null);

        try {
            const res = await fetch(
                `${API_BASE_URL}/api/subscription-plans/${plan.id}`,
                {
                    method: "DELETE",
                    headers: token
                        ? {
                            Authorization: `Bearer ${token}`,
                        }
                        : {},
                }
            );

            const json = await res.json();

            if (!res.ok || !json.success) {
                throw new Error(
                    json.message || "Failed to delete subscription plan"
                );
            }

            await loadData();
        } catch (err) {
            setError(err.message);
        }
    }

    return (
        <div className="min-h-screen bg-white text-zinc-800 antialiased p-6 md:p-8 lg:p-12 selection:bg-zinc-100 selection:text-zinc-900">

            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between border-b border-zinc-100 pb-8">
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight text-[#40295C] sm:text-5xl">
                        Subscription Plans
                    </h1>

                    <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                        {plans.length} Plan
                        {plans.length === 1 ? "" : "s"}
                    </p>
                </div>

                <button
                    onClick={openCreateForm}
                    className="group flex items-center justify-center gap-2 rounded-full bg-[#40295C] px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-[#321f49] hover:scale-[1.01] active:scale-[0.99] shadow-sm"
                >
                    <Plus
                        size={16}
                        className="transition-transform group-hover:rotate-90"
                    />

                    New Plan
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
                    className="mt-6 rounded-2xl border border-zinc-200/60 bg-zinc-50/30 p-6 space-y-6"
                >
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-bold text-zinc-900">
                            {editingId
                                ? "Edit Subscription Plan"
                                : "New Subscription Plan"}
                        </h2>

                        <button
                            type="button"
                            onClick={closeForm}
                            className="text-zinc-400 hover:text-zinc-700"
                        >
                            <X size={16} />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                                Plan Name
                            </label>

                            <input
                                type="text"
                                name="name"
                                required
                                value={form.name}
                                onChange={handleChange}
                                placeholder="e.g. Starter"
                                className="mt-1.5 w-full rounded-xl border border-zinc-200/80 bg-white px-3.5 py-2.5 text-sm font-medium text-zinc-900 outline-none focus:border-[#40295C]"
                            />
                        </div>

                        <div>
                            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                                Status
                            </label>

                            <label className="mt-1.5 flex h-11 cursor-pointer items-center gap-3 rounded-xl border border-zinc-200/80 bg-white px-3.5">
                                <input
                                    type="checkbox"
                                    name="is_active"
                                    checked={form.is_active}
                                    onChange={handleChange}
                                    className="h-4 w-4 accent-[#40295C]"
                                />

                                <span className="text-sm font-medium text-zinc-700">
                                    Active Plan
                                </span>
                            </label>
                        </div>

                        <div className="md:col-span-2">
                            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                                Description
                            </label>

                            <textarea
                                name="description"
                                rows="3"
                                value={form.description}
                                onChange={handleChange}
                                placeholder="e.g. Perfect for small restaurants"
                                className="mt-1.5 w-full resize-none rounded-xl border border-zinc-200/80 bg-white px-3.5 py-2.5 text-sm font-medium text-zinc-900 outline-none focus:border-[#40295C]"
                            />
                        </div>
                    </div>

                    <div>
                        <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-zinc-400">
                            Pricing
                        </h3>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div>
                                <label className="text-xs font-semibold text-zinc-500">
                                    Monthly Price
                                </label>

                                <input
                                    type="number"
                                    name="monthly_price"
                                    min="0"
                                    step="0.01"
                                    value={form.monthly_price}
                                    onChange={handleChange}
                                    placeholder="299.99"
                                    className="mt-1.5 w-full rounded-xl border border-zinc-200/80 bg-white px-3.5 py-2.5 text-sm font-medium text-zinc-900 outline-none focus:border-[#40295C]"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-zinc-500">
                                    Yearly Price
                                </label>

                                <input
                                    type="number"
                                    name="yearly_price"
                                    min="0"
                                    step="0.01"
                                    value={form.yearly_price}
                                    onChange={handleChange}
                                    placeholder="2999.99"
                                    className="mt-1.5 w-full rounded-xl border border-zinc-200/80 bg-white px-3.5 py-2.5 text-sm font-medium text-zinc-900 outline-none focus:border-[#40295C]"
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-zinc-400">
                            Plan Limits
                        </h3>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                            <div>
                                <label className="text-xs font-semibold text-zinc-500">
                                    Max Branches
                                </label>

                                <input
                                    type="number"
                                    name="max_branches"
                                    min="1"
                                    value={form.max_branches}
                                    onChange={handleChange}
                                    placeholder="1"
                                    className="mt-1.5 w-full rounded-xl border border-zinc-200/80 bg-white px-3.5 py-2.5 text-sm font-medium text-zinc-900 outline-none focus:border-[#40295C]"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-zinc-500">
                                    Max Users
                                </label>

                                <input
                                    type="number"
                                    name="max_users"
                                    min="1"
                                    value={form.max_users}
                                    onChange={handleChange}
                                    placeholder="5"
                                    className="mt-1.5 w-full rounded-xl border border-zinc-200/80 bg-white px-3.5 py-2.5 text-sm font-medium text-zinc-900 outline-none focus:border-[#40295C]"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-zinc-500">
                                    Max Products
                                </label>

                                <input
                                    type="number"
                                    name="max_products"
                                    min="1"
                                    value={form.max_products}
                                    onChange={handleChange}
                                    placeholder="100"
                                    className="mt-1.5 w-full rounded-xl border border-zinc-200/80 bg-white px-3.5 py-2.5 text-sm font-medium text-zinc-900 outline-none focus:border-[#40295C]"
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <div className="mb-3 flex items-center justify-between">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                                Features
                            </h3>

                            <span className="text-xs text-zinc-400">
                                Select enabled features
                            </span>
                        </div>

                        {availableFeatures.length === 0 ? (
                            <div className="rounded-xl border border-zinc-200 bg-white p-4 text-sm text-zinc-400">
                                No features available.
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                {availableFeatures.map((feature) => {
                                    const selected = form.features.find(
                                        (item) =>
                                            item.feature_id === feature.id
                                    );

                                    const enabled =
                                        selected?.enabled || false;

                                    return (
                                        <button
                                            key={feature.id}
                                            type="button"
                                            onClick={() =>
                                                toggleFeature(feature.id)
                                            }
                                            className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left transition-all ${enabled
                                                ? "border-[#40295C] bg-[#40295C]/5"
                                                : "border-zinc-200/80 bg-white hover:border-zinc-300"
                                                }`}
                                        >
                                            <p
                                                className={`text-sm font-semibold ${enabled
                                                    ? "text-[#40295C]"
                                                    : "text-zinc-700"
                                                    }`}
                                            >
                                                {feature.name}
                                            </p>

                                            <div
                                                className={`flex h-6 w-6 items-center justify-center rounded-full border ${enabled
                                                    ? "border-[#40295C] bg-[#40295C] text-white"
                                                    : "border-zinc-300 text-transparent"
                                                    }`}
                                            >
                                                <Check size={13} />
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={saving}
                        className="flex items-center gap-1.5 rounded-xl bg-[#40295C] px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-[#321f49] disabled:opacity-60"
                    >
                        <Check size={14} />

                        {saving
                            ? "Saving..."
                            : editingId
                                ? "Save Changes"
                                : "Create Plan"}
                    </button>
                </form>
            )}

            <div className="mt-8 rounded-2xl border border-zinc-200/60 bg-white overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.02)]">

                {loading ? (
                    <p className="p-6 text-sm font-medium text-zinc-400">
                        Loading...
                    </p>
                ) : plans.length === 0 ? (
                    <div className="p-8 text-center">
                        <CreditCard
                            className="mx-auto text-zinc-300"
                            size={28}
                        />

                        <p className="mt-3 text-sm font-medium text-zinc-400">
                            No subscription plans yet.
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-zinc-100">

                        {plans.map((plan) => (
                            <div
                                key={plan.id}
                                className="flex flex-col gap-5 p-6 transition-colors hover:bg-zinc-50/30 lg:flex-row lg:items-center lg:justify-between"
                            >
                                <div className="flex items-start gap-4">

                                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-zinc-200/60 bg-zinc-50 text-[#40295C]">
                                        <CreditCard
                                            size={18}
                                            strokeWidth={2}
                                        />
                                    </div>

                                    <div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h3 className="text-sm font-semibold text-zinc-950">
                                                {plan.name}
                                            </h3>

                                            <span
                                                className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${plan.is_active
                                                    ? "bg-emerald-50 text-emerald-600"
                                                    : "bg-zinc-100 text-zinc-400"
                                                    }`}
                                            >
                                                {plan.is_active
                                                    ? "Active"
                                                    : "Inactive"}
                                            </span>
                                        </div>

                                        {plan.description && (
                                            <p className="mt-1 text-xs text-zinc-500">
                                                {plan.description}
                                            </p>
                                        )}

                                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500">
                                            <span>
                                                ₹{Number(
                                                    plan.monthly_price || 0
                                                ).toFixed(2)}
                                                /month
                                            </span>

                                            <span>
                                                ₹{Number(
                                                    plan.yearly_price || 0
                                                ).toFixed(2)}
                                                /year
                                            </span>

                                            <span>
                                                {plan.max_branches ?? "∞"}{" "}
                                                branch
                                                {plan.max_branches === 1
                                                    ? ""
                                                    : "es"}
                                            </span>

                                            <span>
                                                {plan.max_users ?? "∞"} users
                                            </span>

                                            <span>
                                                {plan.max_products ?? "∞"}{" "}
                                                products
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 lg:justify-end">

                                    <button
                                        onClick={() =>
                                            openEditForm(plan)
                                        }
                                        className="flex items-center gap-1.5 rounded-xl border border-zinc-200/80 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 transition-all hover:border-zinc-300 hover:text-zinc-950"
                                    >
                                        <Pencil size={12} />
                                        Edit
                                    </button>

                                    <button
                                        onClick={() =>
                                            handleDelete(plan)
                                        }
                                        className="flex items-center gap-1.5 rounded-xl border border-rose-100 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-600 transition-all hover:bg-rose-100"
                                    >
                                        <Trash2 size={12} />
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminSubscriptionPlans;