import React, { useEffect, useState } from "react";
import {
    List,
    Plus,
    Trash2,
    Pencil,
    Eye,
    X,
    Check,
} from "lucide-react";
import { useAuth } from "../../context/authContext";
import Pagination from "../../components/Pagination";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const emptyForm = {
    name: "",
};

const AdminFeatures = () => {
    const { token } = useAuth();

    const [features, setFeatures] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);

    const [viewingFeature, setViewingFeature] = useState(null);

    useEffect(() => {
        loadFeatures();
    }, []);

    async function loadFeatures() {
        setLoading(true);
        setError(null);

        try {
            const res = await fetch(`${API_BASE_URL}/api/admin-features`, {
                headers: token
                    ? {
                        Authorization: `Bearer ${token}`,
                    }
                    : {},
            });

            if (!res.ok) {
                throw new Error("Failed to load features");
            }

            const json = await res.json();

            if (!json.success) {
                throw new Error(json.message || "Failed to load features");
            }

            setFeatures(json.data || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    function openCreateForm() {
        setEditingId(null);
        setForm(emptyForm);
        setShowForm(true);
        setError(null);
    }

    function openEditForm(feature) {
        setEditingId(feature.id);

        setForm({
            name: feature.name || "",
        });

        setShowForm(true);
        setError(null);
    }

    function closeForm() {
        setShowForm(false);
        setEditingId(null);
        setForm(emptyForm);
    }

    function openViewModal(feature) {
        setViewingFeature(feature);
    }

    function closeViewModal() {
        setViewingFeature(null);
    }

    async function handleSubmit(e) {
        e.preventDefault();

        setSaving(true);
        setError(null);

        const payload = {
            name: form.name.trim(),
        };

        try {
            const url = editingId
                ? `${API_BASE_URL}/api/admin-features/${editingId}`
                : `${API_BASE_URL}/api/admin-features`;

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
                    json.message || "Failed to save feature"
                );
            }

            closeForm();
            await loadFeatures();
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(feature) {
        const confirmed = window.confirm(
            `Are you sure you want to delete "${feature.name}"?`
        );

        if (!confirmed) {
            return;
        }

        setError(null);

        try {
            const res = await fetch(
                `${API_BASE_URL}/api/admin-features/${feature.id}`,
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
                    json.message || "Failed to delete feature"
                );
            }

            await loadFeatures();
        } catch (err) {
            setError(err.message);
        }
    }

    const ITEMS_PER_PAGE = 5;

    const [currentPage, setCurrentPage] = useState(1);

    const totalPages = Math.ceil(
        features.length / ITEMS_PER_PAGE
    );

    const startIndex =
        (currentPage - 1) * ITEMS_PER_PAGE;

    const currentFeatures = features.slice(
        startIndex,
        startIndex + ITEMS_PER_PAGE
    );

    return (
        <div className="min-h-screen bg-white text-zinc-800 antialiased p-6 md:p-8 lg:p-12 selection:bg-zinc-100 selection:text-zinc-900">

            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between border-b border-zinc-100 pb-8">
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight text-[#40295C] sm:text-5xl">
                        Features
                    </h1>

                    <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                        {features.length} Feature
                        {features.length === 1 ? "" : "s"}
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

                    New Feature
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
                    className="mt-6 rounded-2xl border border-zinc-200/60 bg-zinc-50/30 p-6 space-y-4"
                >
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-bold text-zinc-900">
                            {editingId
                                ? "Edit Feature"
                                : "New Feature"}
                        </h2>

                        <button
                            type="button"
                            onClick={closeForm}
                            className="text-zinc-400 hover:text-zinc-700"
                        >
                            <X size={16} />
                        </button>
                    </div>

                    <div>
                        <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                            Feature Name
                        </label>

                        <input
                            type="text"
                            required
                            value={form.name}
                            onChange={(e) =>
                                setForm((prev) => ({
                                    ...prev,
                                    name: e.target.value,
                                }))
                            }
                            placeholder="e.g. Employee Management"
                            className="mt-1.5 w-full rounded-xl border border-zinc-200/80 bg-white px-3.5 py-2.5 text-sm font-medium text-zinc-900 outline-none focus:border-[#40295C]"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={saving}
                        className="flex items-center gap-1.5 rounded-xl bg-[#40295C] px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-[#321f49] disabled:opacity-60"
                    >
                        <Check size={14} />

                        {saving
                            ? "Saving..."
                            : editingId
                                ? "Save Changes"
                                : "Create Feature"}
                    </button>
                </form>
            )}

            <div className="mt-8 rounded-2xl border border-zinc-200/60 bg-white overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.02)]">

                {loading ? (
                    <p className="p-6 text-sm font-medium text-zinc-400">
                        Loading...
                    </p>
                ) : features.length === 0 ? (
                    <div className="p-8 text-center">
                        <List
                            className="mx-auto text-zinc-300"
                            size={28}
                        />

                        <p className="mt-3 text-sm font-medium text-zinc-400">
                            No features yet. Create your first feature
                            to get started.
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-zinc-100">

                        {currentFeatures.map((feature) => (
                            <div
                                key={feature.id}
                                className="flex flex-col gap-3 p-6 transition-colors hover:bg-zinc-50/30 md:flex-row md:items-center md:justify-between"
                            >
                                <div className="flex items-center gap-4">

                                    <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-200/60 bg-zinc-50 text-[#40295C]">
                                        <List
                                            size={18}
                                            strokeWidth={2}
                                        />
                                    </div>

                                    <div>
                                        <h3 className="text-sm font-semibold text-zinc-950">
                                            {feature.name}
                                        </h3>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 md:justify-end">

                                    <button
                                        onClick={() =>
                                            openViewModal(feature)
                                        }
                                        className="flex items-center gap-1.5 rounded-xl border border-zinc-200/80 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 transition-all hover:border-zinc-300 hover:text-zinc-950"
                                    >
                                        <Eye size={12} />
                                        View
                                    </button>

                                    <button
                                        onClick={() =>
                                            openEditForm(feature)
                                        }
                                        className="flex items-center gap-1.5 rounded-xl border border-zinc-200/80 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 transition-all hover:border-zinc-300 hover:text-zinc-950"
                                    >
                                        <Pencil size={12} />
                                        Edit
                                    </button>

                                    <button
                                        onClick={() =>
                                            handleDelete(feature)
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
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                />
            </div>

            {viewingFeature && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
                        <div className="flex items-center justify-between">
                            <h2 className="text-sm font-bold text-zinc-900">
                                Feature Details
                            </h2>

                            <button
                                type="button"
                                onClick={closeViewModal}
                                className="text-zinc-400 hover:text-zinc-700"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <div className="mt-4 space-y-3 text-sm">
                            <div>
                                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                                    ID
                                </span>
                                <p className="mt-1 break-all font-mono text-zinc-800">
                                    {viewingFeature.id}
                                </p>
                            </div>

                            <div>
                                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                                    Name
                                </span>
                                <p className="mt-1 text-zinc-800">
                                    {viewingFeature.name}
                                </p>
                            </div>

                            {viewingFeature.created_at && (
                                <div>
                                    <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                                        Created At
                                    </span>
                                    <p className="mt-1 text-zinc-800">
                                        {new Date(
                                            viewingFeature.created_at
                                        ).toLocaleString()}
                                    </p>
                                </div>
                            )}

                            {viewingFeature.updated_at && (
                                <div>
                                    <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                                        Updated At
                                    </span>
                                    <p className="mt-1 text-zinc-800">
                                        {new Date(
                                            viewingFeature.updated_at
                                        ).toLocaleString()}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminFeatures;