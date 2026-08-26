import React, { useEffect, useState } from "react";
import {
    LayoutGrid,
    Plus,
    Pencil,
    Trash2,
    X,
    Check,
    Users,
    Power,
} from "lucide-react";
import { useAuth } from "../../context/authContext";
import { getPrimaryLocationId } from "../../utils/primaryLocation";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const emptyForm = {
    business_location_id: "",
    name: "",
    capacity: "",
    status: "available",
};

const STATUS_CLASS = {
    available: "bg-emerald-50 text-emerald-600",
    occupied: "bg-rose-50 text-rose-600",
    reserved: "bg-amber-50 text-amber-700",
};

const Tables = () => {
    const { token, clientId, businessLocationId: authBusinessLocationId } = useAuth();
    const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

    const [locations, setLocations] = useState([]);
    const [loadingLocations, setLoadingLocations] = useState(true);

    const [tables, setTables] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [formErrors, setFormErrors] = useState({});

    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);
    const [statusLoading, setStatusLoading] = useState(null);
    const [deletingId, setDeletingId] = useState(null);

    const [locationFilter, setLocationFilter] = useState(
        authBusinessLocationId || ""
    );

    useEffect(() => {
        loadLocations();
    }, [clientId]);

    useEffect(() => {
        loadTables();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [locationFilter]);

    async function loadLocations() {
        setLoadingLocations(true);
        try {
            if (window.electronAPI?.businessLocations) {
                const data = await window.electronAPI.businessLocations.getAll(clientId);
                const nextLocations = Array.isArray(data) ? data : [];
                setLocations(nextLocations);
                if (!authBusinessLocationId) setLocationFilter(getPrimaryLocationId(nextLocations));
                return;
            }
            const res = await fetch(`${API_BASE_URL}/api/client/business-locations?client_id=${clientId}`, { headers: { Accept: "application/json", ...authHeaders } });
            const json = await res.json();
            if (!res.ok || !json.success) throw new Error(json.message || "Failed to load business locations");
            const data = json.data;
            const nextLocations = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
            setLocations(nextLocations);
            if (!authBusinessLocationId) setLocationFilter(getPrimaryLocationId(nextLocations));
        } catch (err) {
            console.error("Load business locations error:", err);
            setLocations([]);
        } finally { setLoadingLocations(false); }
    }

    async function loadTables() {
        setLoading(true);
        setError(null);
        try {
            if (window.electronAPI?.tables) {
                const data = await window.electronAPI.tables.getAll(clientId, locationFilter || null);
                setTables(Array.isArray(data) ? data : []);
                return;
            }
            const query = locationFilter ? `?business_location_id=${locationFilter}&client_id=${clientId}` : `?client_id=${clientId}`;
            const res = await fetch(`${API_BASE_URL}/api/tables${query}`, { headers: { Accept: "application/json", ...authHeaders } });
            const json = await res.json();
            if (!res.ok || !json.success) throw new Error(json.message || "Failed to load tables");
            setTables(Array.isArray(json.data) ? json.data : []);
        } catch (err) {
            console.error("Load tables error:", err);
            setError(err.message);
            setTables([]);
        } finally { setLoading(false); }
    }

    function openCreateForm() {
        setEditingId(null);
        setForm({
            ...emptyForm,
            business_location_id: authBusinessLocationId || locationFilter || "",
        });
        setFormErrors({});
        setError(null);
        setShowForm(true);
    }

    function openEditForm(table) {
        setEditingId(table.id);
        setForm({
            business_location_id: table.business_location_id,
            name: table.name || "",
            capacity: table.capacity ?? "",
            status: table.status || "available",
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
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
        setFormErrors((prev) => ({ ...prev, [name]: "" }));
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setSaving(true); setError(null); setFormErrors({});
        try {
            const isEditing = Boolean(editingId);
            const payload = {
                id: editingId || crypto.randomUUID(),
                client_id: clientId,
                business_location_id: form.business_location_id,
                name: form.name.trim(),
                capacity: form.capacity === "" ? null : Number(form.capacity),
                ...(isEditing ? {} : { status: form.status }),
            };
            if (window.electronAPI?.tables) {
                if (isEditing) await window.electronAPI.tables.update(payload);
                else await window.electronAPI.tables.create(payload);
                closeForm();
                await loadTables();
                return;
            }
            const url = isEditing ? `${API_BASE_URL}/api/tables/${editingId}?client_id=${clientId}` : `${API_BASE_URL}/api/tables?client_id=${clientId}`;
            const res = await fetch(url, { method: isEditing ? "PUT" : "POST", headers: { "Content-Type": "application/json", Accept: "application/json", ...authHeaders }, body: JSON.stringify(payload) });
            const json = await res.json();
            if (!res.ok || !json.success) { if (json.errors) setFormErrors(json.errors); throw new Error(json.message || `Failed to ${isEditing ? "update" : "create"} table`); }
            closeForm(); await loadTables();
        } catch (err) { console.error("Save table error:", err); setError(err.message); }
        finally { setSaving(false); }
    }

    async function changeStatus(table, newStatus) {
        setStatusLoading(table.id); setError(null);
        try {
            if (window.electronAPI?.tables) {
                await window.electronAPI.tables.updateStatus(table.id, clientId, newStatus);
                await loadTables();
                return;
            }
            const res = await fetch(`${API_BASE_URL}/api/tables/${table.id}/change-status?client_id=${clientId}`, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json", ...authHeaders }, body: JSON.stringify({ client_id: clientId, status: newStatus }) });
            const json = await res.json();
            if (!res.ok || !json.success) throw new Error(json.message || "Failed to update table status");
            await loadTables();
        } catch (err) { console.error("Change table status error:", err); setError(err.message); }
        finally { setStatusLoading(null); }
    }

    async function handleDelete(table) {
        const confirmed = window.confirm(`Are you sure you want to delete "${table.name}"?`);
        if (!confirmed) return;
        setDeletingId(table.id); setError(null);
        try {
            if (window.electronAPI?.tables) {
                await window.electronAPI.tables.delete(table.id, clientId);
                await loadTables();
                return;
            }
            const res = await fetch(`${API_BASE_URL}/api/tables/${table.id}?client_id=${clientId}`, { method: "DELETE", headers: { Accept: "application/json", ...authHeaders } });
            const json = await res.json();
            if (!res.ok || !json.success) throw new Error(json.message || "Failed to delete table");
            await loadTables();
        } catch (err) { console.error("Delete table error:", err); setError(err.message); }
        finally { setDeletingId(null); }
    }

    function getFormError(field) {
        if (!formErrors[field]) return null;
        return Array.isArray(formErrors[field]) ? formErrors[field][0] : formErrors[field];
    }

    function inputClass(field) {
        return `mt-1.5 w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm font-medium text-zinc-900 outline-none focus:border-indigo-500 ${formErrors[field] ? "border-rose-400" : "border-zinc-200/80"
            }`;
    }

    return (
        <div className="min-h-screen bg-white text-zinc-800 antialiased p-6 md:p-8 lg:p-5">

            <div className="flex flex-col gap-6 border-b border-zinc-100 pb-6 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight text-indigo-950 sm:text-4xl">
                        Tables
                    </h1>

                    <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                        {tables.length} Table{tables.length === 1 ? "" : "s"}
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {!authBusinessLocationId && (
                        <select
                            value={locationFilter}
                            onChange={(e) => setLocationFilter(e.target.value)}
                            disabled={loadingLocations}
                            className="rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm font-medium outline-none focus:border-indigo-500"
                        >
                            <option value="">All locations</option>
                            {locations.map((loc) => (
                                <option key={loc.id} value={loc.id}>
                                    {loc.name}
                                </option>
                            ))}
                        </select>
                    )}

                    <button
                        onClick={openCreateForm}
                        className="group flex items-center justify-center gap-2 rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-700 hover:scale-[1.01] active:scale-[0.99]"
                    >
                        <Plus size={16} className="transition-transform group-hover:rotate-90" />
                        New Table
                    </button>
                </div>
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
                                {editingId ? "Edit Table" : "New Table"}
                            </h2>
                            <p className="mt-1 text-xs text-zinc-400">
                                {editingId ? "Update this table." : "Add a new dining table."}
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

                        {!authBusinessLocationId && (
                            <div>
                                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                                    Business Location
                                </label>

                                <select
                                    name="business_location_id"
                                    required
                                    value={form.business_location_id}
                                    onChange={handleChange}
                                    disabled={loadingLocations}
                                    className={inputClass("business_location_id")}
                                >
                                    <option value="" disabled>
                                        {loadingLocations ? "Loading..." : "Select a location"}
                                    </option>
                                    {locations.map((loc) => (
                                        <option key={loc.id} value={loc.id}>
                                            {loc.name}
                                        </option>
                                    ))}
                                </select>

                                {getFormError("business_location_id") && (
                                    <p className="mt-1 text-xs text-rose-500">
                                        {getFormError("business_location_id")}
                                    </p>
                                )}
                            </div>
                        )}

                        <div>
                            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                                Table Name
                            </label>

                            <input
                                type="text"
                                name="name"
                                required
                                value={form.name}
                                onChange={handleChange}
                                placeholder="e.g. Table 1"
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
                                Capacity
                            </label>

                            <input
                                type="number"
                                name="capacity"
                                min="1"
                                value={form.capacity}
                                onChange={handleChange}
                                placeholder="e.g. 4"
                                className={inputClass("capacity")}
                            />
                        </div>

                        {!editingId && (
                            <div>
                                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                                    Initial Status
                                </label>

                                <select
                                    name="status"
                                    value={form.status}
                                    onChange={handleChange}
                                    className={inputClass("status")}
                                >
                                    <option value="available">Available</option>
                                    <option value="occupied">Occupied</option>
                                    <option value="reserved">Reserved</option>
                                </select>
                            </div>
                        )}
                    </div>

                    <div className="mt-6 flex gap-3">
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <Check size={14} />
                            {saving
                                ? editingId ? "Updating..." : "Creating..."
                                : editingId ? "Update Table" : "Create Table"}
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

            <div className="mt-8 overflow-hidden rounded-2xl border border-zinc-200/60 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.02)]">

                {loading ? (
                    <p className="p-6 text-sm font-medium text-zinc-400">
                        Loading tables...
                    </p>
                ) : tables.length === 0 ? (
                    <div className="p-10 text-center">
                        <LayoutGrid className="mx-auto text-zinc-300" size={30} />
                        <p className="mt-3 text-sm font-medium text-zinc-400">
                            No tables yet.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 divide-y divide-zinc-100 sm:grid-cols-2 sm:divide-y-0 sm:divide-x lg:grid-cols-3">
                        {tables.map((table) => (
                            <div
                                key={table.id}
                                className="flex flex-col gap-4 p-6 transition-colors hover:bg-zinc-50/30"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                                            <LayoutGrid size={18} />
                                        </div>

                                        <div>
                                            <h3 className="text-sm font-semibold text-zinc-950">
                                                {table.name}
                                            </h3>

                                            {!authBusinessLocationId && (
                                                <p className="text-xs text-zinc-400">
                                                    {table.business_location_name}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <span
                                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${STATUS_CLASS[table.status] || "bg-zinc-100 text-zinc-500"
                                            }`}
                                    >
                                        {table.status}
                                    </span>
                                </div>

                                {table.capacity && (
                                    <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                                        <Users size={13} />
                                        Seats {table.capacity}
                                    </div>
                                )}

                                <div className="flex items-center gap-2">
                                    <Power size={13} className="text-zinc-400" />

                                    <select
                                        value={table.status}
                                        disabled={statusLoading === table.id}
                                        onChange={(e) => changeStatus(table, e.target.value)}
                                        className="flex-1 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-zinc-700 outline-none focus:border-indigo-500 disabled:opacity-50"
                                    >
                                        <option value="available">Available</option>
                                        <option value="occupied">Occupied</option>
                                        <option value="reserved">Reserved</option>
                                    </select>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => openEditForm(table)}
                                        className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-2 text-xs font-semibold text-zinc-600 transition-colors hover:border-indigo-300 hover:text-indigo-600"
                                    >
                                        <Pencil size={12} />
                                        Edit
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => handleDelete(table)}
                                        disabled={deletingId === table.id}
                                        className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-rose-100 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-100 disabled:opacity-50"
                                    >
                                        <Trash2 size={12} />
                                        {deletingId === table.id ? "Deleting..." : "Delete"}
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

export default Tables;