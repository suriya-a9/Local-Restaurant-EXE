import React, { useEffect, useState } from "react";
import { Printer, Plus, Trash2, Check, Wifi } from "lucide-react";
import { useAuth } from "../../context/authContext";
import { getPrimaryLocationId } from "../../utils/primaryLocation";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const emptyStation = { id: null, category_id: "", printer_ip: "", printer_port: 9100 };

const emptyForm = {
    business_location_id: "",
    system_ip: "",
    billing_printer_ip: "",
    billing_printer_port: 9100,
    default_kot_ip: "",
    default_kot_port: 9100,
    has_extra_kot: "no",
    stations: [],
};

const KotPrinterSettings = () => {
    const { token, clientId, businessLocationId: authBusinessLocationId, loading: authLoading } = useAuth();
    const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

    const [locations, setLocations] = useState([]);
    const [loadingLocations, setLoadingLocations] = useState(true);

    const [categories, setCategories] = useState([]);
    const [settingsId, setSettingsId] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [formErrors, setFormErrors] = useState({});
    const [success, setSuccess] = useState(false);
    const [loadingSettings, setLoadingSettings] = useState(false);
    const [settingsExist, setSettingsExist] = useState(false);
    const [deletingStationId, setDeletingStationId] = useState(null);

    useEffect(() => {
        loadLocations();
        loadCategories();
    }, [clientId]);

    useEffect(() => {
        if (authBusinessLocationId) {
            setForm((prev) => ({
                ...prev,
                business_location_id: authBusinessLocationId,
            }));
        }
    }, [authBusinessLocationId]);

    useEffect(() => {
        if (form.business_location_id) {
            loadKotSettings(form.business_location_id);
        }
    }, [form.business_location_id]);

    async function loadLocations() {
        setLoadingLocations(true);
        try {
            if (window.electronAPI?.businessLocations) {
                const data = await window.electronAPI.businessLocations.getAll(clientId);
                const nextLocations = Array.isArray(data) ? data : [];
                setLocations(nextLocations);
                if (!authBusinessLocationId) setForm((prev) => ({ ...prev, business_location_id: getPrimaryLocationId(nextLocations) }));
                return;
            }
            const res = await fetch(`${API_BASE_URL}/api/client/business-locations?client_id=${clientId}`, { headers: { Accept: "application/json", ...authHeaders } });
            const json = await res.json();
            if (!res.ok || !json.success) throw new Error(json.message || "Failed to load business locations");
            const data = json.data; const nextLocations = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
            setLocations(nextLocations);
            if (!authBusinessLocationId) setForm((prev) => ({ ...prev, business_location_id: getPrimaryLocationId(nextLocations) }));
        } catch (err) { console.error("Load business locations error:", err); setLocations([]); }
        finally { setLoadingLocations(false); }
    }

    async function loadCategories() {
        try {
            if (window.electronAPI?.categories) {
                const data = await window.electronAPI.categories.getAll(clientId);
                setCategories(Array.isArray(data) ? data : []);
                return;
            }
            const res = await fetch(`${API_BASE_URL}/api/client/categories?client_id=${clientId}`, { headers: { Accept: "application/json", ...authHeaders } });
            const json = await res.json();
            if (!res.ok || !json.success) throw new Error(json.message || "Failed to load categories");
            const data = json.data; setCategories(Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : []);
        } catch (err) { console.error("Load categories error:", err); }
    }

    async function loadKotSettings(locationId) {
        setLoadingSettings(true); setError(null); setSuccess(false); setSettingsExist(false);
        try {
            let settings; let stations;
            if (window.electronAPI?.kotSettings) {
                const result = await window.electronAPI.kotSettings.getByLocation(clientId, locationId);
                settings = result?.settings; stations = result?.stations;
            } else {
                const res = await fetch(`${API_BASE_URL}/api/kot-printer-settings?business_location_id=${locationId}&client_id=${clientId}`, { headers: { Accept: "application/json", ...authHeaders } });
                if (res.status === 404) { setForm({ ...emptyForm, business_location_id: locationId }); setSettingsId(null); return; }
                const json = await res.json();
                if (!res.ok || !json.success) throw new Error(json.message || "Failed to load KOT printer settings");
                settings = json.data?.settings; stations = json.data?.stations;
            }
            if (!settings) { setForm({ ...emptyForm, business_location_id: locationId }); setSettingsId(null); return; }
            setForm({
                business_location_id: settings.business_location_id ?? locationId, system_ip: settings.system_ip ?? "",
                billing_printer_ip: settings.billing_printer_ip ?? "", billing_printer_port: settings.billing_printer_port ?? 9100,
                default_kot_ip: settings.default_kot_ip ?? "", default_kot_port: settings.default_kot_port ?? 9100,
                has_extra_kot: settings.has_extra_kot ?? "no",
                stations: Array.isArray(stations) ? stations.map((station) => ({ id: station.id ?? null, category_id: station.category_id ?? "", printer_ip: station.printer_ip ?? "", printer_port: station.printer_port ?? 9100 })) : [],
            });
            setSettingsId(settings.id ?? null); setSettingsExist(true);
        } catch (err) { console.error("Load KOT printer settings error:", err); setForm({ ...emptyForm, business_location_id: locationId }); }
        finally { setLoadingSettings(false); }
    }

    function handleChange(e) {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
        setFormErrors((prev) => ({ ...prev, [name]: "" }));
    }

    function handleExtraKotToggle(value) {
        setForm((prev) => ({
            ...prev,
            has_extra_kot: value,
            stations: value === "yes" ? prev.stations : [],
        }));
    }

    function addStation() {
        setForm((prev) => ({
            ...prev,
            stations: [...prev.stations, { ...emptyStation }],
        }));
    }

    function updateStation(index, field, value) {
        setForm((prev) => ({
            ...prev,
            stations: prev.stations.map((s, i) =>
                i === index ? { ...s, [field]: value } : s
            ),
        }));
    }

    async function removeStation(index) {
        const station = form.stations[index];
        if (!station.id) { setForm((prev) => ({ ...prev, stations: prev.stations.filter((_, i) => i !== index) })); return; }
        setDeletingStationId(station.id); setError(null);
        try {
            if (window.electronAPI?.kotSettings) {
                await window.electronAPI.kotSettings.deleteStation(station.id, clientId);
                setForm((prev) => ({ ...prev, stations: prev.stations.filter((_, i) => i !== index) }));
                return;
            }
            const res = await fetch(`${API_BASE_URL}/api/kot-printer-settings/station/${station.id}?client_id=${clientId}`, { method: "DELETE", headers: { Accept: "application/json", ...authHeaders } });
            const json = res.status !== 204 ? await res.json() : { success: true };
            if (!res.ok || !json.success) throw new Error(json.message || "Failed to delete KOT station");
            setForm((prev) => ({ ...prev, stations: prev.stations.filter((_, i) => i !== index) }));
        } catch (err) { console.error("Delete KOT station error:", err); setError(err.message); }
        finally { setDeletingStationId(null); }
    }

    function getFormError(field) {
        if (!formErrors[field]) return null;
        return Array.isArray(formErrors[field]) ? formErrors[field][0] : formErrors[field];
    }

    function inputClass(field) {
        return `mt-1.5 w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm font-medium text-zinc-900 outline-none focus:border-indigo-500 ${formErrors[field] ? "border-rose-400" : "border-zinc-200/80"
            }`;
    }

    async function handleSubmit(e) {
        e.preventDefault();

        setSaving(true);
        setError(null);
        setFormErrors({});
        setSuccess(false);

        try {
            if (window.electronAPI?.kotSettings) {
                const saved = await window.electronAPI.kotSettings.save({
                    client_id: clientId,
                    business_location_id: form.business_location_id,
                    system_ip: form.system_ip.trim(),
                    billing_printer_ip: form.billing_printer_ip.trim(),
                    billing_printer_port: Number(form.billing_printer_port),
                    default_kot_ip: form.default_kot_ip.trim(),
                    default_kot_port: Number(form.default_kot_port),
                    has_extra_kot: form.has_extra_kot,
                    stations: form.has_extra_kot === "yes" ? form.stations.map((station) => ({
                        id: station.id || null,
                        category_id: station.category_id || null,
                        printer_ip: station.printer_ip.trim(),
                        printer_port: Number(station.printer_port),
                    })) : [],
                });
                setSettingsId(saved?.settings?.id || null);
                setSettingsExist(Boolean(saved?.settings));
                setSuccess(true);
                await loadKotSettings(form.business_location_id);
                return;
            }

            if (settingsId) {
                const settingsPayload = {
                    client_id: clientId,
                    business_location_id: form.business_location_id,
                    system_ip: form.system_ip.trim(),
                    billing_printer_ip: form.billing_printer_ip.trim(),
                    billing_printer_port: Number(form.billing_printer_port),
                    default_kot_ip: form.default_kot_ip.trim(),
                    default_kot_port: Number(form.default_kot_port),
                    has_extra_kot: form.has_extra_kot,
                };

                const res = await fetch(`${API_BASE_URL}/api/kot-printer-settings/${settingsId}?client_id=${clientId}`, {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                        ...authHeaders,
                    },
                    body: JSON.stringify(settingsPayload),
                });
                const json = await res.json();
                if (!res.ok || !json.success) {
                    if (json.errors) setFormErrors(json.errors);
                    throw new Error(json.message || "Failed to update KOT printer settings");
                }
            } else {
                const createPayload = {
                    client_id: clientId,
                    business_location_id: form.business_location_id,
                    system_ip: form.system_ip.trim(),
                    billing_printer_ip: form.billing_printer_ip.trim(),
                    billing_printer_port: Number(form.billing_printer_port),
                    default_kot_ip: form.default_kot_ip.trim(),
                    default_kot_port: Number(form.default_kot_port),
                    has_extra_kot: form.has_extra_kot,
                    stations:
                        form.has_extra_kot === "yes"
                            ? form.stations.map((s) => ({
                                category_id: s.category_id,
                                printer_ip: s.printer_ip.trim(),
                                printer_port: Number(s.printer_port),
                            }))
                            : [],
                };

                const res = await fetch(`${API_BASE_URL}/api/kot-printer-settings?client_id=${clientId}`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                        ...authHeaders,
                    },
                    body: JSON.stringify(createPayload),
                });
                const json = await res.json();
                if (!res.ok || !json.success) {
                    if (json.errors) setFormErrors(json.errors);
                    throw new Error(json.message || "Failed to save KOT printer settings");
                }

                setSuccess(true);
                setSaving(false);
                await loadKotSettings(form.business_location_id);
                return;
            }

            if (form.has_extra_kot === "yes") {
                for (const station of form.stations) {
                    if (station.id) {
                        const res = await fetch(
                            `${API_BASE_URL}/api/kot-printer-settings/station/${station.id}?client_id=${clientId}`,
                            {
                                method: "PUT",
                                headers: {
                                    "Content-Type": "application/json",
                                    Accept: "application/json",
                                    ...authHeaders,
                                },
                                body: JSON.stringify({
                                    client_id: clientId,
                                    printer_ip: station.printer_ip.trim(),
                                    printer_port: Number(station.printer_port),
                                }),
                            }
                        );
                        const json = await res.json();
                        if (!res.ok || !json.success) {
                            throw new Error(json.message || "Failed to update a KOT station");
                        }
                    } else {
                        const res = await fetch(`${API_BASE_URL}/api/kot-printer-settings/station?client_id=${clientId}`, {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                Accept: "application/json",
                                ...authHeaders,
                            },
                            body: JSON.stringify({
                                client_id: clientId,
                                business_location_id: form.business_location_id,
                                category_id: station.category_id,
                                printer_ip: station.printer_ip.trim(),
                                printer_port: Number(station.printer_port),
                            }),
                        });
                        const json = await res.json();
                        if (!res.ok || !json.success) {
                            throw new Error(json.message || "Failed to create a KOT station");
                        }
                    }
                }
            }

            setSuccess(true);
        } catch (err) {
            console.error("Save KOT printer settings error:", err);
            setError(err.message);
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="min-h-screen bg-white text-zinc-800 antialiased p-6 md:p-8 lg:p-5">
            <div className="border-b border-zinc-100 pb-6">
                <h1 className="text-4xl font-extrabold tracking-tight text-indigo-950 sm:text-4xl">
                    KOT Printer Settings
                </h1>
                <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Network &amp; Station Configuration
                </p>
            </div>

            {error && (
                <div className="mt-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600">
                    {error}
                </div>
            )}

            {success && (
                <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                    KOT printer settings saved successfully.
                </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 max-w-3xl space-y-8">

                <div className="rounded-2xl border border-zinc-200/60 bg-zinc-50/30 p-6">
                    <h2 className="text-sm font-bold text-zinc-900">Business Location</h2>
                    <p className="mt-1 text-xs text-zinc-400">
                        Printer settings apply to a single business location.
                    </p>

                    <div className="mt-4 max-w-sm">
                        {authBusinessLocationId ? (
                            <>
                                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                                    Location
                                </label>
                                <p className="mt-1.5 rounded-xl border border-zinc-200/80 bg-zinc-100 px-3.5 py-2.5 text-sm font-medium text-zinc-700">
                                    {locations.find((l) => String(l.id) === String(authBusinessLocationId))?.name ??
                                        "Your location"}
                                </p>
                            </>
                        ) : (
                            <>
                                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                                    Location
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
                                        {loadingLocations ? "Loading locations..." : "Select a location"}
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
                            </>
                        )}

                        {loadingSettings ? (
                            <p className="mt-2 text-xs font-medium text-zinc-400">
                                Checking for existing settings...
                            </p>
                        ) : form.business_location_id && settingsExist ? (
                            <p className="mt-2 text-xs font-medium text-emerald-600">
                                Existing settings loaded for this location — editing will
                                update them.
                            </p>
                        ) : form.business_location_id ? (
                            <p className="mt-2 text-xs font-medium text-zinc-400">
                                No settings saved yet for this location.
                            </p>
                        ) : null}
                    </div>
                </div>

                <div className="rounded-2xl border border-zinc-200/60 bg-zinc-50/30 p-6">
                    <div className="flex items-center gap-2">
                        <Wifi size={16} className="text-indigo-600" />
                        <h2 className="text-sm font-bold text-zinc-900">Network Settings</h2>
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                                System IP
                            </label>
                            <input
                                type="text"
                                name="system_ip"
                                required
                                value={form.system_ip}
                                onChange={handleChange}
                                placeholder="192.168.0.9"
                                className={inputClass("system_ip")}
                            />
                            {getFormError("system_ip") && (
                                <p className="mt-1 text-xs text-rose-500">{getFormError("system_ip")}</p>
                            )}
                        </div>

                        <div />

                        <div>
                            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                                Billing Printer IP
                            </label>
                            <input
                                type="text"
                                name="billing_printer_ip"
                                required
                                value={form.billing_printer_ip}
                                onChange={handleChange}
                                placeholder="192.168.0.100"
                                className={inputClass("billing_printer_ip")}
                            />
                            {getFormError("billing_printer_ip") && (
                                <p className="mt-1 text-xs text-rose-500">
                                    {getFormError("billing_printer_ip")}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                                Billing Printer Port
                            </label>
                            <input
                                type="number"
                                name="billing_printer_port"
                                required
                                value={form.billing_printer_port}
                                onChange={handleChange}
                                placeholder="9100"
                                className={inputClass("billing_printer_port")}
                            />
                            {getFormError("billing_printer_port") && (
                                <p className="mt-1 text-xs text-rose-500">
                                    {getFormError("billing_printer_port")}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                                Default KOT Printer IP
                            </label>
                            <input
                                type="text"
                                name="default_kot_ip"
                                required
                                value={form.default_kot_ip}
                                onChange={handleChange}
                                placeholder="192.168.0.17"
                                className={inputClass("default_kot_ip")}
                            />
                            {getFormError("default_kot_ip") && (
                                <p className="mt-1 text-xs text-rose-500">
                                    {getFormError("default_kot_ip")}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                                Default KOT Printer Port
                            </label>
                            <input
                                type="number"
                                name="default_kot_port"
                                required
                                value={form.default_kot_port}
                                onChange={handleChange}
                                placeholder="9100"
                                className={inputClass("default_kot_port")}
                            />
                            {getFormError("default_kot_port") && (
                                <p className="mt-1 text-xs text-rose-500">
                                    {getFormError("default_kot_port")}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border border-zinc-200/60 bg-zinc-50/30 p-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Printer size={16} className="text-indigo-600" />
                            <h2 className="text-sm font-bold text-zinc-900">
                                Extra KOT Stations
                            </h2>
                        </div>

                        <div className="flex overflow-hidden rounded-full border border-zinc-200">
                            <button
                                type="button"
                                onClick={() => handleExtraKotToggle("no")}
                                className={`px-4 py-1.5 text-xs font-semibold transition-colors ${form.has_extra_kot === "no"
                                    ? "bg-indigo-600 text-white"
                                    : "bg-white text-zinc-500 hover:bg-zinc-50"
                                    }`}
                            >
                                No
                            </button>
                            <button
                                type="button"
                                onClick={() => handleExtraKotToggle("yes")}
                                className={`px-4 py-1.5 text-xs font-semibold transition-colors ${form.has_extra_kot === "yes"
                                    ? "bg-indigo-600 text-white"
                                    : "bg-white text-zinc-500 hover:bg-zinc-50"
                                    }`}
                            >
                                Yes
                            </button>
                        </div>
                    </div>

                    {form.has_extra_kot === "yes" && (
                        <div className="mt-4 space-y-3">
                            <p className="text-xs text-zinc-400">
                                Route specific categories to their own KOT printer — anything
                                not listed here falls back to the default KOT printer above.
                            </p>

                            {form.stations.length === 0 ? (
                                <p className="rounded-xl border border-dashed border-zinc-300 py-6 text-center text-xs font-medium text-zinc-400">
                                    No stations added yet.
                                </p>
                            ) : (
                                form.stations.map((station, idx) => (
                                    <div
                                        key={idx}
                                        className="grid grid-cols-1 gap-3 rounded-xl border border-zinc-200 bg-white p-3 sm:grid-cols-[1.2fr_1fr_0.7fr_auto] sm:items-center"
                                    >
                                        <select
                                            value={station.category_id}
                                            onChange={(e) =>
                                                updateStation(idx, "category_id", e.target.value)
                                            }
                                            required
                                            className="rounded-lg border border-zinc-200 px-3 py-2 text-xs font-medium outline-none focus:border-indigo-500"
                                        >
                                            <option value="" disabled>
                                                Select category
                                            </option>
                                            {categories.map((cat) => (
                                                <option key={cat.id} value={cat.id}>
                                                    {cat.name}
                                                </option>
                                            ))}
                                        </select>

                                        <input
                                            type="text"
                                            value={station.printer_ip}
                                            onChange={(e) =>
                                                updateStation(idx, "printer_ip", e.target.value)
                                            }
                                            placeholder="Printer IP"
                                            required
                                            className="rounded-lg border border-zinc-200 px-3 py-2 text-xs font-medium outline-none focus:border-indigo-500"
                                        />

                                        <input
                                            type="number"
                                            value={station.printer_port}
                                            onChange={(e) =>
                                                updateStation(idx, "printer_port", e.target.value)
                                            }
                                            placeholder="Port"
                                            required
                                            className="rounded-lg border border-zinc-200 px-3 py-2 text-xs font-medium outline-none focus:border-indigo-500"
                                        />

                                        <button
                                            type="button"
                                            onClick={() => removeStation(idx)}
                                            disabled={deletingStationId === station.id}
                                            className="flex items-center justify-center rounded-lg border border-rose-200 p-2 text-rose-600 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))
                            )}

                            <button
                                type="button"
                                onClick={addStation}
                                className="flex items-center gap-1.5 rounded-xl border border-dashed border-indigo-600/40 px-4 py-2 text-xs font-semibold text-indigo-600 hover:bg-indigo-50"
                            >
                                <Plus size={14} />
                                Add Station
                            </button>
                        </div>
                    )}
                </div>

                <div className="flex gap-3">
                    <button
                        type="submit"
                        disabled={saving}
                        className="group flex items-center gap-1.5 rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-700 hover:scale-[1.01] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
                    >
                        <Check size={14} />
                        {saving ? "Saving..." : "Save Settings"}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default KotPrinterSettings;