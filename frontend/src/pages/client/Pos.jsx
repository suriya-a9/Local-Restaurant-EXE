import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
    MapPin, Calendar, FastForward, Columns, UserPlus, Printer,
    Calculator, RotateCcw, MoreVertical, Plus, Minus, User, UserCheck, Scan, Utensils, Package, Bike, ShoppingBag, Pause, Lock,
    FileText, Clock, Trash2, Edit2, ChevronRight, ChevronLeft,
    X,
} from "lucide-react";
import { useAuth } from "../../context/authContext";
import { getPrimaryLocationId } from "../../utils/primaryLocation";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const API_IMAGE_URL = import.meta.env.VITE_API_IMAGE_URL || "";

const SALE_TYPES = [
    { key: "dining", label: "Dining", icon: Utensils, color: null },
    { key: "parcel", label: "Parcel", icon: Package, color: null },
    { key: "zomato", label: "Zomato", icon: ShoppingBag, color: "text-red-500" },
    { key: "swiggy", label: "Swiggy", icon: ShoppingBag, color: "text-orange-500" },
    { key: "delivery", label: "Delivery", icon: Bike, color: "text-emerald-600" },
];

const SALE_TYPE_BADGE = {
    dining: "bg-indigo-50 text-indigo-600",
    parcel: "bg-amber-50 text-amber-700",
    zomato: "bg-red-50 text-red-600",
    swiggy: "bg-orange-50 text-orange-700",
    delivery: "bg-emerald-50 text-emerald-700",
};

const TABLE_STATUS_STYLES = {
    available: { bg: "bg-emerald-50/40 border-emerald-200", amount: "text-emerald-600" },
    reserved: { bg: "bg-amber-50/40 border-amber-200", amount: "text-amber-600" },
    occupied: { bg: "bg-sky-50/40 border-sky-200", amount: "text-sky-600" },
    kot_sent: {
        bg: "bg-purple-50/40 border-purple-200",
        amount: "text-indigo-600",
        badge: { label: "KOT Sent", style: "bg-indigo-100 text-indigo-600" },
    },
    bill_requested: {
        bg: "bg-rose-50/40 border-rose-200",
        amount: "text-rose-600",
        badge: { label: "Bill Requested", style: "bg-red-100 text-red-500" },
    },
};

const PAYMENT_BUTTONS = [
    { key: "credit", label: "Credit Sale", method: "credit", cls: "bg-indigo-600 hover:bg-indigo-700 text-white" },
    { key: "card", label: "Card", method: "card", cls: "bg-sky-500 hover:bg-sky-600 text-white" },
    { key: "multiple", label: "Multiple Pay", method: null, cls: "bg-slate-900 hover:bg-slate-800 text-white" },
    { key: "cash", label: "Cash", method: "cash", cls: "bg-emerald-500 hover:bg-emerald-600 text-white" },
    { key: "upi", label: "UPI / GPAY", method: "gpay", cls: "bg-pink-600 hover:bg-pink-700 text-white" },
];

const PAYMENT_METHOD_OPTIONS = [
    { key: "cash", label: "Cash" },
    { key: "card", label: "Card" },
    { key: "gpay", label: "GPay" },
    { key: "credit", label: "Credit" },
];

const emptyPayment = { payment_method: "cash", amount: "" };
const PRODUCT_DISPLAY_LIMIT = 12;
const emptyCustomer = { name: "", mobile_number: "", address: "" };
const CALCULATOR_BUTTONS = [
    ["sin", "cos", "tan", "log", "ln"],
    ["x2", "x3", "sqrt", "pi", "e"],
    ["AC", "backspace", "(", ")", "%"],
    ["7", "8", "9", "/", "*"],
    ["4", "5", "6", "-", "+"],
    ["1", "2", "3", "0", "."],
];

function currency(n) {
    const value = Number(n) || 0;
    return `₹${value.toFixed(2)}`;
}

function getProductImageUrl(image) {
    if (!image) return "";
    if (/^(?:https?:\/\/|data:)/i.test(image)) return image;
    const normalizedImage = image.replace(/^\/uploads\/products\//, "/uploads/");
    if (API_IMAGE_URL) {
        return `${API_IMAGE_URL.replace(/\/$/, "")}/${normalizedImage.replace(/^\//, "")}`;
    }
    return normalizedImage;
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

function formatHeaderDate(d) {
    return (
        d.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" }) +
        " " +
        d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })
    );
}

