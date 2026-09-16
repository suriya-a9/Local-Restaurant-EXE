import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, MapPin, FileText, Sheet } from "lucide-react";
import { useAuth } from "../../context/authContext";
import Pagination from "../../components/Pagination";
import { getPrimaryLocationId } from "../../utils/primaryLocation";
import { downloadExcel, downloadPdf } from "../../utils/reportExports";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

function currency(n) {
    const value = Number(n) || 0;
    return `₹${value.toFixed(2)}`;
}

function formatDate(dateStr) {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return "-";
    return d.toLocaleString(undefined, {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function getPeriodBounds(type, from, to) {
    const now = new Date();
    const start = new Date(now);
    const end = new Date(now);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    if (type === "all") return [null, null];
    if (type === "yesterday") { start.setDate(start.getDate() - 1); end.setDate(end.getDate() - 1); }
    if (type === "week") { const day = (start.getDay() + 6) % 7; start.setDate(start.getDate() - day); }
    if (type === "month") start.setDate(1);
    if (type === "year") start.setMonth(0, 1);
    if (type === "custom") {
        if (!from || !to) return [null, null];
        return [new Date(`${from}T00:00:00`), new Date(`${to}T23:59:59.999`)];
    }
    return [start, end];
}

const Sales = () => {
    const { token, clientId, businessLocationId: authBusinessLocationId } = useAuth();
    const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

    const [locations, setLocations] = useState([]);
    const [loadingLocations, setLoadingLocations] = useState(false);
    const [selectedLocationId, setSelectedLocationId] = useState(null);
    const businessLocationId = authBusinessLocationId || selectedLocationId;

    const [salesList, setSalesList] = useState([]);
    const [loadingSales, setLoadingSales] = useState(false);
    const [salesError, setSalesError] = useState(null);
    const [selectedSale, setSelectedSale] = useState(null);
    const [selectedSaleLoading, setSelectedSaleLoading] = useState(false);
    const [cancellingId, setCancellingId] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [period, setPeriod] = useState("today");
    const [customFrom, setCustomFrom] = useState("");
    const [customTo, setCustomTo] = useState("");
    const itemsPerPage = 10;

    useEffect(() => {
        if (!authBusinessLocationId && clientId) {
            loadLocations();
        }
    }, [clientId]);

    useEffect(() => {
        if (businessLocationId) {
            setCurrentPage(1);
            loadSales();
        } else {
            setSalesList([]);
            setSelectedSale(null);
            setCurrentPage(1);
        }
    }, [businessLocationId]);

    useEffect(() => { setCurrentPage(1); }, [period, customFrom, customTo]);

    async function loadLocations() {
        setLoadingLocations(true);
        try {
            if (window.electronAPI?.businessLocations) {
                const data = await window.electronAPI.businessLocations.getAll(clientId);
                const nextLocations = Array.isArray(data) ? data : [];
                setLocations(nextLocations);
                if (!authBusinessLocationId) setSelectedLocationId(getPrimaryLocationId(nextLocations) || null);
                return;
            }
            const res = await fetch(`${API_BASE_URL}/api/client/business-locations?per_page=1000`, { headers: { Accept: "application/json", ...authHeaders } });
            const json = await res.json();
            if (!res.ok || !json.success) throw new Error(json.message || "Failed to load business locations");
            const data = json.data;
            const nextLocations = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
            setLocations(nextLocations);
            if (!authBusinessLocationId) setSelectedLocationId(getPrimaryLocationId(nextLocations) || null);
        } catch (err) { console.error("Load business locations error:", err); setLocations([]); }
        finally { setLoadingLocations(false); }
    }

    async function loadSales() {
        setLoadingSales(true); setSalesError(null);
        try {
            if (window.electronAPI?.sales) {
                const list = await window.electronAPI.sales.getAll(clientId, businessLocationId || null);
                setSalesList(Array.isArray(list) ? list : []);
                const totalPages = Math.max(Math.ceil((list?.length || 0) / itemsPerPage), 1);
                setCurrentPage((page) => Math.min(page, totalPages));
                if (selectedSale && !list.some((sale) => sale.id === selectedSale.id)) setSelectedSale(null);
                return;
            }
            const query = businessLocationId ? `?business_location_id=${encodeURIComponent(businessLocationId)}&per_page=1000` : "?per_page=1000";
            const res = await fetch(`${API_BASE_URL}/api/sales${query}`, { headers: { Accept: "application/json", ...authHeaders } });
            const json = await res.json();
            if (!res.ok || !json.success) throw new Error(json.message || "Failed to load sales");
            const data = json.data;
            const list = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
            setSalesList(list);
            const totalPages = Math.max(Math.ceil(list.length / itemsPerPage), 1);
            setCurrentPage((page) => Math.min(page, totalPages));
            if (selectedSale && !list.some((sale) => sale.id === selectedSale.id)) setSelectedSale(null);
        } catch (err) { console.error("Load sales error:", err); setSalesError(err.message); setSalesList([]); }
        finally { setLoadingSales(false); }
    }

    async function viewSale(id) {
        setSelectedSaleLoading(true);
        try {
            if (window.electronAPI?.sales) {
                const sale = await window.electronAPI.sales.getById(clientId, id, businessLocationId || null);
                if (!sale) throw new Error("Sale not found");
                setSelectedSale(sale);
                return;
            }
            const res = await fetch(`${API_BASE_URL}/api/sales/${id}`, { headers: { Accept: "application/json", ...authHeaders } });
            const json = await res.json();
            if (!res.ok || !json.success) throw new Error(json.message || "Failed to load sale details");
            setSelectedSale(json.data);
        } catch (err) { console.error("View sale error:", err); setSalesError(err.message); }
        finally { setSelectedSaleLoading(false); }
    }

    async function cancelSale(id) {
        setCancellingId(id);
        try {
            if (window.electronAPI?.sales) {
                await window.electronAPI.sales.cancel(clientId, id, businessLocationId || null);
                await loadSales();
                if (selectedSale?.id === id) setSelectedSale(null);
                return;
            }
            const res = await fetch(`${API_BASE_URL}/api/sales/${id}`, { method: "DELETE", headers: { Accept: "application/json", ...authHeaders } });
            if (!res.ok) { const json = await res.json().catch(() => ({})); throw new Error(json.message || "Failed to cancel sale"); }
            setSalesList((prev) => prev.filter((sale) => sale.id !== id));
            if (selectedSale?.id === id) setSelectedSale(null);
        } catch (err) { console.error("Cancel sale error:", err); setSalesError(err.message); }
        finally { setCancellingId(null); }
    }

    const filteredSales = useMemo(() => {
        const [start, end] = getPeriodBounds(period, customFrom, customTo);
        if (!start || !end) return salesList;
        return salesList.filter((sale) => {
            const date = new Date(sale.created_at);
            return date >= start && date <= end;
        });
    }, [salesList, period, customFrom, customTo]);

    const filteredTotal = filteredSales.reduce(
        (sum, sale) => sum + (sale.status === "cancelled" ? 0 : Number(sale.total_amount) || 0),
        0
    );
    const totalPages = Math.ceil(filteredSales.length / itemsPerPage);
    const paginatedSales = filteredSales.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    function exportRows() {
        return filteredSales.flatMap((sale) => {
            const items = Array.isArray(sale.items) && sale.items.length ? sale.items : [{ product_name: "-", quantity: "-", unit_price_inc_tax: "-", line_total: "-" }];
            return items.map((item) => [
                sale.invoice_number || sale.id, formatDate(sale.created_at), sale.customer_name || "Walk-In Customer",
                item.product_name || "-", item.quantity ?? "-", item.unit_price_inc_tax ?? "-", item.line_total ?? "-",
                (sale.payments || []).map((p) => p.payment_method).join(", ") || "-", sale.total_amount, sale.status || "completed"
            ]);
        });
    }

    function exportExcel() {
        downloadExcel(`sales-${period}`, ["Invoice", "Date", "Customer", "Product", "Qty", "Unit Price", "Line Total", "Payment", "Sale Total", "Status"], exportRows(), {
            title: "Sales Report", subtitle: `${filteredSales.length} sales • Total Rs.${filteredTotal.toFixed(2)}`, period
        });
    }

    function exportPdf() {
        downloadPdf(`sales-${period}`, "SALES REPORT", exportRows(), {
            headers: ["Invoice", "Date", "Customer", "Product", "Qty", "Unit Price", "Line Total", "Payment", "Sale Total", "Status"],
            summary: [`Period: ${period}`, `Sales: ${filteredSales.length}`, `Total: Rs.${filteredTotal.toFixed(2)}`]
        });
    }

    return (
        <div className="min-h-screen bg-zinc-50 p-4 md:p-6">
            {!authBusinessLocationId && (
                <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-2 text-amber-800">
                        <MapPin size={16} className="shrink-0" />
                        <div>
                            <p className="text-xs font-bold">Select a business location</p>
                            <p className="text-[11px] text-amber-700/80">
                                Choose a location to view sales for that outlet.
                            </p>
                        </div>
                    </div>

                    <select
                        value={selectedLocationId || ""}
                        onChange={(e) => setSelectedLocationId(e.target.value || null)}
                        disabled={loadingLocations}
                        className="rounded-xl border border-amber-300 bg-white px-3.5 py-2 text-sm font-semibold text-zinc-800 outline-none focus:border-[#40295C]"
                    >
                        <option value="" disabled>
                            {loadingLocations ? "Loading..." : "Select location"}
                        </option>
                        {locations.map((loc) => (
                            <option key={loc.id} value={loc.id}>{loc.name}</option>
                        ))}
                    </select>
                </div>
            )}

            {!businessLocationId ? (
                <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-sm font-medium text-zinc-500">
                    Select a business location to view sales.
                </div>
            ) : (
                <div className="max-w-6xl rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
                    <div className="border-b border-zinc-100 px-4 py-3">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                            <div>
                                <h1 className="text-lg font-bold text-zinc-900">Sales</h1>
                                <p className="mt-0.5 text-[11px] font-medium text-zinc-400">{filteredSales.length} sales · {currency(filteredTotal)}</p>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                <button onClick={exportPdf} disabled={!filteredSales.length} className="flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-40"><FileText size={14}/>PDF</button>
                                <button onClick={exportExcel} disabled={!filteredSales.length} className="flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-40"><Sheet size={14}/>Excel</button>
                            </div>
                        </div>
                        <div className="mt-3 flex flex-wrap items-center gap-1.5">
                            {[["all","All"],["today","Today"],["yesterday","Yesterday"],["week","This Week"],["month","This Month"],["year","This Year"],["custom","Custom Date"]].map(([key,label]) => (
                                <button key={key} onClick={() => setPeriod(key)} className={`rounded-lg px-3 py-1.5 text-[11px] font-semibold transition ${period === key ? "bg-[#40295C] text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"}`}>{label}</button>
                            ))}
                            {period === "custom" && (<>
                                <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} className="rounded-lg border border-zinc-200 px-2.5 py-1.5 text-[11px] outline-none focus:border-[#40295C]"/>
                                <span className="text-[11px] text-zinc-400">to</span>
                                <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} className="rounded-lg border border-zinc-200 px-2.5 py-1.5 text-[11px] outline-none focus:border-[#40295C]"/>
                            </>)}
                        </div>
                    </div>

                    <div className="flex min-h-[70vh] flex-col md:flex-row">
                        <div className="w-full border-b border-zinc-100 md:w-1/2 md:border-r md:border-b-0">
                            {loadingSales ? (
                                <p className="p-4 text-xs font-medium text-zinc-400">Loading sales...</p>
                            ) : salesError ? (
                                <p className="p-4 text-xs font-medium text-rose-600">{salesError}</p>
                            ) : filteredSales.length === 0 ? (
                                <p className="p-4 text-xs font-medium text-zinc-400">No sales found.</p>
                            ) : (
                                <div className="divide-y divide-zinc-100">
                                    {paginatedSales.map((sale, index) => (
                                        <button
                                            key={sale.id}
                                            onClick={() => viewSale(sale.id)}
                                            className={`flex w-full items-center justify-between p-3 text-left transition hover:bg-zinc-50 ${selectedSale?.id === sale.id ? "bg-zinc-50" : ""}`}
                                        >
                                            <div>
                                                <p className="text-xs font-bold text-zinc-900">
                                                    {`Sale #${filteredSales.length - ((currentPage - 1) * itemsPerPage + index)}`}
                                                </p>
                                                <p className="text-[11px] text-zinc-500">
                                                    {sale.customer_name || "Walk-In Customer"} · {sale.sale_type} · {sale.business_location_name || "-"}
                                                </p>
                                            </div>
                                            <ChevronRight size={14} className="text-zinc-300" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="w-full p-4 md:w-1/2">
                            {selectedSaleLoading ? (
                                <p className="text-xs font-medium text-zinc-400">Loading sale details...</p>
                            ) : !selectedSale ? (
                                <div className="flex h-full min-h-[280px] items-center justify-center text-center text-xs font-medium text-zinc-400">
                                    <div>
                                        <ChevronLeft className="mx-auto mb-2 text-zinc-300" size={20} />
                                        Select a sale to view details
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-sm font-bold text-zinc-900">
                                            Sale Details
                                        </p>
                                        <p className="mt-0.5 text-xs text-zinc-500">
                                            {formatDate(selectedSale.created_at)}
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-x-3 gap-y-2 rounded-xl border border-zinc-100 bg-zinc-50 p-3 text-xs">
                                        {/* <div className="col-span-2">
                                            <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
                                                Sale ID
                                            </p>
                                            <p className="break-all font-semibold text-zinc-800">
                                                {selectedSale.id}
                                            </p>
                                        </div> */}
                                        <div>
                                            <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
                                                Customer
                                            </p>
                                            <p className="font-semibold text-zinc-800">
                                                {selectedSale.customer_name || "Walk-In Customer"}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
                                                Sale Type
                                            </p>
                                            <p className="font-semibold capitalize text-zinc-800">
                                                {selectedSale.sale_type}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
                                                Business Location
                                            </p>
                                            <p className="font-semibold text-zinc-800">
                                                {selectedSale.business_location_name || "-"}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
                                                Payment
                                            </p>
                                            <p className="font-semibold capitalize text-zinc-800">
                                                {(selectedSale.payments || [])
                                                    .map((p) => p.payment_method)
                                                    .join(", ") || "-"}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="rounded-xl border border-zinc-100">
                                        <div className="divide-y divide-zinc-100">
                                            {(selectedSale.items || []).map((item, idx) => (
                                                <div
                                                    key={idx}
                                                    className="flex items-center justify-between p-2.5 text-xs"
                                                >
                                                    <span className="text-zinc-700">
                                                        <span className="font-semibold">{item.product_name || `Product #${item.product_id}`}</span>
                                                        <span> × {item.quantity}</span>
                                                        {item.selling_price_tax_type && (
                                                            <span className="ml-2 rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-semibold capitalize text-zinc-500">
                                                                {item.selling_price_tax_type}
                                                            </span>
                                                        )}
                                                    </span>
                                                    <span className="text-right font-semibold text-zinc-900">
                                                        <span className="block">{currency(Number(item.selling_price_tax_type === "inclusive" ? item.unit_price_inc_tax : item.default_selling_price_exc_tax ?? item.unit_price_inc_tax) * item.quantity)}</span>
                                                        <span className="block text-[10px] font-medium text-zinc-400">
                                                            {item.selling_price_tax_type === "inclusive" ? "Inclusive tax price" : "Exclusive tax price"}
                                                        </span>
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-1 text-xs">
                                        <div className="flex justify-between">
                                            <span className="text-zinc-500">Discount</span>
                                            <span>{currency(selectedSale.discount_amount)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-zinc-500">Tax</span>
                                            <span>{currency(selectedSale.order_tax_amount)}</span>
                                        </div>
                                        <div className="flex justify-between font-bold text-zinc-900">
                                            <span>Total</span>
                                            <span>{currency(selectedSale.total_amount)}</span>
                                        </div>
                                    </div>

                                    {/* <button
                                        onClick={() => cancelSale(selectedSale.id)}
                                        disabled={cancellingId === selectedSale.id}
                                        className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-rose-200 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-60"
                                    >
                                        <Trash2 size={13} />
                                        {cancellingId === selectedSale.id ? "Cancelling..." : "Cancel Sale"}
                                    </button> */}
                                </div>
                            )}
                        </div>
                    </div>

                    {!loadingSales && filteredSales.length > 0 && totalPages > 1 && (
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={setCurrentPage}
                        />
                    )}
                </div>
            )}
        </div>
    );
};

export default Sales;