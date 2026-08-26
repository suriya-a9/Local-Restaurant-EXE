import React, { useEffect, useState } from "react";
import {
    Ruler,
    Plus,
    X,
    Check,
    Search,
    Pencil,
    Trash2,
} from "lucide-react";
import { useAuth } from "../../context/authContext";
import Pagination from "../../components/Pagination";
import EntityTable from "../../components/EntityTable";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const emptyForm = {
    name: "",
    short_name: "",
    allow_decimal: false,
};

const Units = () => {
    const { token, clientId } = useAuth();
    const isElectron = Boolean(window.electronAPI);

    const [units, setUnits] = useState([]);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState(null);

    const [error, setError] = useState(null);
    const [formErrors, setFormErrors] = useState({});

    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const [form, setForm] = useState(emptyForm);

    const [deleteTarget, setDeleteTarget] = useState(null);

    const [search, setSearch] = useState("");

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    useEffect(() => {
        if (isElectron && !clientId) return;
        loadUnits();
    }, [clientId]);

    function authHeaders() {
        return {
            Accept: "application/json",
            ...(token
                ? {
                    Authorization: `Bearer ${token}`,
                }
                : {}),
        };
    }

    async function loadUnits() {
        setLoading(true);
        setError(null);

        try {
            if (isElectron) {
                const data = await window.electronAPI.units.getAll(clientId);
                setUnits(Array.isArray(data) ? data : []);
                return;
            }

            const res = await fetch(
                `${API_BASE_URL}/api/client/units?per_page=1000${clientId ? `&client_id=${clientId}` : ""}`,
                { headers: authHeaders() }
            );
            const json = await res.json();
            if (!res.ok || !json.success) throw new Error(json.message || "Failed to load units");
            const data = json.data;
            setUnits(Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Load units error:", err);
            setError(err.message);
            setUnits([]);
        } finally {
            setLoading(false);
        }
    }

    function openCreateForm() {
        setEditingId(null);
        setForm(emptyForm);
        setFormErrors({});
        setError(null);
        setShowForm(true);
    }

    function openEditForm(unit) {
        setEditingId(unit.id);
        setForm({
            name: unit.name || "",
            short_name: unit.short_name || "",
            allow_decimal: !!unit.allow_decimal,
        });
        setFormErrors({});
        setError(null);
        setShowForm(true);
    }

    function closeForm() {
        if (saving) return;

        setShowForm(false);
        setEditingId(null);
        setForm(emptyForm);
        setFormErrors({});
    }

    function handleChange(e) {
        const { name, value, type, checked } = e.target;

        setForm((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
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

        const payload = {
            client_id: clientId,
            name: form.name.trim(),
            short_name: form.short_name.trim(),
            allow_decimal: form.allow_decimal,
        };
        const isEditing = Boolean(editingId);

        try {
            if (isElectron) {
                if (!clientId) throw new Error("Client ID is missing");
                if (isEditing) {
                    await window.electronAPI.units.update({ ...payload, id: editingId });
                } else {
                    await window.electronAPI.units.create({ ...payload, id: crypto.randomUUID() });
                }
                closeForm();
                if (!isEditing) setCurrentPage(1);
                await loadUnits();
                return;
            }

            const url = isEditing
                ? `${API_BASE_URL}/api/client/units/${editingId}?client_id=${clientId}`
                : `${API_BASE_URL}/api/client/units`;
            const res = await fetch(url, {
                method: isEditing ? "PUT" : "POST",
                headers: { "Content-Type": "application/json", ...authHeaders() },
                body: JSON.stringify(payload),
            });
            const json = await res.json();
            if (!res.ok || !json.success) {
                if (json.errors) setFormErrors(json.errors);
                throw new Error(json.message || `Failed to ${isEditing ? "update" : "create"} unit`);
            }
            closeForm();
            if (!isEditing) setCurrentPage(1);
            await loadUnits();
        } catch (err) {
            console.error("Save unit error:", err);
            setError(err.message);
        } finally {
            setSaving(false);
        }
    }

    function requestDelete(unit) {
        setError(null);
        setDeleteTarget(unit);
    }

    function cancelDelete() {
        if (deletingId) return;
        setDeleteTarget(null);
    }

    async function confirmDelete() {
        if (!deleteTarget) return;
        setDeletingId(deleteTarget.id);
        setError(null);

        try {
            if (isElectron) {
                await window.electronAPI.units.delete(deleteTarget.id, clientId);
            } else {
                const res = await fetch(
                    `${API_BASE_URL}/api/client/units/${deleteTarget.id}?client_id=${clientId}`,
                    { method: "DELETE", headers: authHeaders() }
                );
                const json = await res.json();
                if (!res.ok || !json.success) throw new Error(json.message || "Failed to delete unit");
            }
            setDeleteTarget(null);
            if (paginatedUnits.length === 1 && currentPage > 1) setCurrentPage((prev) => prev - 1);
            await loadUnits();
        } catch (err) {
            console.error("Delete unit error:", err);
            setError(err.message);
        } finally {
            setDeletingId(null);
        }
    }

    const filteredUnits = Array.isArray(units)
        ? units.filter((unit) => {
            const searchValue = search.toLowerCase();

            return (
                unit.name
                    ?.toLowerCase()
                    .includes(searchValue) ||
                unit.short_name
                    ?.toLowerCase()
                    .includes(searchValue)
            );
        })
        : [];

    const totalPages = Math.ceil(
        filteredUnits.length / itemsPerPage
    );

    const startIndex =
        (currentPage - 1) * itemsPerPage;

    const paginatedUnits = filteredUnits.slice(
        startIndex,
        startIndex + itemsPerPage
    );

    function getFormError(field) {
        if (!formErrors[field]) return null;

        return Array.isArray(formErrors[field])
            ? formErrors[field][0]
            : formErrors[field];
    }

    function inputClass(field) {
        return `mt-1.5 w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm font-medium text-zinc-900 outline-none focus:border-indigo-500 ${formErrors[field]
            ? "border-rose-400"
            : "border-zinc-200/80"
            }`;
    }

    function handlePageChange(page) {
        setCurrentPage(page);
    }

    const isEditing = Boolean(editingId);

    return (
        <div className="min-h-screen bg-white text-zinc-800 antialiased p-6 md:p-8 lg:p-5">

            <div className="flex flex-col gap-6 border-b border-zinc-100 pb-6 md:flex-row md:items-center md:justify-between">

                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight text-indigo-950 sm:text-4xl">
                        Units
                    </h1>

                    <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                        {units.length} Unit
                        {units.length === 1
                            ? ""
                            : "s"}
                    </p>
                </div>

                <button
                    onClick={openCreateForm}
                    className="group flex items-center justify-center gap-2 rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-700 hover:scale-[1.01] active:scale-[0.99]"
                >
                    <Plus
                        size={16}
                        className="transition-transform group-hover:rotate-90"
                    />

                    New Unit
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
                                {isEditing
                                    ? "Edit Unit"
                                    : "New Unit"}
                            </h2>

                            <p className="mt-1 text-xs text-zinc-400">
                                {isEditing
                                    ? "Update this unit of measurement."
                                    : "Create a new unit of measurement."}
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={closeForm}
                            disabled={saving}
                            className="text-zinc-400 transition-colors hover:text-zinc-700 disabled:opacity-50"
                        >
                            <X size={18} />
                        </button>

                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

                        <div>
                            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                                Name
                            </label>

                            <input
                                type="text"
                                name="name"
                                required
                                value={form.name}
                                onChange={handleChange}
                                placeholder="Quantity"
                                className={inputClass("name")}
                            />

                            {getFormError("name") && (
                                <p className="mt-1 text-xs text-rose-500">
                                    {getFormError("name")}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                                Short Name
                            </label>

                            <input
                                type="text"
                                name="short_name"
                                required
                                value={form.short_name}
                                onChange={handleChange}
                                placeholder="Qty"
                                className={inputClass("short_name")}
                            />

                            {getFormError("short_name") && (
                                <p className="mt-1 text-xs text-rose-500">
                                    {getFormError("short_name")}
                                </p>
                            )}
                        </div>

                        <div className="md:col-span-2">
                            <label className="flex items-center gap-2.5 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                                <input
                                    type="checkbox"
                                    name="allow_decimal"
                                    checked={form.allow_decimal}
                                    onChange={handleChange}
                                    className="h-4 w-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
                                />

                                Allow Decimal
                            </label>

                            {getFormError("allow_decimal") && (
                                <p className="mt-1 text-xs text-rose-500">
                                    {getFormError("allow_decimal")}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="mt-6 flex gap-3">

                        <button
                            type="submit"
                            disabled={saving}
                            className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <Check size={14} />

                            {saving
                                ? isEditing
                                    ? "Saving..."
                                    : "Creating..."
                                : isEditing
                                    ? "Save Changes"
                                    : "Create Unit"}
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
                        placeholder="Search units..."
                        className="w-full rounded-xl border border-zinc-200 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-indigo-500"
                    />

                </div>
            </div>

            <div className="mt-6 overflow-hidden rounded-2xl border border-zinc-200/60 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.02)]">

                {loading ? (
                    <p className="p-6 text-sm font-medium text-zinc-400">
                        Loading units...
                    </p>
                ) : filteredUnits.length === 0 ? (
                    <div className="p-10 text-center">

                        <Ruler
                            className="mx-auto text-zinc-300"
                            size={30}
                        />

                        <p className="mt-3 text-sm font-medium text-zinc-400">
                            {search
                                ? "No units found."
                                : "No units yet."}
                        </p>

                    </div>
                ) : (<>
                    <EntityTable
                        columns={[{ key: "name", label: "Unit" }, { key: "short_name", label: "Short Name" }, { key: "decimal", label: "Decimal" }]}
                        rows={paginatedUnits}
                        onEdit={openEditForm}
                        onDelete={requestDelete}
                        renderCells={(unit) => <><td className="px-5 py-4"><div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600"><Ruler size={16} /></div><span className="text-sm font-bold text-zinc-900">{unit.name}</span></div></td><td className="px-5 py-4 text-sm text-zinc-600">{unit.short_name}</td><td className="px-5 py-4 text-sm text-zinc-600">{unit.allow_decimal ? "Yes" : "No"}</td></>}
                    />
                    {/*

                        {paginatedUnits.map((unit) => (
                            <div
                                key={unit.id}
                                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-5 p-5 transition-colors hover:bg-zinc-50/30"
                            >

                                <div className="flex items-center gap-4">

                                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                                        <Ruler size={18} />
                                    </div>

                                    <div>

                                        <div className="flex flex-wrap items-center gap-2">

                                            <h3 className="text-sm font-semibold text-zinc-950">
                                                {unit.name}
                                            </h3>

                                            <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold uppercase text-indigo-600">
                                                {unit.short_name}
                                            </span>

                                            {unit.allow_decimal ? (
                                                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-600">
                                                    Decimal
                                                </span>
                                            ) : (
                                                <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-bold uppercase text-zinc-500">
                                                    Whole Number
                                                </span>
                                            )}

                                        </div>

                                    </div>

                                </div>

                                <div className="flex shrink-0 items-center gap-2 lg:pl-4">

                                    <button
                                        onClick={() => openEditForm(unit)}
                                        className="flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-2 text-xs font-semibold text-zinc-600 transition-colors hover:border-indigo-300 hover:text-indigo-600"
                                    >
                                        <Pencil size={13} />
                                        Edit
                                    </button>

                                    <button
                                        onClick={() => requestDelete(unit)}
                                        className="flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-2 text-xs font-semibold text-zinc-600 transition-colors hover:border-rose-300 hover:text-rose-600"
                                    >
                                        <Trash2 size={13} />
                                        Delete
                                    </button>

                                </div>

                            </div>
                        ))}

                    </div>*/}</>)}
            </div>

            {!loading &&
                filteredUnits.length > 0 &&
                totalPages > 1 && (
                    <div className="mt-6">
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={handlePageChange}
                        />
                    </div>
                )}

            {deleteTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/40 p-4">

                    <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">

                        <h3 className="text-sm font-bold text-zinc-900">
                            Delete this unit?
                        </h3>

                        <p className="mt-2 text-sm text-zinc-500">
                            <span className="font-semibold text-zinc-700">
                                {deleteTarget.name}
                            </span>{" "}
                            will be permanently removed. This can't be undone.
                        </p>

                        <div className="mt-6 flex gap-3">

                            <button
                                onClick={confirmDelete}
                                disabled={deletingId === deleteTarget.id}
                                className="flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                <Trash2 size={14} />

                                {deletingId === deleteTarget.id
                                    ? "Deleting..."
                                    : "Delete"}
                            </button>

                            <button
                                onClick={cancelDelete}
                                disabled={deletingId === deleteTarget.id}
                                className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-600 hover:bg-zinc-50"
                            >
                                Cancel
                            </button>

                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default Units;