const POS = () => {
    const navigate = useNavigate();
    const { token, clientId, businessLocationId: authBusinessLocationId } = useAuth();

    const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

    const [categories, setCategories] = useState([]);
    const [taxRates, setTaxRates] = useState([]);
    const [products, setProducts] = useState([]);
    const [loadingProducts, setLoadingProducts] = useState(true);
    const [loadError, setLoadError] = useState(null);

    const [locations, setLocations] = useState([]);
    const [loadingLocations, setLoadingLocations] = useState(false);
    const [selectedLocationId, setSelectedLocationId] = useState(null);
    const businessLocationId = authBusinessLocationId || selectedLocationId;
    const [tables, setTables] = useState([]);
    const [loadingTables, setLoadingTables] = useState(false);
    const [selectedTableId, setSelectedTableId] = useState(null);

    const [saleType, setSaleType] = useState("dining");
    const [selectedCategoryId, setSelectedCategoryId] = useState(null);
    const [productSearch, setProductSearch] = useState("");
    const [productPage, setProductPage] = useState(1);
    const searchInputRef = useRef(null);
    const productShortcutTimerRef = useRef(null);
    const enterShortcutTimerRef = useRef(null);
    const shortcutPaymentRef = useRef(null);
    const [customerName, setCustomerName] = useState("Walk-In Customer");
    const [customers, setCustomers] = useState([]);
    const [showCustomerPicker, setShowCustomerPicker] = useState(false);
    const [guestCount, setGuestCount] = useState(2);
    const [showCustomerForm, setShowCustomerForm] = useState(false);
    const [customerForm, setCustomerForm] = useState(emptyCustomer);
    const [savingCustomer, setSavingCustomer] = useState(false);
    const [showCalculator, setShowCalculator] = useState(false);
    const [calculatorValue, setCalculatorValue] = useState("");

    const [cart, setCart] = useState([]);
    const [discountAmount, setDiscountAmount] = useState(0);
    const [applyRoundOff, setApplyRoundOff] = useState(true);

    const [payments, setPayments] = useState([{ ...emptyPayment }]);
    const [checkoutError, setCheckoutError] = useState(null);
    const [saving, setSaving] = useState(false);
    const [lastSale, setLastSale] = useState(null);

    const [showHistory, setShowHistory] = useState(false);
    const [salesList, setSalesList] = useState([]);
    const [historyTotal, setHistoryTotal] = useState(0);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [historyError, setHistoryError] = useState(null);
    const [selectedSale, setSelectedSale] = useState(null);
    const [selectedSaleLoading, setSelectedSaleLoading] = useState(false);
    const [cancellingId, setCancellingId] = useState(null);

    const [now, setNow] = useState(new Date());

    useEffect(() => {
        if (clientId) {
            loadCategories();
            loadLocations();
            loadTaxRates();
        }
    }, [clientId]);

    useEffect(() => {
        const t = setInterval(() => setNow(new Date()), 60000);
        return () => clearInterval(t);
    }, []);

    useEffect(() => {
        searchInputRef.current?.focus();
        return () => {
            if (productShortcutTimerRef.current) {
                clearTimeout(productShortcutTimerRef.current);
            }
        };
    }, []);

    useEffect(() => {
        setProductPage(1);
        if (businessLocationId) loadProducts();
    }, [businessLocationId]);

    useEffect(() => {
        if (businessLocationId) {
            loadTables();
            loadCustomers();
        } else {
            setTables([]);
            setCustomers([]);
        }
    }, [businessLocationId]);

    async function loadCategories() {
        try {
            if (window.electronAPI?.categories) {
                const data = await window.electronAPI.categories.getAll(clientId);
                setCategories(Array.isArray(data) ? data : []);
                return;
            }
            const res = await fetch(`${API_BASE_URL}/api/client/categories`, { headers: { Accept: "application/json", ...authHeaders } });
            const json = await res.json();
            if (!res.ok || !json.success) throw new Error(json.message || "Failed to load categories");
            const data = json.data;
            setCategories(Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : []);
        } catch (err) { console.error("Load categories error:", err); }
    }

    async function loadTaxRates() {
        try {
            if (window.electronAPI?.taxRates) {
                const data = await window.electronAPI.taxRates.getAll(clientId);
                setTaxRates(Array.isArray(data) ? data : []);
                return;
            }
            const res = await fetch(`${API_BASE_URL}/api/tax-rates`, { headers: { Accept: "application/json", ...authHeaders } });
            const json = await res.json();
            if (!res.ok || !json.success) throw new Error(json.message || "Failed to load tax rates");
            const data = json.data;
            setTaxRates(Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : []);
        } catch (err) { console.error("Load tax rates error:", err); setTaxRates([]); }
    }

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
            const res = await fetch(`${API_BASE_URL}/api/client/business-locations`, { headers: { Accept: "application/json", ...authHeaders } });
            const json = await res.json();
            if (!res.ok || !json.success) throw new Error(json.message || "Failed to load business locations");
            const data = json.data;
            const nextLocations = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
            setLocations(nextLocations);
            if (!authBusinessLocationId) setSelectedLocationId(getPrimaryLocationId(nextLocations) || null);
        } catch (err) { console.error("Load business locations error:", err); setLocations([]); }
        finally { setLoadingLocations(false); }
    }

    async function loadProducts() {
        setLoadingProducts(true); setLoadError(null);
        try {
            if (window.electronAPI?.products) {
                const data = await window.electronAPI.products.getAll(clientId, businessLocationId);
                setProducts(Array.isArray(data) ? data : []);
                return;
            }
            const res = await fetch(`${API_BASE_URL}/api/products?per_page=1000&business_location_id=${businessLocationId}`, { headers: { Accept: "application/json", ...authHeaders } });
            const json = await res.json();
            if (!res.ok || !json.success) throw new Error(json.message || "Failed to load products");
            const data = json.data;
            const allProducts = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
            const scoped = allProducts.filter((product) => (product.business_locations || []).some((loc) => String(loc.id) === String(businessLocationId)));
            setProducts(scoped);
        } catch (err) { console.error("Load products error:", err); setLoadError(err.message); setProducts([]); }
        finally { setLoadingProducts(false); }
    }

    async function loadTables() {
        setLoadingTables(true);
        try {
            if (window.electronAPI?.tables) {
                const data = await window.electronAPI.tables.getAll(clientId, businessLocationId);
                setTables(Array.isArray(data) ? data : []);
                return;
            }
            const res = await fetch(`${API_BASE_URL}/api/tables?business_location_id=${encodeURIComponent(businessLocationId)}`, { headers: { Accept: "application/json", ...authHeaders } });
            const json = await res.json();
            if (!res.ok || !json.success) throw new Error(json.message || "Failed to load tables");
            setTables(Array.isArray(json.data) ? json.data : []);
        } catch (err) { console.error("Load tables error:", err); setTables([]); }
        finally { setLoadingTables(false); }
    }

    async function loadCustomers() {
        try {
            if (window.electronAPI?.customers) {
                const data = await window.electronAPI.customers.getAll(clientId, businessLocationId);
                setCustomers(Array.isArray(data) ? data : []);
                return;
            }
            const res = await fetch(`${API_BASE_URL}/api/customers?business_location_id=${encodeURIComponent(businessLocationId)}`, { headers: { Accept: "application/json", ...authHeaders } });
            const json = await res.json();
            if (!res.ok || !json.success) throw new Error(json.message || "Failed to load customers");
            setCustomers(Array.isArray(json.data) ? json.data : []);
        } catch (err) { console.error("Load customers error:", err); setCustomers([]); }
    }

    function addToCart(product) {
        setCart((prev) => {
            const existing = prev.find((i) => i.product_id === product.id);
            if (existing) {
                return prev.map((i) =>
                    i.product_id === product.id
                        ? { ...i, quantity: i.quantity + 1 }
                        : i
                );
            }
            return [
                ...prev,
                {
                    product_id: product.id,
                    name: product.name,
                    applicable_tax_id: product.applicable_tax_id,
                    selling_price_tax_type: product.selling_price_tax_type || "exclusive",
                    unit_price_inc_tax: Number(
                        product.default_selling_price_inc_tax ?? 0
                    ),
                    quantity: 1,
                    discount_amount: 0,
                },
            ];
        });
        setProductSearch("");
        searchInputRef.current?.focus();
    }

    function updateQuantity(productId, delta) {
        setCart((prev) =>
            prev
                .map((i) =>
                    i.product_id === productId
                        ? { ...i, quantity: i.quantity + delta }
                        : i
                )
                .filter((i) => i.quantity > 0)
        );
    }

    function removeFromCart(productId) {
        setCart((prev) => prev.filter((i) => i.product_id !== productId));
    }

    function clearOrder() {
        setCart([]);
        setDiscountAmount(0);
        setPayments([{ ...emptyPayment }]);
        setCheckoutError(null);
        setSelectedTableId(null);
    }

    function selectTable(table) {
        setSelectedTableId(table.id);
        setSaleType("dining");
    }

    function openCustomerForm() {
        setCustomerForm(emptyCustomer);
        setShowCustomerForm(true);
    }

    function handleCustomerChange(event) {
        const { name, value } = event.target;
        setCustomerForm((previous) => ({ ...previous, [name]: value }));
    }

    function selectCustomer(customer) {
        setCustomerName(customer.name);
        setShowCustomerPicker(false);
    }

    function calculateValue(value) {
        const expression = value.trim();
        if (!expression || !/^[0-9+\-*/().%\s]+$/.test(expression)) return null;

        try {
            const result = Function(`"use strict"; return (${expression})`)();
            return Number.isFinite(result) ? String(result) : null;
        } catch {
            return null;
        }
    }

    function handleCalculatorButton(button) {
        if (button === "AC") {
            setCalculatorValue("");
            return;
        }

        if (button === "backspace") {
            setCalculatorValue((value) => value.slice(0, -1));
            return;
        }

        if (button === "=") {
            const result = calculateValue(calculatorValue);
            if (result === null) toast.error("Enter a valid calculation");
            else setCalculatorValue(result);
            return;
        }

        if (button === "pi") {
            setCalculatorValue((value) => `${value}${Math.PI}`);
            return;
        }

        if (button === "e") {
            setCalculatorValue((value) => `${value}${Math.E}`);
            return;
        }

        if (button === "sqrt" || button === "x2" || button === "x3" || ["sin", "cos", "tan", "log", "ln"].includes(button)) {
            const number = Number(calculatorValue);
            if (!Number.isFinite(number)) {
                toast.error("Enter a number first");
                return;
            }
            const result = button === "sqrt" ? Math.sqrt(number)
                : button === "x2" ? number ** 2
                    : button === "x3" ? number ** 3
                        : button === "sin" ? Math.sin(number)
                            : button === "cos" ? Math.cos(number)
                                : button === "tan" ? Math.tan(number)
                                    : button === "log" ? Math.log10(number)
                                        : Math.log(number);
            setCalculatorValue(Number.isFinite(result) ? String(result) : "");
            return;
        }

        setCalculatorValue((value) => `${value}${button}`);
    }

    async function saveCustomer(event) {
        event.preventDefault(); setSavingCustomer(true);
        try {
            if (window.electronAPI?.customers) {
                const customer = await window.electronAPI.customers.create({
                    id: crypto.randomUUID(), client_id: clientId, business_location_id: businessLocationId,
                    name: customerForm.name.trim(), mobile_number: customerForm.mobile_number.trim(), address: customerForm.address.trim(),
                });
                setCustomerName(customer.name);
                setShowCustomerForm(false);
                await loadCustomers();
                toast.success("Customer created successfully");
                return;
            }
            const response = await fetch(`${API_BASE_URL}/api/customers`, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json", ...authHeaders }, body: JSON.stringify({ ...customerForm, business_location_id: businessLocationId }) });
            const json = await response.json();
            if (!response.ok || !json.success) throw new Error(json.message || "Failed to create customer");
            setCustomerName(json.data.name); setShowCustomerForm(false); toast.success("Customer created successfully");
        } catch (error) { console.error("Create customer error:", error); toast.error(error.message); }
        finally { setSavingCustomer(false); }
    }

    const itemsTotal = useMemo(
        () =>
            cart.reduce(
                (sum, i) => sum + i.unit_price_inc_tax * i.quantity - (i.discount_amount || 0),
                0
            ),
        [cart]
    );

    const taxAmount = useMemo(
        () => cart.reduce((sum, item) => {
            const taxRate = Number(taxRates.find((tax) => String(tax.id) === String(item.applicable_tax_id))?.rate_percent) || 0;
            if (taxRate <= 0) return sum;
            const lineTotal = item.unit_price_inc_tax * item.quantity - (item.discount_amount || 0);
            return sum + (lineTotal - lineTotal / (1 + taxRate / 100));
        }, 0),
        [cart, taxRates]
    );
    const rawTotal = itemsTotal - discountAmount;

    const roundOffAmount = useMemo(() => {
        if (!applyRoundOff) return 0;
        return Math.round(rawTotal) - rawTotal;
    }, [rawTotal, applyRoundOff]);

    const totalPayable = rawTotal + roundOffAmount;

    const filteredProducts = products.filter((p) => {
        const matchesCategory =
            !selectedCategoryId || p.category_id === selectedCategoryId;
        const matchesSearch = p.name
            ?.toLowerCase()
            .includes(productSearch.toLowerCase()) || String(p.shortcut_number || "") === productSearch.trim();
        return matchesCategory && matchesSearch;
    });

    const totalProductPages = Math.ceil(filteredProducts.length / PRODUCT_DISPLAY_LIMIT);
    const visibleProducts = filteredProducts.slice(
        (productPage - 1) * PRODUCT_DISPLAY_LIMIT,
        productPage * PRODUCT_DISPLAY_LIMIT
    );

    useEffect(() => {
        setProductPage((page) => Math.min(page, Math.max(totalProductPages, 1)));
    }, [totalProductPages]);

    useEffect(() => {
        function handleEnterShortcut(event) {
            if (event.key !== "Enter" || event.repeat || showCustomerForm || showCalculator || showHistory) {
                return;
            }

            const target = event.target;
            if (target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement) {
                return;
            }

            if (target instanceof HTMLInputElement && target !== searchInputRef.current) {
                return;
            }

            event.preventDefault();

            if (target === searchInputRef.current && productSearch.trim() && filteredProducts.length > 0) {
                if (productShortcutTimerRef.current) {
                    clearTimeout(productShortcutTimerRef.current);
                    productShortcutTimerRef.current = null;
                }
                addToCart(filteredProducts[0]);
                return;
            }

            if (enterShortcutTimerRef.current) {
                clearTimeout(enterShortcutTimerRef.current);
                enterShortcutTimerRef.current = null;
                shortcutPaymentRef.current?.("card");
                return;
            }

            enterShortcutTimerRef.current = setTimeout(() => {
                enterShortcutTimerRef.current = null;
                shortcutPaymentRef.current?.("cash");
            }, 300);
        }

        window.addEventListener("keydown", handleEnterShortcut);
        return () => {
            window.removeEventListener("keydown", handleEnterShortcut);
            if (enterShortcutTimerRef.current) {
                clearTimeout(enterShortcutTimerRef.current);
            }
        };
    }, [showCustomerForm, showCalculator, showHistory, productSearch, filteredProducts]);

    function setSinglePayment(method) {
        const selectedPayment = [{ payment_method: method, amount: totalPayable.toFixed(2) }];
        setPayments(selectedPayment);
        handleCheckout(selectedPayment);
    }

    shortcutPaymentRef.current = setSinglePayment;

    function enableMultiplePay() {
        setPayments([
            { payment_method: "cash", amount: "" },
            { payment_method: "card", amount: "" },
        ]);
    }

    function updatePaymentRow(index, field, value) {
        setPayments((prev) =>
            prev.map((p, i) => (i === index ? { ...p, [field]: value } : p))
        );
    }

    function addPaymentRow() {
        setPayments((prev) => [...prev, { ...emptyPayment }]);
    }

    function removePaymentRow(index) {
        setPayments((prev) => prev.filter((_, i) => i !== index));
    }

    async function handleCheckout(paymentRows = payments) {
        setCheckoutError(null);
        if (cart.length === 0) { setCheckoutError("Add at least one item to the order."); return; }
        const selectedPaymentsTotal = paymentRows.reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0);
        if (Math.abs(selectedPaymentsTotal - totalPayable) > 0.01) {
            setCheckoutError(`Payment total (${currency(selectedPaymentsTotal)}) must match the payable amount (${currency(totalPayable)}).`); return;
        }
        const payload = {
            client_id: clientId,
            business_location_id: businessLocationId,
            sale_type: saleType,
            customer_name: customerName.trim() || "Walk-In Customer",
            discount_amount: Number(discountAmount) || 0,
            order_tax_amount: Number(taxAmount.toFixed(2)),
            round_off_amount: Number(roundOffAmount.toFixed(2)),
            items: cart.map((i) => ({ product_id: i.product_id, quantity: i.quantity, unit_price_inc_tax: i.unit_price_inc_tax, discount_amount: i.discount_amount || 0 })),
            payments: paymentRows.map((p) => ({ payment_method: p.payment_method, amount: Number(p.amount) || 0 })),
        };
        setSaving(true);
        try {
            if (window.electronAPI?.sales) {
                const sale = await window.electronAPI.sales.create(payload);
                setLastSale(sale); clearOrder();
                if (selectedTableId && window.electronAPI?.tables) await window.electronAPI.tables.updateStatus(selectedTableId, clientId, "available");
                toast.success("Sales created successfully");
                return;
            }
            const res = await fetch(`${API_BASE_URL}/api/sales`, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json", ...authHeaders }, body: JSON.stringify(payload) });
            const json = await res.json();
            if (!res.ok || !json.success) throw new Error(json.message || "Failed to create sale");
            setLastSale(json.data); clearOrder(); toast.success("Sales created successfully");
        } catch (err) { console.error("Create sale error:", err); setCheckoutError(err.message); }
        finally { setSaving(false); }
    }

    async function openHistory() {
        setShowHistory(true); setHistoryLoading(true); setHistoryError(null); setSelectedSale(null);
        try {
            if (window.electronAPI?.sales) {
                const list = await window.electronAPI.sales.getAll(clientId, businessLocationId || null);
                const allSales = Array.isArray(list) ? list : [];
                setHistoryTotal(allSales.length);
                setSalesList(allSales.slice(0, 5));
                return;
            }
            const query = businessLocationId ? `?business_location_id=${encodeURIComponent(businessLocationId)}` : "";
            const res = await fetch(`${API_BASE_URL}/api/sales${query}`, { headers: { Accept: "application/json", ...authHeaders } });
            const json = await res.json();
            if (!res.ok || !json.success) throw new Error(json.message || "Failed to load sales");
            const data = json.data; const list = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
            setHistoryTotal(list.length);
            setSalesList(list.slice(0, 5));
        } catch (err) { console.error("Load sales error:", err); setHistoryError(err.message); }
        finally { setHistoryLoading(false); }
    }

    async function viewSale(id) {
        setSelectedSaleLoading(true);
        try {
            if (window.electronAPI?.sales) {
                const sale = await window.electronAPI.sales.getById(clientId, id, businessLocationId || null);
                if (!sale) throw new Error("Sale not found");
                setSelectedSale(sale); return;
            }
            const res = await fetch(`${API_BASE_URL}/api/sales/${id}`, { headers: { Accept: "application/json", ...authHeaders } });
            const json = await res.json();
            if (!res.ok || !json.success) throw new Error(json.message || "Failed to load sale");
            setSelectedSale(json.data);
        } catch (err) { console.error("View sale error:", err); setHistoryError(err.message); }
        finally { setSelectedSaleLoading(false); }
    }

    async function cancelSale(id) {
        setCancellingId(id);
        try {
            if (window.electronAPI?.sales) {
                await window.electronAPI.sales.cancel(clientId, id, businessLocationId || null);
                setSalesList((prev) => prev.filter((s) => s.id !== id));
                if (selectedSale?.id === id) setSelectedSale(null);
                return;
            }
            const res = await fetch(`${API_BASE_URL}/api/sales/${id}`, { method: "DELETE", headers: { Accept: "application/json", ...authHeaders } });
            if (!res.ok) { const json = await res.json().catch(() => ({})); throw new Error(json.message || "Failed to cancel sale"); }
            setSalesList((prev) => prev.filter((s) => s.id !== id)); if (selectedSale?.id === id) setSelectedSale(null);
        } catch (err) { console.error("Cancel sale error:", err); setHistoryError(err.message); }
        finally { setCancellingId(null); }
    }

    const currentLocationName =
        locations.find((l) => String(l.id) === String(businessLocationId))?.name ||
        (authBusinessLocationId ? "Current Location" : "Select Location");

    const selectedTable = tables.find((t) => t.id === selectedTableId);
    const orderBadgeLabel =
        saleType === "dining"
            ? `DINE-IN${selectedTable ? ` - ${selectedTable.name.replace(/^Table\s*/i, "")}` : ""}`
            : (SALE_TYPES.find((s) => s.key === saleType)?.label || saleType).toUpperCase();

    return (
        <div className="flex flex-col h-screen bg-[#f1f3f7] text-slate-700 text-[11px] font-sans select-none p-2 gap-2 overflow-y-auto lg:overflow-hidden">

            <header className="bg-white rounded-lg px-3 py-1.5 flex flex-wrap items-center justify-between gap-2 border border-slate-200 shadow-2xl">
                <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1.5 text-slate-600 font-medium bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200">
                        <span className="text-slate-400 hidden sm:inline">Location</span>
                        <MapPin className="w-3.5 h-3.5 text-indigo-600 sm:ml-1" />
                        {authBusinessLocationId ? (
                            <span className="font-semibold text-slate-800">{currentLocationName}</span>
                        ) : (
                            <select
                                value={selectedLocationId || ""}
                                onChange={(e) => setSelectedLocationId(e.target.value || null)}
                                disabled={loadingLocations}
                                className="bg-transparent font-semibold text-slate-800 outline-none max-w-[36vw] sm:max-w-none"
                            >
                                <option value="" disabled>
                                    {loadingLocations ? "Loading..." : "Select location"}
                                </option>
                                {locations.map((loc) => (
                                    <option key={loc.id} value={loc.id}>
                                        {loc.name}
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>

                    <div className="hidden sm:flex items-center gap-1.5 text-indigo-600 font-medium bg-indigo-50/50 px-2.5 py-1 rounded-md border border-indigo-100">
                        <Calendar className="w-3.5 h-3.5" />
                        <span className="font-semibold">{formatHeaderDate(now)}</span>
                    </div>
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                    {/* <button className="p-1.5 text-indigo-600 hover:bg-slate-100 rounded-md border border-slate-200 bg-white"><FastForward className="w-4 h-4" /></button>
                    <button className="p-1.5 text-indigo-600 hover:bg-slate-100 rounded-md border border-slate-200 bg-white"><Columns className="w-4 h-4" /></button> */}
                    <button
                        type="button"
                        onClick={openCustomerForm}
                        className="p-1.5 text-indigo-600 hover:bg-slate-100 rounded-md border border-slate-200 bg-white shrink-0"
                        aria-label="Add customer"
                    ><UserPlus className="w-4 h-4" /></button>
                    <button className="p-1.5 text-emerald-600 hover:bg-slate-100 rounded-md border border-slate-200 bg-white shrink-0"><Printer className="w-4 h-4" /></button>
                    <button
                        type="button"
                        onClick={() => setShowCalculator(true)}
                        className="p-1.5 text-emerald-600 hover:bg-slate-100 rounded-md border border-slate-200 bg-white shrink-0"
                        aria-label="Open calculator"
                    ><Calculator className="w-4 h-4" /></button>
                    <button
                        onClick={() => {
                            loadProducts();
                            loadTables();
                        }}
                        className="p-1.5 text-rose-500 hover:bg-slate-100 rounded-md border border-slate-200 bg-white shrink-0"
                    >
                        <RotateCcw className="w-4 h-4" />
                    </button>
                    <button className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-md border border-slate-200 bg-white shrink-0"><MoreVertical className="w-4 h-4" /></button>
                    <button className="ml-2 bg-white border border-indigo-600 text-indigo-600 px-3 py-1.5 rounded-md font-medium flex items-center gap-1.5 hover:bg-indigo-50 shrink-0 whitespace-nowrap">
                        <Plus className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Add Expense</span>
                    </button>
                </div>
            </header>

            <div className="flex flex-col lg:flex-row flex-1 gap-2 overflow-visible lg:overflow-hidden">

                <div className="w-full lg:flex-[2.6] flex flex-col gap-2 overflow-visible lg:overflow-hidden">

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <div className="relative flex items-center bg-white rounded-lg border border-slate-200 p-1 flex-1">
                            <div className="flex items-center gap-2 px-2 text-slate-600 border-r border-slate-200 flex-1">
                                <User className="w-4 h-4 text-slate-400" />
                                <input
                                    value={customerName}
                                    onChange={(e) => setCustomerName(e.target.value)}
                                    onFocus={() => setShowCustomerPicker(true)}
                                    placeholder="Walk-In Customer"
                                    className="font-semibold text-slate-800 bg-transparent outline-none w-full"
                                />
                            </div>
                            <button
                                type="button"
                                onClick={openCustomerForm}
                                className="p-1 bg-indigo-600 text-white rounded-md ml-1"
                                aria-label="Add customer"
                            ><Plus className="w-3.5 h-3.5" /></button>

                            {showCustomerPicker && customers.length > 0 && (
                                <div className="absolute left-1 right-1 top-full z-30 mt-1 max-h-48 overflow-y-auto rounded-lg border border-slate-200 bg-white p-1 shadow-lg">
                                    {customers
                                        .filter((customer) => {
                                            const query = customerName === "Walk-In Customer"
                                                ? ""
                                                : customerName.toLowerCase().trim();
                                            return !query || customer.name.toLowerCase().includes(query) || customer.mobile_number.includes(query);
                                        })
                                        .slice(0, 8)
                                        .map((customer) => (
                                            <button
                                                key={customer.id}
                                                type="button"
                                                onMouseDown={(event) => event.preventDefault()}
                                                onClick={() => selectCustomer(customer)}
                                                className="flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-left hover:bg-indigo-50"
                                            >
                                                <span className="truncate font-semibold text-slate-800">{customer.name}</span>
                                                <span className="shrink-0 text-[10px] text-slate-400">{customer.mobile_number}</span>
                                            </button>
                                        ))}
                                </div>
                            )}
                        </div>

                        <div className="flex items-center justify-between sm:justify-start bg-white rounded-lg border border-slate-200 p-1 px-3 gap-2">
                            <UserCheck className="w-4 h-4 text-slate-400" />
                            <input
                                type="number"
                                min={1}
                                value={guestCount}
                                onChange={(e) => setGuestCount(Math.max(1, Number(e.target.value) || 1))}
                                className="font-bold text-slate-800 text-xs bg-transparent outline-none w-5 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                            />
                        </div>

                        <div className="relative flex items-center bg-white rounded-lg border border-slate-200 px-3 py-1.5 flex-1 sm:flex-[1.8] justify-between">
                            <input
                                ref={searchInputRef}
                                type="text"
                                value={productSearch}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    setProductSearch(value);
                                    setProductPage(1);
                                    if (productShortcutTimerRef.current) {
                                        clearTimeout(productShortcutTimerRef.current);
                                        productShortcutTimerRef.current = null;
                                    }

                                    const shortcut = value.trim();
                                    if (/^\d+$/.test(shortcut)) {
                                        productShortcutTimerRef.current = setTimeout(() => {
                                            productShortcutTimerRef.current = null;
                                            const shortcutProduct = products.find(
                                                (product) => String(product.shortcut_number || "") === shortcut
                                            );
                                            if (shortcutProduct) addToCart(shortcutProduct);
                                        }, 300);
                                    }
                                }}
                                placeholder="Scan barcode or search product"
                                className="bg-transparent outline-none w-full text-slate-700 placeholder-slate-400"
                            />
                            <div className="flex items-center gap-2">
                                <Scan className="w-4 h-4 text-indigo-600 cursor-pointer" />
                                <button className="p-1 bg-indigo-600 text-white rounded-md"><Plus className="w-3.5 h-3.5" /></button>
                            </div>

                            {productSearch.trim() && filteredProducts.length > 0 && (
                                <div className="absolute left-0 right-0 top-full z-30 mt-1 max-h-56 overflow-y-auto rounded-lg border border-slate-200 bg-white p-1 shadow-lg">
                                    {filteredProducts.slice(0, 8).map((product) => (
                                        <button
                                            key={product.id}
                                            type="button"
                                            onMouseDown={(event) => event.preventDefault()}
                                            onClick={() => addToCart(product)}
                                            className="flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-left hover:bg-indigo-50"
                                        >
                                            <span className="truncate font-semibold text-slate-800">{product.name}</span>
                                            <span className="shrink-0 text-[10px] font-bold text-indigo-600">
                                                {currency(product.default_selling_price_inc_tax)}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar">
                        {SALE_TYPES.map((type, idx) => {
                            const Icon = type.icon;
                            const isSelected = saleType === type.key;
                            return (
                                <button
                                    key={type.key}
                                    onClick={() => setSaleType(type.key)}
                                    className={`flex-1 min-w-[92px] sm:min-w-0 py-2 px-2 rounded-lg border font-semibold flex items-center justify-center gap-1.5 transition-all whitespace-nowrap ${isSelected
                                        ? "bg-indigo-50 border-indigo-600 text-indigo-700 shadow-sm"
                                        : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                                        }`}
                                >
                                    <Icon className={`w-3.5 h-3.5 ${type.color || (isSelected ? "text-indigo-600" : "text-slate-500")}`} />
                                    <span>{idx + 1} {type.label}</span>
                                </button>
                            );
                        })}
                    </div>

                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                        <button
                            onClick={() => {
                                setSelectedCategoryId(null);
                                setProductPage(1);
                            }}
                            className={`px-3 py-1.5 rounded-md font-semibold text-[10px] transition-all whitespace-nowrap ${!selectedCategoryId
                                ? "bg-indigo-600 text-white shadow-sm"
                                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                                }`}
                        >
                            Categories
                        </button>
                        {categories.map((cat) => {
                            const isSelected = selectedCategoryId === cat.id;
                            return (
                                <button
                                    key={cat.id}
                                    onClick={() => {
                                        setSelectedCategoryId(cat.id);
                                        setProductPage(1);
                                    }}
                                    className={`px-3 py-1.5 rounded-md font-semibold text-[10px] transition-all whitespace-nowrap ${isSelected
                                        ? "bg-indigo-600 text-white shadow-sm"
                                        : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                                        }`}
                                >
                                    {cat.name}
                                </button>
                            );
                        })}
                        <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0 cursor-pointer" />
                    </div>

                    {!businessLocationId ? (
                        <div className="flex-1 bg-white rounded-lg border border-slate-200 p-4 flex items-center justify-center text-slate-400 font-medium">
                            Select a business location above to load products.
                        </div>
                    ) : loadingProducts ? (
                        <div className="flex-1 bg-white rounded-lg border border-slate-200 p-4 flex items-center justify-center text-slate-400 font-medium">
                            Loading products...
                        </div>
                    ) : loadError ? (
                        <div className="flex-1 bg-white rounded-lg border border-rose-200 p-4 flex items-center justify-center text-rose-600 font-medium">
                            {loadError}
                        </div>
                    ) : filteredProducts.length === 0 ? (
                        <div className="flex-1 bg-white rounded-lg border border-slate-200 p-4 flex items-center justify-center text-slate-400 font-medium">
                            No products found.
                        </div>
                    ) : (
                        <div className="flex-1 bg-white rounded-lg border border-slate-200 p-2.5 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 content-start">
                            {visibleProducts.map((product) => (
                                <div
                                    key={product.id}
                                    onClick={() => addToCart(product)}
                                    className="border border-slate-200/60 rounded-xl p-2 bg-white hover:border-indigo-200 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
                                >
                                    <div className="w-full h-20 rounded-lg mb-2 overflow-hidden bg-slate-100 flex items-center justify-center">
                                        {product.image ? (
                                            <img
                                                src={getProductImageUrl(product.image)}
                                                alt={product.name}
                                                onError={(e) => {
                                                    e.currentTarget.style.display = "none";
                                                    e.currentTarget.nextSibling?.style &&
                                                        (e.currentTarget.nextSibling.style.display = "flex");
                                                }}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : null}
                                        <div className={`items-center justify-center text-slate-300 ${product.image ? "hidden" : "flex"}`}>
                                            <ShoppingBag className="w-6 h-6" />
                                        </div>
                                    </div>
                                    <div>
                                        <div className="font-bold text-slate-800 text-[11px] truncate">{product.name}</div>
                                        <div className="text-slate-600 font-semibold text-[10px] mt-0.5">
                                            {currency(product.default_selling_price_inc_tax)}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="flex justify-center items-center gap-1.5 py-0.5">
                        {totalProductPages > 1 && Array.from({ length: totalProductPages }, (_, index) => (
                            <button
                                key={index}
                                type="button"
                                aria-label={`Show product page ${index + 1}`}
                                onClick={() => setProductPage(index + 1)}
                                className={`rounded-full transition-all ${productPage === index + 1
                                    ? "h-2 w-2 bg-indigo-600"
                                    : "h-1.5 w-1.5 bg-slate-300 hover:bg-slate-400"
                                    }`}
                            />
                        ))}
                    </div>
                </div>

                <div className="w-full lg:flex-1 bg-white rounded-lg border border-slate-200 p-2.5 flex flex-col justify-between max-h-80 lg:max-h-none overflow-hidden">
                    <div className="flex items-center justify-between mb-1">
                        <div>
                            <span className="font-bold text-indigo-950 uppercase tracking-wider text-[10px]">RUNNING TABLES</span>
                            <p className="mt-0.5 text-[9px] font-semibold text-slate-400">{currentLocationName}</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => navigate("/admin-table")}
                            className="text-indigo-600 hover:underline font-semibold text-[10px]"
                        >
                            View All
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-2 pr-0.5 my-1">
                        {loadingTables ? (
                            <p className="text-slate-400 font-medium py-3">Loading tables...</p>
                        ) : tables.length === 0 ? (
                            <p className="text-slate-400 font-medium py-3">No tables at this location.</p>
                        ) : (
                            tables.map((table) => {
                                const style = TABLE_STATUS_STYLES[table.status] || TABLE_STATUS_STYLES.available;
                                return (
                                    <div
                                        key={table.id}
                                        onClick={() => selectTable(table)}
                                        className={`p-2.5 rounded-lg border flex flex-col gap-1.5 relative cursor-pointer transition-all hover:-translate-y-0.5 ${style.bg} ${selectedTableId === table.id ? "ring-2 ring-indigo-600" : ""
                                            }`}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-center gap-2">
                                                <div className="p-1.5 rounded-md bg-white border border-slate-200/50">
                                                    <Utensils className="w-3.5 h-3.5 text-slate-600" />
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-900 text-[11px]">{table.name}</div>
                                                    <div className="text-[9px] text-slate-400">{table.capacity || "-"} Seater</div>
                                                </div>
                                            </div>
                                            {style.badge && (
                                                <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold uppercase tracking-tight ${style.badge.style}`}>
                                                    {style.badge.label}
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex justify-between items-center text-[10px] mt-1 pt-1 border-t border-slate-100/50">
                                            <span className={`font-bold ${style.amount}`}>{currency(table.running_amount ?? 0)}</span>
                                            <div className="flex items-center gap-1 text-slate-500 text-[9px]">
                                                <Clock className="w-3 h-3" />
                                                <span>{table.running_time || "00:00:00"}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                </div>

                <div className="w-full lg:flex-[1.2] bg-white rounded-lg border border-slate-200 p-2.5 flex flex-col justify-between overflow-visible lg:overflow-hidden">
                    <div className="flex flex-col overflow-hidden">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                            <span className="font-bold text-slate-800 text-xs">Current Order</span>
                            <div className="flex items-center gap-2">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${SALE_TYPE_BADGE[saleType] || "bg-indigo-50 text-indigo-600"}`}>
                                    {orderBadgeLabel}
                                </span>
                                <button onClick={clearOrder} className="text-rose-400 hover:text-rose-600"><Trash2 className="w-3.5 h-3.5" /></button>
                            </div>
                        </div>

                        {cart.length > 0 && (
                            <div className="grid grid-cols-12 text-[10px] font-bold text-slate-400 py-1.5 border-b border-slate-100">
                                <div className="col-span-5">Item</div>
                                <div className="col-span-3 text-center">Qty</div>
                                <div className="col-span-2 text-right">Price</div>
                                <div className="col-span-2 text-right">Total</div>
                            </div>
                        )}

                        <div className="space-y-2 py-2 max-h-48 overflow-y-auto">
                            {cart.length === 0 ? (
                                <p className="text-center text-slate-400 font-medium py-6">No items added yet.</p>
                            ) : (
                                cart.map((item) => (
                                    <div key={item.product_id} className="grid grid-cols-12 text-[10px] items-center text-slate-700">
                                        <div className="col-span-5 font-bold text-slate-800 truncate">{item.name}</div>
                                        <div className="col-span-3 flex items-center justify-center gap-1 bg-slate-50 rounded border border-slate-200 py-0.5">
                                            <button
                                                onClick={() => updateQuantity(item.product_id, -1)}
                                                className="text-slate-400 hover:text-slate-600 px-1 font-bold"
                                            >
                                                <Minus className="w-2.5 h-2.5" />
                                            </button>
                                            <span className="font-bold text-slate-800">{item.quantity}</span>
                                            <button
                                                onClick={() => updateQuantity(item.product_id, 1)}
                                                className="text-slate-400 hover:text-slate-600 px-1 font-bold"
                                            >
                                                <Plus className="w-2.5 h-2.5" />
                                            </button>
                                        </div>
                                        <div className="col-span-2 text-right text-slate-500 font-medium">
                                            ₹{item.unit_price_inc_tax.toFixed(0)}
                                        </div>
                                        <div className="col-span-2 text-right font-bold text-slate-800 flex items-center justify-end gap-1">
                                            <span>₹{(item.unit_price_inc_tax * item.quantity).toFixed(0)}</span>
                                            <button
                                                onClick={() => removeFromCart(item.product_id)}
                                                className="text-rose-400 hover:text-rose-600 text-[10px]"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="border-t border-slate-100 pt-2 space-y-1 text-[10px]">
                        <div className="flex justify-between text-slate-500">
                            <span>Items Total ({cart.reduce((n, i) => n + i.quantity, 0)})</span>
                            <span className="font-semibold text-slate-700">{currency(itemsTotal)}</span>
                        </div>
                        <div className="flex justify-between text-slate-500 items-center">
                            <span className="flex items-center gap-1">
                                Discount <Edit2 className="w-2.5 h-2.5 text-indigo-600" />
                            </span>
                            <input
                                type="number"
                                min={0}
                                value={discountAmount}
                                onChange={(e) => setDiscountAmount(Number(e.target.value) || 0)}
                                className="w-14 text-right font-semibold text-slate-700 bg-transparent outline-none border-b border-transparent focus:border-indigo-300"
                            />
                        </div>
                        <div className="flex justify-between text-slate-500 items-center">
                            <span className="flex items-center gap-1">
                                Tax (GST)
                            </span>
                            <span className="font-semibold text-slate-700">{currency(taxAmount)}</span>
                        </div>
                        <div className="flex justify-between text-slate-500">
                            <span>Round Off</span>
                            <span className="font-semibold text-slate-700">{currency(roundOffAmount)}</span>
                        </div>

                        <div className="bg-indigo-50/60 p-2 rounded-lg flex justify-between items-center border border-indigo-100/50 my-1.5">
                            <span className="font-bold text-indigo-900 text-xs">Total Payable</span>
                            <span className="font-extrabold text-indigo-700 text-sm">{currency(totalPayable)}</span>
                        </div>

                        {checkoutError && (
                            <div className="rounded-lg border border-rose-200 bg-rose-50 px-2 py-1.5 text-rose-600 font-medium">
                                {checkoutError}
                            </div>
                        )}

                        {lastSale && (
                            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1.5 text-emerald-700 font-medium">
                                Sale created successfully.
                            </div>
                        )}

                        {payments.length > 1 && (
                            <div className="space-y-1.5 border-t border-slate-100 pt-1.5">
                                <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">Split Payment</p>
                                {payments.map((p, idx) => (
                                    <div key={idx} className="flex items-center gap-1.5">
                                        <select
                                            value={p.payment_method}
                                            onChange={(e) => updatePaymentRow(idx, "payment_method", e.target.value)}
                                            className="rounded border border-slate-200 px-1.5 py-1 text-[10px]"
                                        >
                                            {PAYMENT_METHOD_OPTIONS.map((m) => (
                                                <option key={m.key} value={m.key}>{m.label}</option>
                                            ))}
                                        </select>
                                        <input
                                            type="number"
                                            min={0}
                                            value={p.amount}
                                            onChange={(e) => updatePaymentRow(idx, "amount", e.target.value)}
                                            placeholder="Amount"
                                            className="flex-1 rounded border border-slate-200 px-1.5 py-1 text-[10px]"
                                        />
                                        <button onClick={() => removePaymentRow(idx)} className="text-slate-300 hover:text-rose-500">
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                                <button onClick={addPaymentRow} className="text-[10px] font-semibold text-indigo-600">
                                    + Add payment
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleCheckout()}
                                    disabled={saving}
                                    className="w-full rounded-lg bg-indigo-600 py-2 text-[10px] font-bold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {saving ? "Creating sale..." : "Proceed to Pay"}
                                </button>
                            </div>
                        )}

                    </div>
                </div>

            </div>

            <footer className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2 pt-0.5">

                <div className="flex items-center gap-1.5 order-3 md:order-1">
                    {/* <button className="bg-white border border-slate-200 hover:bg-slate-50 p-1.5 rounded-lg flex flex-col items-center justify-center text-rose-500 w-14 h-11">
                        <Pause className="w-3.5 h-3.5" />
                        <span className="text-[8px] font-semibold mt-0.5">Suspend</span>
                    </button>
                    <button className="bg-white border border-slate-200 hover:bg-slate-50 p-1.5 rounded-lg flex flex-col items-center justify-center text-sky-500 w-14 h-11">
                        <Lock className="w-3.5 h-3.5" />
                        <span className="text-[8px] font-semibold mt-0.5">Hold</span>
                    </button> */}
                    <button className="bg-white border border-slate-200 hover:bg-slate-50 p-1.5 rounded-lg flex flex-col items-center justify-center text-emerald-600 w-14 h-11">
                        <FileText className="w-3.5 h-3.5" />
                        <span className="text-[8px] font-semibold mt-0.5">KOT</span>
                    </button>
                </div>

                <div className="grid grid-cols-2 sm:flex sm:items-center gap-1.5 flex-1 justify-center sm:max-w-xl order-1 md:order-2 mx-auto w-full md:w-auto">
                    {PAYMENT_BUTTONS.map((btn) => {
                        const isActive =
                            btn.method && payments.length === 1 && payments[0].payment_method === btn.method;
                        return (
                            <button
                                key={btn.key}
                                onClick={() => (btn.method ? setSinglePayment(btn.method) : enableMultiplePay())}
                                className={`sm:flex-1 py-2.5 font-bold rounded-lg text-center shadow-sm text-[11px] transition-colors ${btn.cls} ${isActive || (!btn.method && payments.length > 1) ? "ring-2 ring-offset-1 ring-indigo-300" : ""
                                    } ${btn.key === "multiple" ? "col-span-2 sm:col-span-1" : ""}`}
                            >
                                {btn.label}
                            </button>
                        );
                    })}
                </div>

                <div className="flex items-center gap-2 order-2 md:order-3 justify-between md:justify-end">
                    <div className="bg-emerald-50 border border-emerald-200/80 rounded-lg px-3 py-0.5 flex flex-col items-end">
                        <span className="text-[8px] text-emerald-700 font-bold uppercase tracking-tight">Total Payable</span>
                        <span className="text-xs font-black text-emerald-600">{currency(totalPayable)}</span>
                    </div>
                    <button
                        onClick={openHistory}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2.5 rounded-lg font-bold flex items-center gap-1.5 shadow-sm text-[11px] whitespace-nowrap"
                    >
                        <Clock className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Recent Transactions</span>
                        <span className="sm:hidden">History</span>
                    </button>
                </div>

            </footer>

            {showCustomerForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
                    <form onSubmit={saveCustomer} className="w-full max-w-md rounded-xl bg-white p-5 shadow-2xl max-h-[90vh] overflow-y-auto">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-sm font-bold text-slate-900">Add Customer</h2>
                            <button type="button" onClick={() => setShowCustomerForm(false)} className="text-slate-400 hover:text-slate-700">
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="space-y-3">
                            <input
                                name="name"
                                value={customerForm.name}
                                onChange={handleCustomerChange}
                                placeholder="Customer name"
                                required
                                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none focus:border-indigo-500"
                            />
                            <input
                                name="mobile_number"
                                value={customerForm.mobile_number}
                                onChange={handleCustomerChange}
                                placeholder="Mobile number"
                                required
                                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none focus:border-indigo-500"
                            />
                            <textarea
                                name="address"
                                value={customerForm.address}
                                onChange={handleCustomerChange}
                                placeholder="Address"
                                rows={3}
                                className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none focus:border-indigo-500"
                            />
                        </div>

                        <div className="mt-4 flex justify-end gap-2">
                            <button type="button" onClick={() => setShowCustomerForm(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600">
                                Cancel
                            </button>
                            <button type="submit" disabled={savingCustomer} className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white disabled:opacity-60">
                                {savingCustomer ? "Saving..." : "Save Customer"}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {showCalculator && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
                    <div className="w-full max-w-[280px] rounded-xl border-[7px] border-[#3b2b25] bg-[#2d211d] p-2.5 shadow-2xl">
                        <div className="mb-2 flex items-center justify-between px-1">
                            <span className="text-[8px] font-bold uppercase tracking-widest text-[#bca993]">Code Mode</span>
                            <button type="button" onClick={() => setShowCalculator(false)} className="h-3 w-3 rounded-full bg-orange-400" aria-label="Close calculator" />
                        </div>
                        <input
                            autoFocus
                            value={calculatorValue}
                            onChange={(event) => setCalculatorValue(event.target.value)}
                            onKeyDown={(event) => {
                                if (event.key === "Enter") {
                                    handleCalculatorButton("=");
                                }
                            }}
                            placeholder="0"
                            className="mb-2 w-full rounded-md border-2 border-[#d8cca2] bg-[#e8deb7] px-3 py-3 text-right text-2xl font-medium text-slate-900 outline-none"
                        />
                        <div className="grid grid-cols-5 gap-2">
                            {CALCULATOR_BUTTONS.flat().map((button) => {
                                const isOperator = ["/", "*", "-", "+", "%", "(", ")", "pi", "e"].includes(button);
                                const isAction = ["AC", "backspace"].includes(button);
                                return (
                                    <button
                                        key={button}
                                        type="button"
                                        onClick={() => handleCalculatorButton(button)}
                                        className={`h-11 rounded-md text-[10px] font-bold shadow-[0_3px_0_rgba(0,0,0,0.25)] active:translate-y-0.5 active:shadow-none ${isAction
                                            ? "bg-[#c84b51] text-white"
                                            : isOperator
                                                ? "bg-[#d48735] text-white"
                                                : "bg-[#553b31] text-[#f2dfc5]"
                                            }`}
                                    >
                                        {button === "backspace" ? "⌫" : button === "sqrt" ? "√" : button === "x2" ? "x²" : button === "x3" ? "x³" : button}
                                    </button>
                                );
                            })}
                            <button
                                type="button"
                                onClick={() => handleCalculatorButton("=")}
                                className="col-span-5 h-11 rounded-full bg-[#c84b51] text-sm font-bold text-white shadow-[0_3px_0_rgba(0,0,0,0.25)] active:translate-y-0.5 active:shadow-none"
                            >
                                =
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showHistory && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
                    <div className="flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl text-[11px]">
                        <div className="flex items-center justify-between border-b border-slate-100 p-4">
                            <h2 className="text-sm font-bold text-slate-900">Recent Transactions</h2>
                            <button onClick={() => setShowHistory(false)} className="text-slate-400 hover:text-slate-700">
                                <X className="w-4.5 h-4.5" />
                            </button>
                        </div>

                        <div className="flex flex-col sm:flex-row flex-1 overflow-hidden">
                            <div className="w-full sm:w-1/2 max-h-56 sm:max-h-none overflow-y-auto border-b sm:border-b-0 sm:border-r border-slate-100">
                                {historyLoading ? (
                                    <p className="p-4 font-medium text-slate-400">Loading sales...</p>
                                ) : historyError ? (
                                    <p className="p-4 font-medium text-rose-600">{historyError}</p>
                                ) : salesList.length === 0 ? (
                                    <p className="p-4 font-medium text-slate-400">No sales found.</p>
                                ) : (
                                    <div className="divide-y divide-slate-100">
                                        {salesList.map((sale, index) => (
                                            <button
                                                key={sale.id}
                                                onClick={() => viewSale(sale.id)}
                                                className={`flex w-full items-center justify-between p-3 text-left hover:bg-slate-50 ${selectedSale?.id === sale.id ? "bg-slate-50" : ""
                                                    }`}
                                            >
                                                <div>
                                                    <p className="font-bold text-slate-900">Sale #{historyTotal - index}</p>
                                                    <p className="text-slate-400">
                                                        {sale.customer_name || "Walk-In Customer"} · {sale.sale_type} · {sale.business_location_name || "-"}
                                                    </p>
                                                </div>
                                                <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="w-full sm:w-1/2 overflow-y-auto p-4">
                                {selectedSaleLoading ? (
                                    <p className="font-medium text-slate-400">Loading...</p>
                                ) : !selectedSale ? (
                                    <div className="flex h-full items-center justify-center text-center font-medium text-slate-400">
                                        <div>
                                            <ChevronLeft className="mx-auto mb-2 text-slate-300 w-5 h-5" />
                                            Select a sale to view details
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <div>
                                            <p className="text-sm font-bold text-slate-900">Sale Details</p>
                                            <p className="mt-0.5 text-slate-500">{formatDate(selectedSale.created_at)}</p>
                                        </div>

                                        <div className="grid grid-cols-2 gap-x-3 gap-y-2 rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                                            {/* <div className="col-span-2">
                                                <p className="font-semibold uppercase tracking-wide text-slate-400 text-[9px]">Sale ID</p>
                                                <p className="break-all font-semibold text-slate-800">{selectedSale.id}</p>
                                            </div> */}
                                            <div>
                                                <p className="font-semibold uppercase tracking-wide text-slate-400 text-[9px]">Customer</p>
                                                <p className="font-semibold text-slate-800">{selectedSale.customer_name}</p>
                                            </div>
                                            <div>
                                                <p className="font-semibold uppercase tracking-wide text-slate-400 text-[9px]">Sale Type</p>
                                                <p className="font-semibold capitalize text-slate-800">{selectedSale.sale_type}</p>
                                            </div>
                                            <div>
                                                <p className="font-semibold uppercase tracking-wide text-slate-400 text-[9px]">Business Location</p>
                                                <p className="font-semibold text-slate-800">{selectedSale.business_location_name || "-"}</p>
                                            </div>
                                            <div>
                                                <p className="font-semibold uppercase tracking-wide text-slate-400 text-[9px]">Payment Method</p>
                                                <p className="font-semibold capitalize text-slate-800">
                                                    {(selectedSale.payments || []).map((p) => p.payment_method).join(", ") || "-"}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="divide-y divide-slate-100 rounded-xl border border-slate-100">
                                            {(selectedSale.items || []).map((item, idx) => (
                                                <div key={idx} className="flex items-center justify-between p-2.5">
                                                    <span className="text-slate-700">
                                                        <span className="font-semibold">{item.product_name || `Product #${item.product_id}`}</span>
                                                        <span> × {item.quantity}</span>
                                                        {item.selling_price_tax_type && (
                                                            <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold capitalize text-slate-500">
                                                                {item.selling_price_tax_type}
                                                            </span>
                                                        )}
                                                    </span>
                                                    <span className="text-right font-semibold text-slate-900">
                                                        <span className="block">{currency(Number(item.selling_price_tax_type === "inclusive" ? item.unit_price_inc_tax : item.default_selling_price_exc_tax ?? item.unit_price_inc_tax) * item.quantity)}</span>
                                                        <span className="block text-[10px] font-medium text-slate-400">
                                                            {item.selling_price_tax_type === "inclusive" ? "Inclusive tax price" : "Exclusive tax price"}
                                                        </span>
                                                    </span>
                                                </div>
                                            ))}
                                        </div>

                                        <div>
                                            <div className="flex justify-between">
                                                <span className="text-slate-500">Discount</span>
                                                <span>{currency(selectedSale.discount_amount)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-slate-500">Tax</span>
                                                <span>{currency(selectedSale.order_tax_amount)}</span>
                                            </div>
                                            <div className="flex justify-between font-bold text-slate-900">
                                                <span>Total</span>
                                                <span>{currency(selectedSale.total_amount)}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default POS;