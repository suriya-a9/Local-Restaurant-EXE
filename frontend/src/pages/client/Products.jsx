import React, { useEffect, useState } from "react";
import {
    Package,
    Plus,
    X,
    Check,
    Search,
} from "lucide-react";
import { useAuth } from "../../context/authContext";
import Pagination from "../../components/Pagination";
import EntityTable from "../../components/EntityTable";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const emptyForm = {
    name: "",
    sku: "",
    barcode: "",
    shortcut_number: "",
    image: "",
    unit_id: "",
    category_id: "",
    sub_category_id: "",
    applicable_tax_id: "",
    product_type: "single",
    selling_price_tax_type: "exclusive",
    enable_stock: false,
    alert_quantity: "",
    margin_percent: 0,
    default_selling_price_exc_tax: "",
    default_selling_price_inc_tax: "",
    business_location_ids: [],
};

const Products = () => {
    const { token, clientId, role, businessLocationId } = useAuth();
    const isElectron = Boolean(window.electronAPI);

    const [products, setProducts] = useState([]);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [error, setError] = useState(null);
    const [formErrors, setFormErrors] = useState({});

    const [showForm, setShowForm] = useState(false);

    const [form, setForm] = useState(emptyForm);
    const [taxRates, setTaxRates] = useState([]);
    const [loadingTaxRates, setLoadingTaxRates] = useState(true);
    const [showNewTaxRateForm, setShowNewTaxRateForm] = useState(false);
    const [newTaxRate, setNewTaxRate] = useState({ name: "", rate_percent: "", tax_type: "gst" });
    const [savingTaxRate, setSavingTaxRate] = useState(false);
    const [taxRateError, setTaxRateError] = useState(null);

    const [search, setSearch] = useState("");
    const [units, setUnits] = useState([]);
    const [categories, setCategories] = useState([]);
    const [subCategories, setSubCategories] = useState([]);
    const [businessLocations, setBusinessLocations] = useState([]);
    const [editingProductId, setEditingProductId] = useState(null);

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const restrictedLocationRoles = ["cashier", "manager", "waiter"];
    const normalizedRole = String(role || "").toLowerCase();
    const isLocationRestrictedRole = restrictedLocationRoles.includes(
        normalizedRole
    );
    const currentBusinessLocationId = businessLocationId == null
        ? ""
        : String(businessLocationId);
    const visibleBusinessLocations =
        isLocationRestrictedRole && currentBusinessLocationId
            ? businessLocations.filter(
                (location) => String(location.id) === currentBusinessLocationId
            )
            : businessLocations;

    useEffect(() => {
        if (isElectron && !clientId) return;
        loadProducts();
        loadFormOptions();
        loadTaxRates();
    }, [clientId]);

    useEffect(() => {
        const rate = getSelectedTaxRatePercent();

        if (form.selling_price_tax_type === "exclusive") {
            if (form.default_selling_price_exc_tax !== "") {
                const inc = (
                    Number(form.default_selling_price_exc_tax) *
                    (1 + rate / 100)
                ).toFixed(2);

                setForm((prev) => ({
                    ...prev,
                    default_selling_price_inc_tax: inc,
                }));
            }
        } else {
            if (form.default_selling_price_inc_tax !== "") {
                const exc = (
                    Number(form.default_selling_price_inc_tax) /
                    (1 + rate / 100)
                ).toFixed(2);

                setForm((prev) => ({
                    ...prev,
                    default_selling_price_exc_tax: exc,
                }));
            }
        }
    }, [form.applicable_tax_id, form.selling_price_tax_type, taxRates]);

    function getSelectedTaxRatePercent() {
        const tax = taxRates.find(
            (t) => String(t.id) === String(form.applicable_tax_id)
        );
        return tax ? Number(tax.rate_percent) : 0;
    }

    function handleExcTaxPriceChange(e) {
        const value = e.target.value;
        const rate = getSelectedTaxRatePercent();
        const incValue =
            value === "" ? "" : (Number(value) * (1 + rate / 100)).toFixed(2);

        setForm((prev) => ({
            ...prev,
            default_selling_price_exc_tax: value,
            default_selling_price_inc_tax: incValue,
        }));
        setFormErrors((prev) => ({
            ...prev,
            default_selling_price_exc_tax: "",
            default_selling_price_inc_tax: "",
        }));
    }

    function handleIncTaxPriceChange(e) {
        const value = e.target.value;
        const rate = getSelectedTaxRatePercent();
        const excValue =
            value === "" ? "" : (Number(value) / (1 + rate / 100)).toFixed(2);

        setForm((prev) => ({
            ...prev,
            default_selling_price_inc_tax: value,
            default_selling_price_exc_tax: excValue,
        }));
        setFormErrors((prev) => ({
            ...prev,
            default_selling_price_inc_tax: "",
            default_selling_price_exc_tax: "",
        }));
    }

    async function loadTaxRates() {
        setLoadingTaxRates(true);
        try {
            if (isElectron) { const data = await window.electronAPI.taxRates.getAll(clientId); setTaxRates(Array.isArray(data) ? data : []); return; }
            const res = await fetch(`${API_BASE_URL}/api/tax-rates${clientId ? `?client_id=${clientId}` : ""}`, { headers: { Accept: "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
            const json = await res.json(); if (!res.ok || !json.success) throw new Error(json.message || "Failed to load tax rates"); const data = json.data;
            setTaxRates(Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : []);
        } catch (err) { console.error("Load tax rates error:", err); setTaxRates([]) } finally { setLoadingTaxRates(false) }
    }

    async function createTaxRate() {
        setSavingTaxRate(true); setTaxRateError(null);
        try {
            let created;
            const payload = { client_id: clientId, id: crypto.randomUUID(), name: newTaxRate.name.trim(), rate_percent: Number(newTaxRate.rate_percent), tax_type: newTaxRate.tax_type.trim(), is_active: true };
            if (isElectron) { created = await window.electronAPI.taxRates.create(payload) } else {
                const res = await fetch(`${API_BASE_URL}/api/tax-rates`, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(payload) });
                const json = await res.json(); if (!res.ok || !json.success) throw new Error(json.message || "Failed to create tax rate"); created = json.data?.data ?? json.data;
            }
            setTaxRates((prev) => [...prev, created]); setForm((prev) => ({ ...prev, applicable_tax_id: created.id })); setNewTaxRate({ name: "", rate_percent: "", tax_type: "gst" }); setShowNewTaxRateForm(false);
        } catch (err) { console.error("Create tax rate error:", err); setTaxRateError(err.message) } finally { setSavingTaxRate(false) }
    }

    async function loadFormOptions() {
        try {
            if (isElectron) {
                const [u, c, s, b] = await Promise.all([window.electronAPI.units.getAll(clientId), window.electronAPI.categories.getAll(clientId), window.electronAPI.subCategories.getAll(clientId), window.electronAPI.businessLocations.getAll(clientId)]);
                setUnits(Array.isArray(u) ? u : []); setCategories(Array.isArray(c) ? c : []); setSubCategories(Array.isArray(s) ? s : []); setBusinessLocations(Array.isArray(b) ? b : []); return;
            }
            const headers = { Accept: "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };
            const [ur, cr, sr, br] = await Promise.all([fetch(`${API_BASE_URL}/api/client/units?client_id=${clientId}`, { headers }), fetch(`${API_BASE_URL}/api/client/categories?client_id=${clientId}`, { headers }), fetch(`${API_BASE_URL}/api/client/sub-categories?client_id=${clientId}`, { headers }), fetch(`${API_BASE_URL}/api/client/business-locations?client_id=${clientId}`, { headers })]);
            const [uj, cj, sj, bj] = await Promise.all([ur.json(), cr.json(), sr.json(), br.json()]);
            if (!ur.ok || !uj.success) throw new Error(uj.message || "Failed to load units"); if (!cr.ok || !cj.success) throw new Error(cj.message || "Failed to load categories"); if (!sr.ok || !sj.success) throw new Error(sj.message || "Failed to load sub categories"); if (!br.ok || !bj.success) throw new Error(bj.message || "Failed to load business locations");
            setUnits(Array.isArray(uj.data?.data) ? uj.data.data : Array.isArray(uj.data) ? uj.data : []); setCategories(Array.isArray(cj.data?.data) ? cj.data.data : Array.isArray(cj.data) ? cj.data : []); setSubCategories(Array.isArray(sj.data?.data) ? sj.data.data : Array.isArray(sj.data) ? sj.data : []); setBusinessLocations(Array.isArray(bj.data?.data) ? bj.data.data : Array.isArray(bj.data) ? bj.data : []);
        } catch (err) { console.error("Load product form options error:", err); setError(err.message) }
    }

    async function loadProducts() {
        setLoading(true); setError(null);
        try {
            let allProducts;
            if (isElectron) { allProducts = await window.electronAPI.products.getAll(clientId, isLocationRestrictedRole ? currentBusinessLocationId : null) } else {
                const res = await fetch(
                    `${API_BASE_URL}/api/products?client_id=${clientId}&per_page=1000`,
                    {
                        headers: {
                            Accept: "application/json",
                            ...(token ? { Authorization: `Bearer ${token}` } : {}),
                        },
                    }
                ); const json = await res.json(); if (!res.ok || !json.success) throw new Error(json.message || "Failed to load products"); const data = json.data; allProducts = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
            }
            const visible = isLocationRestrictedRole && currentBusinessLocationId ? allProducts.filter((product) => Array.isArray(product.business_locations) && product.business_locations.some((location) => String(location.id) === currentBusinessLocationId)) : allProducts;
            setProducts(visible);
        } catch (err) { console.error("Load products error:", err); setError(err.message); setProducts([]) } finally { setLoading(false) }
    }

    function openCreateForm() {
        const defaultLocationIds =
            isLocationRestrictedRole && currentBusinessLocationId
                ? [currentBusinessLocationId]
                : [];

        setForm({
            ...emptyForm,
            business_location_ids: defaultLocationIds,
        });
        setEditingProductId(null);
        setFormErrors({});
        setError(null);
        setShowForm(true);
    }

    function openEditForm(product) {
        setForm({
            name: product.name ?? "",
            sku: product.sku ?? "",
            barcode: product.barcode ?? "",
            shortcut_number: product.shortcut_number ?? "",
            image: "",
            unit_id: product.unit?.id ?? product.unit_id ?? "",
            category_id: product.category?.id ?? product.category_id ?? "",
            sub_category_id: product.sub_category?.id ?? product.sub_category_id ?? "",
            applicable_tax_id: product.applicable_tax_id ?? "",
            product_type: product.product_type ?? "single",
            selling_price_tax_type: product.selling_price_tax_type ?? "exclusive",
            enable_stock: Boolean(product.enable_stock),
            alert_quantity: product.alert_quantity ?? "",
            default_purchase_price_exc_tax: product.default_purchase_price_exc_tax ?? "",
            default_purchase_price_inc_tax: product.default_purchase_price_inc_tax ?? "",
            margin_percent: product.margin_percent ?? 0,
            default_selling_price_exc_tax: product.default_selling_price_exc_tax ?? "",
            default_selling_price_inc_tax: product.default_selling_price_inc_tax ?? "",
            business_location_ids: Array.isArray(product.business_locations)
                ? product.business_locations.map((location) => String(location.id))
                : [],
        });
        setEditingProductId(product.id);
        setFormErrors({});
        setError(null);
        setShowForm(true);
    }

    function closeForm() {
        if (saving) return;

        setShowForm(false);
        setForm(emptyForm);
        setFormErrors({});
        setEditingProductId(null);
    }

    function handleChange(e) {
        const { name, value, type, checked, files } = e.target;

        setForm((prev) => ({
            ...prev,
            [name]: type === "checkbox"
                ? checked
                : type === "file"
                    ? files?.[0] || null
                    : value,
        }));

        setFormErrors((prev) => ({
            ...prev,
            [name]: "",
        }));
    }


    async function fileToDataUrl(file) {
        if (!(file instanceof File)) return null;
        return await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(reader.error || new Error("Failed to read image"));
            reader.readAsDataURL(file);
        });
    }

    async function handleSubmit(e) {
        e.preventDefault(); setSaving(true); setError(null); setFormErrors({});
        const isEditing = Boolean(editingProductId);
        try {
            if (isElectron) {
                const imageData = form.image instanceof File ? await fileToDataUrl(form.image) : undefined;
                const payload = {
                    id: isEditing ? editingProductId : crypto.randomUUID(), client_id: clientId, name: form.name.trim(), sku: form.sku.trim(), barcode: form.barcode.trim() || null, shortcut_number: form.shortcut_number === "" ? null : Number(form.shortcut_number),
                    unit_id: form.unit_id || null, category_id: form.category_id || null, sub_category_id: form.sub_category_id || null, applicable_tax_id: form.applicable_tax_id || null,
                    product_type: form.product_type, selling_price_tax_type: form.selling_price_tax_type, enable_stock: Boolean(form.enable_stock), alert_quantity: form.alert_quantity === "" ? null : Number(form.alert_quantity),
                    default_purchase_price_exc_tax: Number(form.default_purchase_price_exc_tax || 0), default_purchase_price_inc_tax: Number(form.default_purchase_price_inc_tax || 0), margin_percent: Number(form.margin_percent || 0),
                    default_selling_price_exc_tax: Number(form.default_selling_price_exc_tax || 0), default_selling_price_inc_tax: Number(form.default_selling_price_inc_tax || 0), business_location_ids: form.business_location_ids.map(String),
                };
                if (imageData !== undefined) payload.image = imageData;
                if (isEditing) await window.electronAPI.products.update(payload); else await window.electronAPI.products.create(payload);
                closeForm(); setCurrentPage(1); await loadProducts(); return;
            }
            const formData = new FormData(); formData.append("client_id", clientId); formData.append("name", form.name.trim()); formData.append("sku", form.sku.trim()); formData.append("barcode", form.barcode.trim() || ""); if (form.image instanceof File) formData.append("image", form.image); formData.append("unit_id", String(form.unit_id || "")); formData.append("category_id", String(form.category_id || "")); formData.append("sub_category_id", String(form.sub_category_id || "")); formData.append("applicable_tax_id", form.applicable_tax_id === "" ? "" : String(form.applicable_tax_id)); formData.append("product_type", form.product_type); formData.append("selling_price_tax_type", form.selling_price_tax_type); formData.append("enable_stock", form.enable_stock ? "1" : "0"); formData.append("alert_quantity", form.alert_quantity === "" ? "" : String(Number(form.alert_quantity))); formData.append("default_purchase_price_exc_tax", String(Number(form.default_purchase_price_exc_tax))); formData.append("default_purchase_price_inc_tax", String(Number(form.default_purchase_price_inc_tax))); formData.append("margin_percent", String(Number(form.margin_percent))); formData.append("default_selling_price_exc_tax", String(Number(form.default_selling_price_exc_tax))); formData.append("default_selling_price_inc_tax", String(Number(form.default_selling_price_inc_tax))); formData.append("shortcut_number", form.shortcut_number === "" ? "" : String(Number(form.shortcut_number))); form.business_location_ids.forEach((id) => formData.append("business_location_ids[]", String(id))); if (isEditing) formData.append("_method", "PUT");
            const url = isEditing ? `${API_BASE_URL}/api/products/${editingProductId}?client_id=${clientId}` : `${API_BASE_URL}/api/products?client_id=${clientId}`; const res = await fetch(url, { method: "POST", headers: { Accept: "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: formData }); const json = await res.json(); if (!res.ok || !json.success) { if (json.errors) setFormErrors(json.errors); throw new Error(json.message || `Failed to ${isEditing ? "update" : "create"} product`) } closeForm(); setCurrentPage(1); await loadProducts();
        } catch (err) { console.error("Save product error:", err); setError(err.message) } finally { setSaving(false) }
    }

    function handleSearchChange(e) {
        setSearch(e.target.value);
        setCurrentPage(1);
    }

    const filteredProducts = products.filter((product) => {
        const query = search.trim().toLowerCase();

        if (!query) return true;

        const productName = String(product.name || "").toLowerCase();
        const productSku = String(product.sku || "").toLowerCase();

        return (
            productName.includes(query) ||
            productSku.includes(query)
        );
    });

    const totalPages = Math.ceil(
        filteredProducts.length / itemsPerPage
    );

    const startIndex =
        (currentPage - 1) * itemsPerPage;

    const paginatedProducts = filteredProducts.slice(
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

    return (
        <div className="min-h-screen bg-white text-zinc-800 antialiased p-6 md:p-8 lg:p-5">

            <div className="flex flex-col gap-6 border-b border-zinc-100 pb-6 md:flex-row md:items-center md:justify-between">

                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight text-indigo-950 sm:text-4xl">
                        Products
                    </h1>

                    <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                        {filteredProducts.length} Product
                        {filteredProducts.length === 1 ? "" : "s"}
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

                    New Product
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
                                {editingProductId ? "Edit Product" : "New Product"}
                            </h2>

                            <p className="mt-1 text-xs text-zinc-400">
                                {editingProductId ? "Update this product." : "Create a new product."}
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

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">

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
                                placeholder="Mutton Sukka"
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
                                Barcode
                            </label>

                            <input
                                type="text"
                                name="barcode"
                                value={form.barcode}
                                onChange={handleChange}
                                placeholder="Optional"
                                className={inputClass("barcode")}
                            />
                        </div>

                        <div>
                            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                                Shortcut Number
                            </label>
                            <input
                                type="number"
                                min="1"
                                step="1"
                                name="shortcut_number"
                                value={form.shortcut_number}
                                onChange={handleChange}
                                placeholder="Optional"
                                className={inputClass("shortcut_number")}
                            />
                        </div>

                        <div>
                            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                                Image
                            </label>

                            <input
                                type="file"
                                name="image"
                                accept="image/*"
                                onChange={handleChange}
                                className={inputClass("image")}
                            />

                            {form.image && (
                                <p className="mt-1 text-xs text-zinc-500">
                                    Selected: {form.image.name}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                                Unit
                            </label>

                            <select
                                name="unit_id"
                                value={form.unit_id}
                                onChange={handleChange}
                                className={inputClass("unit_id")}
                                required
                            >
                                <option value="">Select Unit</option>

                                {units.map((unit) => (
                                    <option key={unit.id} value={unit.id}>
                                        {unit.name}
                                    </option>
                                ))}
                            </select>

                            {getFormError("unit_id") && (
                                <p className="mt-1 text-xs text-rose-500">
                                    {getFormError("unit_id")}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                                Category
                            </label>

                            <select
                                name="category_id"
                                value={form.category_id}
                                onChange={handleChange}
                                className={inputClass("category_id")}
                                required
                            >
                                <option value="">Select Category</option>

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
                                Sub Category
                            </label>

                            <select
                                name="sub_category_id"
                                value={form.sub_category_id}
                                onChange={handleChange}
                                className={inputClass("sub_category_id")}
                            >
                                <option value="">
                                    Select Sub Category (Optional)
                                </option>

                                {subCategories.map((subCategory) => (
                                    <option
                                        key={subCategory.id}
                                        value={subCategory.id}
                                    >
                                        {subCategory.name}
                                    </option>
                                ))}
                            </select>

                            {getFormError("sub_category_id") && (
                                <p className="mt-1 text-xs text-rose-500">
                                    {getFormError("sub_category_id")}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                                Applicable Tax
                            </label>

                            {!showNewTaxRateForm ? (
                                <>
                                    <select
                                        name="applicable_tax_id"
                                        value={form.applicable_tax_id}
                                        onChange={handleChange}
                                        disabled={loadingTaxRates}
                                        className={inputClass("applicable_tax_id")}
                                    >
                                        <option value="">
                                            {loadingTaxRates ? "Loading tax rates..." : "No Tax"}
                                        </option>
                                        {taxRates.map((tax) => (
                                            <option key={tax.id} value={tax.id}>
                                                {tax.name} ({tax.rate_percent}%)
                                            </option>
                                        ))}
                                    </select>

                                    {getFormError("applicable_tax_id") && (
                                        <p className="mt-1 text-xs text-rose-500">
                                            {getFormError("applicable_tax_id")}
                                        </p>
                                    )}

                                    {!loadingTaxRates && taxRates.length === 0 && (
                                        <p className="mt-1 text-xs text-zinc-400">
                                            No tax rates set up yet.
                                        </p>
                                    )}

                                    <button
                                        type="button"
                                        onClick={() => setShowNewTaxRateForm(true)}
                                        className="mt-1.5 text-xs font-semibold text-indigo-600 hover:underline"
                                    >
                                        + Add new tax rate
                                    </button>
                                </>
                            ) : (
                                <div className="mt-1.5 space-y-2 rounded-xl border border-zinc-200/80 bg-white p-3">
                                    {taxRateError && (
                                        <p className="text-xs font-medium text-rose-500">{taxRateError}</p>
                                    )}

                                    <input
                                        type="text"
                                        placeholder="Name e.g. GST 5%"
                                        value={newTaxRate.name}
                                        onChange={(e) =>
                                            setNewTaxRate((prev) => ({ ...prev, name: e.target.value }))
                                        }
                                        className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-xs font-medium outline-none focus:border-indigo-500"
                                    />

                                    <div className="flex gap-2">
                                        <input
                                            type="number"
                                            step="0.01"
                                            placeholder="Rate %"
                                            value={newTaxRate.rate_percent}
                                            onChange={(e) =>
                                                setNewTaxRate((prev) => ({ ...prev, rate_percent: e.target.value }))
                                            }
                                            className="w-1/2 rounded-lg border border-zinc-200 px-3 py-2 text-xs font-medium outline-none focus:border-indigo-500"
                                        />

                                        <input
                                            type="text"
                                            placeholder="Tax type e.g. gst"
                                            value={newTaxRate.tax_type}
                                            onChange={(e) =>
                                                setNewTaxRate((prev) => ({ ...prev, tax_type: e.target.value }))
                                            }
                                            className="w-1/2 rounded-lg border border-zinc-200 px-3 py-2 text-xs font-medium outline-none focus:border-indigo-500"
                                        />
                                    </div>

                                    <div className="flex gap-2 pt-1">
                                        <button
                                            type="button"
                                            disabled={
                                                savingTaxRate || !newTaxRate.name.trim() || !newTaxRate.rate_percent
                                            }
                                            onClick={createTaxRate}
                                            className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                                        >
                                            {savingTaxRate ? "Saving..." : "Save Tax Rate"}
                                        </button>

                                        <button
                                            type="button"
                                            disabled={savingTaxRate}
                                            onClick={() => {
                                                setShowNewTaxRateForm(false);
                                                setTaxRateError(null);
                                            }}
                                            className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-600 hover:bg-zinc-50"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                                Selling Price Tax Type
                            </label>

                            <select
                                name="selling_price_tax_type"
                                value={form.selling_price_tax_type}
                                onChange={handleChange}
                                className={inputClass(
                                    "selling_price_tax_type"
                                )}
                            >
                                <option value="exclusive">
                                    Exclusive
                                </option>

                                <option value="inclusive">
                                    Inclusive
                                </option>
                            </select>
                        </div>

                        <div>
                            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                                Alert Quantity
                            </label>

                            <input
                                type="number"
                                name="alert_quantity"
                                value={form.alert_quantity}
                                onChange={handleChange}
                                placeholder="Optional"
                                className={inputClass(
                                    "alert_quantity"
                                )}
                            />
                        </div>

                        <div>
                            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                                Margin %
                            </label>

                            <input
                                type="number"
                                step="0.01"
                                name="margin_percent"
                                value={form.margin_percent}
                                onChange={handleChange}
                                className={inputClass(
                                    "margin_percent"
                                )}
                            />
                        </div>

                        <div>
                            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                                Selling Price Excl. Tax
                            </label>

                            <input
                                type="number"
                                step="0.01"
                                name="default_selling_price_exc_tax"
                                required
                                value={form.default_selling_price_exc_tax}
                                onChange={handleExcTaxPriceChange}
                                readOnly={form.selling_price_tax_type === "inclusive"}
                                placeholder="180.00"
                                className={`${inputClass("default_selling_price_exc_tax")} ${form.selling_price_tax_type === "inclusive"
                                    ? "bg-zinc-50 text-zinc-500"
                                    : ""
                                    }`}
                            />

                            {getFormError("default_selling_price_exc_tax") && (
                                <p className="mt-1 text-xs text-rose-500">
                                    {getFormError("default_selling_price_exc_tax")}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                                Selling Price Incl. Tax
                            </label>

                            <input
                                type="number"
                                step="0.01"
                                name="default_selling_price_inc_tax"
                                required
                                value={form.default_selling_price_inc_tax}
                                onChange={handleIncTaxPriceChange}
                                readOnly={form.selling_price_tax_type === "exclusive"}
                                placeholder="180.00"
                                className={`${inputClass("default_selling_price_inc_tax")} ${form.selling_price_tax_type === "exclusive"
                                    ? "bg-zinc-50 text-zinc-500"
                                    : ""
                                    }`}
                            />

                            {getFormError("default_selling_price_inc_tax") && (
                                <p className="mt-1 text-xs text-rose-500">
                                    {getFormError("default_selling_price_inc_tax")}
                                </p>
                            )}
                        </div>

                        <div className="md:col-span-2 lg:col-span-3">
                            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                                Business Locations
                            </label>

                            <div className="mt-1.5 rounded-xl border border-zinc-200/80 bg-white p-4">
                                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                    {visibleBusinessLocations.map((location) => {
                                        const locationId = String(location.id);

                                        const selected = form.business_location_ids.includes(
                                            locationId
                                        );

                                        return (
                                            <label
                                                key={location.id}
                                                className={`flex cursor-pointer items-center gap-3 rounded-lg p-3 transition-colors ${selected
                                                    ? "bg-indigo-50"
                                                    : "hover:bg-zinc-50"
                                                    }`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={selected}
                                                    disabled={
                                                        isLocationRestrictedRole &&
                                                        locationId !== currentBusinessLocationId
                                                    }
                                                    onChange={(e) => {
                                                        setForm((prev) => {
                                                            const currentIds =
                                                                Array.isArray(
                                                                    prev.business_location_ids
                                                                )
                                                                    ? prev.business_location_ids
                                                                    : [];

                                                            if (e.target.checked) {
                                                                // Prevent duplicate IDs
                                                                if (currentIds.includes(locationId)) {
                                                                    return prev;
                                                                }

                                                                return {
                                                                    ...prev,
                                                                    business_location_ids: [
                                                                        ...currentIds,
                                                                        locationId,
                                                                    ],
                                                                };
                                                            }

                                                            return {
                                                                ...prev,
                                                                business_location_ids:
                                                                    currentIds.filter(
                                                                        (id) => id !== locationId
                                                                    ),
                                                            };
                                                        });
                                                    }}
                                                    className="h-4 w-4 accent-indigo-600"
                                                />

                                                <div className="flex flex-col">
                                                    <span className="text-sm font-semibold text-zinc-700">
                                                        {location.name}
                                                    </span>

                                                    {location.code && (
                                                        <span className="text-xs text-zinc-400">
                                                            {location.code}
                                                        </span>
                                                    )}
                                                </div>
                                            </label>
                                        );
                                    })}
                                </div>

                                {form.business_location_ids.length > 0 && (
                                    <div className="mt-3 border-t border-zinc-100 pt-3">
                                        <span className="text-xs font-semibold text-indigo-600">
                                            {form.business_location_ids.length} location
                                            {form.business_location_ids.length !== 1 ? "s" : ""} selected
                                        </span>
                                    </div>
                                )}
                            </div>

                            {getFormError("business_location_ids") && (
                                <p className="mt-1 text-xs text-rose-500">
                                    {getFormError("business_location_ids")}
                                </p>
                            )}
                        </div>

                        <div className="flex items-center gap-3 rounded-xl border border-zinc-200/80 bg-white px-4 py-3">

                            <input
                                type="checkbox"
                                name="enable_stock"
                                checked={form.enable_stock}
                                onChange={handleChange}
                                className="h-4 w-4 accent-indigo-600"
                            />

                            <div>
                                <p className="text-sm font-semibold text-zinc-800">
                                    Enable Stock
                                </p>

                                <p className="text-xs text-zinc-400">
                                    Track stock for this product
                                </p>
                            </div>

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
                                ? (editingProductId ? "Updating..." : "Creating...")
                                : (editingProductId ? "Update Product" : "Create Product")}
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
                        onChange={handleSearchChange}
                        placeholder="Search by product name or SKU..."
                        className="w-full rounded-xl border border-zinc-200 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-indigo-500"
                    />
                </div>
            </div>

            <div className="mt-6 overflow-hidden rounded-2xl border border-zinc-200/60 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.02)]">

                {loading ? (
                    <p className="p-6 text-sm font-medium text-zinc-400">
                        Loading products...
                    </p>
                ) : products.length === 0 ? (
                    <div className="p-10 text-center">

                        <Package
                            className="mx-auto text-zinc-300"
                            size={30}
                        />

                        <p className="mt-3 text-sm font-medium text-zinc-400">
                            {search
                                ? "No products found."
                                : "No products yet."}
                        </p>

                    </div>
                ) : (<>
                    <EntityTable
                        columns={[{ key: "name", label: "Product" }, { key: "shortcut", label: "Shortcut" }, { key: "sku", label: "SKU" }, { key: "category", label: "Category" }, { key: "price", label: "Selling Price" }]}
                        rows={paginatedProducts}
                        onEdit={openEditForm}
                        renderCells={(product) => <><td className="px-5 py-4"><div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600"><Package size={16} /></div><span className="text-sm font-bold text-zinc-900">{product.name}</span></div></td><td className="px-5 py-4 text-sm font-semibold text-zinc-600">{product.shortcut_number || "-"}</td><td className="px-5 py-4 text-sm text-zinc-600">{product.sku || "-"}</td><td className="px-5 py-4 text-sm text-zinc-600">{product.category?.name || "-"}</td><td className="px-5 py-4 text-sm font-bold text-zinc-900">₹{product.default_selling_price_inc_tax ?? product.default_selling_price_exc_tax ?? "0.00"}</td></>}
                    />
                    {/*

                        {paginatedProducts.map((product) => (
                            <div
                                key={product.id}
                                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-5 p-5 transition-colors hover:bg-zinc-50/30"
                            >

                                <div className="flex items-start gap-4">

                                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                                        <Package size={18} />
                                    </div>

                                    <div>

                                        <h3 className="text-sm font-semibold text-zinc-950">
                                            {product.name}
                                        </h3>

                                        <div className="mt-1 flex flex-wrap gap-3 text-xs text-zinc-400">

                                            {product.sku && (
                                                <span>
                                                    SKU: {product.sku}
                                                </span>
                                            )}

                                            {product.category?.name && (
                                                <span>
                                                    Category:{" "}
                                                    {product.category.name}
                                                </span>
                                            )}

                                            {product.sub_category?.name && (
                                                <span>
                                                    Sub Category:{" "}
                                                    {product.sub_category.name}
                                                </span>
                                            )}

                                            {product.business_locations?.length > 0 && (
                                                <span>
                                                    Branch:{" "}
                                                    {product.business_locations
                                                        .map((location) => location.name)
                                                        .join(", ")}
                                                </span>
                                            )}

                                        </div>

                                    </div>

                                </div>

                                <div className="flex flex-wrap items-center gap-5 lg:justify-end">

                                    <div>
                                        <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                                            Selling Price
                                        </p>

                                        <p className="mt-1 text-sm font-bold text-zinc-900">
                                            ₹
                                            {
                                                product.default_selling_price_inc_tax ??
                                                product.default_selling_price_exc_tax ??
                                                "0.00"
                                            }
                                        </p>
                                    </div>

                                    {/* <div>
                                        <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                                            Purchase Price
                                        </p>

                                        <p className="mt-1 text-sm font-semibold text-zinc-700">
                                            ₹
                                            {
                                                product.default_purchase_price_inc_tax ??
                                                product.default_purchase_price_exc_tax ??
                                                "0.00"
                                            }
                                        </p>
                                    </div> * /}

                                    <button
                                        type="button"
                                        onClick={() => openEditForm(product)}
                                        className="rounded-lg border border-zinc-200 px-3 py-2 text-xs font-semibold text-zinc-600 transition-colors hover:border-indigo-300 hover:text-indigo-600"
                                    >
                                        Edit
                                    </button>


                                </div>

                            </div>
                        ))}

                    </div>*/}</>)}
            </div>

            {!loading &&
                products.length > 0 &&
                totalPages > 1 && (
                    <div className="mt-6">
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={handlePageChange}
                        />
                    </div>
                )}

        </div>
    );
};

export default Products;