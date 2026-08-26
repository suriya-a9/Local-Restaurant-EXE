import React, { useEffect, useState } from "react";
import {
    Tags,
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
    category_id: "",
    name: "",
};

const SubCategories = () => {
    const { token, clientId } = useAuth();
    const isElectron = Boolean(window.electronAPI);

    const [subCategories, setSubCategories] = useState([]);
    const [categories, setCategories] = useState([]);

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
    const itemsPerPage = 10;

    useEffect(() => {
        if (isElectron && !clientId) return;
        loadSubCategories();
        loadCategories();
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

    async function loadSubCategories() {
        setLoading(true);
        setError(null);
        try {
            if (isElectron) {
                const data = await window.electronAPI.subCategories.getAll(clientId);
                setSubCategories(Array.isArray(data) ? data : []);
                return;
            }
            const res = await fetch(`${API_BASE_URL}/api/client/sub-categories${clientId ? `?client_id=${clientId}` : ""}`, { headers: authHeaders() });
            const json = await res.json();
            if (!res.ok || !json.success) throw new Error(json.message || "Failed to load sub categories");
            const data = json.data;
            setSubCategories(Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Load sub categories error:", err);
            setError(err.message);
            setSubCategories([]);
        } finally { setLoading(false); }
    }

    async function loadCategories() {
        try {
            if (isElectron) {
                const data = await window.electronAPI.categories.getAll(clientId);
                setCategories(Array.isArray(data) ? data : []);
                return;
            }
            const res = await fetch(`${API_BASE_URL}/api/client/categories?per_page=1000${clientId ? `&client_id=${clientId}` : ""}`, { headers: authHeaders() });
            const json = await res.json();
            if (!res.ok || !json.success) throw new Error(json.message || "Failed to load categories");
            const data = json.data;
            setCategories(Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Load categories error:", err);
            setError(err.message);
        }
    }

    function openCreateForm() {
        setEditingId(null);
        setForm(emptyForm);
        setFormErrors({});
        setError(null);
        setShowForm(true);
    }

    function openEditForm(subCategory) {
        setEditingId(subCategory.id);
        setForm({
            category_id:
                subCategory.category?.id ??
                subCategory.category_id ??
                "",
            name: subCategory.name || "",
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
        setSaving(true); setError(null); setFormErrors({});
        const payload = { client_id: clientId, category_id: form.category_id, name: form.name.trim() };
        const isEditing = Boolean(editingId);
        try {
            if (isElectron) {
                if (isEditing) await window.electronAPI.subCategories.update({ ...payload, id: editingId });
                else await window.electronAPI.subCategories.create({ ...payload, id: crypto.randomUUID() });
                closeForm(); if (!isEditing) setCurrentPage(1); await loadSubCategories(); return;
            }
            const url = isEditing ? `${API_BASE_URL}/api/client/sub-categories/${editingId}?client_id=${clientId}` : `${API_BASE_URL}/api/client/sub-categories`;
            const res = await fetch(url, { method: isEditing ? "PUT" : "POST", headers: { "Content-Type": "application/json", ...authHeaders() }, body: JSON.stringify(payload) });
            const json = await res.json();
            if (!res.ok || !json.success) { if (json.errors) setFormErrors(json.errors); throw new Error(json.message || `Failed to ${isEditing ? "update" : "create"} sub category`); }
            closeForm(); if (!isEditing) setCurrentPage(1); await loadSubCategories();
        } catch (err) { console.error("Save sub category error:", err); setError(err.message); }
        finally { setSaving(false); }
    }

    function requestDelete(subCategory) {
        setError(null);
        setDeleteTarget(subCategory);
    }

    function cancelDelete() {
        if (deletingId) return;
        setDeleteTarget(null);
    }

    async function confirmDelete() {
        if (!deleteTarget) return;
        setDeletingId(deleteTarget.id); setError(null);
        try {
            if (isElectron) await window.electronAPI.subCategories.delete(deleteTarget.id, clientId);
            else {
                const res = await fetch(`${API_BASE_URL}/api/client/sub-categories/${deleteTarget.id}?client_id=${clientId}`, { method: "DELETE", headers: authHeaders() });
                const json = await res.json();
                if (!res.ok || !json.success) throw new Error(json.message || "Failed to delete sub category");
            }
            setDeleteTarget(null); if (paginatedSubCategories.length === 1 && currentPage > 1) setCurrentPage((prev) => prev - 1); await loadSubCategories();
        } catch (err) { console.error("Delete sub category error:", err); setError(err.message); }
        finally { setDeletingId(null); }
    }

    function getCategoryName(subCategory) {
        if (subCategory.category?.name) {
            return subCategory.category.name;
        }

        const category = categories.find(
            (item) =>
                String(item.id) ===
                String(subCategory.category_id)
        );

        return category?.name || "—";
    }

    const filteredSubCategories = Array.isArray(subCategories)
        ? subCategories.filter((subCategory) => {
            const searchValue = search.toLowerCase();

            return (
                subCategory.name
                    ?.toLowerCase()
                    .includes(searchValue) ||
                getCategoryName(subCategory)
                    ?.toLowerCase()
                    .includes(searchValue)
            );
        })
        : [];

    const totalPages = Math.ceil(
        filteredSubCategories.length / itemsPerPage
    );

    const startIndex =
        (currentPage - 1) * itemsPerPage;

    const paginatedSubCategories = filteredSubCategories.slice(
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
                        Sub Categories
                    </h1>

                    <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                        {subCategories.length} Sub Categor
                        {subCategories.length === 1
                            ? "y"
                            : "ies"}
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

                    New Sub Category
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
                                    ? "Edit Sub Category"
                                    : "New Sub Category"}
                            </h2>

                            <p className="mt-1 text-xs text-zinc-400">
                                {isEditing
                                    ? "Update this sub category's details."
                                    : "Create a new sub category under a category."}
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
                                Category
                            </label>

                            <select
                                name="category_id"
                                required
                                value={form.category_id}
                                onChange={handleChange}
                                className={inputClass("category_id")}
                            >
                                <option value="">
                                    Select category
                                </option>

                                {categories.map((category) => (
                                    <option
                                        key={category.id}
                                        value={category.id}
                                    >
                                        {category.name}
                                    </option>
                                ))}
                            </select>

                            {getFormError("category_id") && (
                                <p className="mt-1 text-xs text-rose-500">
                                    {getFormError("category_id")}
                                </p>
                            )}
                        </div>

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
                                placeholder="Mutton Starters"
                                className={inputClass("name")}
                            />

                            {getFormError("name") && (
                                <p className="mt-1 text-xs text-rose-500">
                                    {getFormError("name")}
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
                                    : "Create Sub Category"}
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
                        placeholder="Search sub categories..."
                        className="w-full rounded-xl border border-zinc-200 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-indigo-500"
                    />

                </div>
            </div>

            <div className="mt-6 overflow-hidden rounded-2xl border border-zinc-200/60 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.02)]">

                {loading ? (
                    <p className="p-6 text-sm font-medium text-zinc-400">
                        Loading sub categories...
                    </p>
                ) : filteredSubCategories.length === 0 ? (
                    <div className="p-10 text-center">

                        <Tags
                            className="mx-auto text-zinc-300"
                            size={30}
                        />

                        <p className="mt-3 text-sm font-medium text-zinc-400">
                            {search
                                ? "No sub categories found."
                                : "No sub categories yet."}
                        </p>

                    </div>
                ) : (<>
                    <EntityTable
                        columns={[{ key: "name", label: "Sub Category" }, { key: "category", label: "Category" }, { key: "products", label: "Products" }]}
                        rows={paginatedSubCategories}
                        onEdit={openEditForm}
                        onDelete={requestDelete}
                        renderCells={(subCategory) => <><td className="px-5 py-4"><div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600"><Tags size={16} /></div><span className="text-sm font-bold text-zinc-900">{subCategory.name}</span></div></td><td className="px-5 py-4 text-sm text-zinc-600">{getCategoryName(subCategory)}</td><td className="px-5 py-4 text-sm text-zinc-600">{subCategory.products_count ?? 0}</td></>}
                    />
                    {/*

                        {paginatedSubCategories.map((subCategory) => (
                            <div
                                key={subCategory.id}
                                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-5 p-5 transition-colors hover:bg-zinc-50/30"
                            >

                                <div className="flex items-start gap-4">

                                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                                        <Tags size={18} />
                                    </div>

                                    <div>

                                        <div className="flex flex-wrap items-center gap-2">

                                            <h3 className="text-sm font-semibold text-zinc-950">
                                                {subCategory.name}
                                            </h3>

                                            <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold uppercase text-indigo-600">
                                                {getCategoryName(subCategory)}
                                            </span>

                                        </div>

                                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-400">

                                            <span>
                                                {subCategory.products_count ?? 0} Product
                                                {subCategory.products_count === 1
                                                    ? ""
                                                    : "s"}
                                            </span>

                                        </div>

                                    </div>

                                </div>

                                <div className="flex shrink-0 items-center gap-2 lg:pl-4">

                                    <button
                                        onClick={() => openEditForm(subCategory)}
                                        className="flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-2 text-xs font-semibold text-zinc-600 transition-colors hover:border-indigo-300 hover:text-indigo-600"
                                    >
                                        <Pencil size={13} />
                                        Edit
                                    </button>

                                    <button
                                        onClick={() => requestDelete(subCategory)}
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
                filteredSubCategories.length > 0 &&
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
                            Delete this sub category?
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

export default SubCategories;