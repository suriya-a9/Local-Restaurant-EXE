import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/authContext';
import toast from "react-hot-toast";
import {
    User,
    AlertTriangle,
    Plus,
    ReceiptText,
    Search,
    Undo2,
    Tag,
    Armchair,
    GitMerge,
    Package,
    PanelLeftClose,
    PanelLeftOpen,
    Upload,
    RefreshCw,
} from "lucide-react";
import logo from "../assets/SaraS-Web-Solution.png"

const quickActions = [
    { label: "New Order", icon: Plus },
    { label: "Reprint Bill", icon: ReceiptText },
    { label: "Find Order", icon: Search },
    { label: "Refund", icon: Undo2 },
    { label: "Apply Discount", icon: Tag },
    { label: "Table Transfer", icon: Armchair },
    { label: "Merge Tables", icon: GitMerge },
    { label: "Takeaway", icon: Package },
];

const Header = ({ isSidebarExpanded, onToggleSidebarExpand }) => {
    const navigate = useNavigate();
    const { logout, role, portal, subscription } = useAuth();
    const [accountOpen, setAccountOpen] = useState(false);
    const [manualSyncAction, setManualSyncAction] = useState(null);
    const isElectron = Boolean(window.electronAPI?.sync);
    const accountRef = useRef(null);
    const quickActionsRef = useRef(null);
    const quickActionsDrag = useRef({ active: false, startX: 0, startScrollLeft: 0 });

    const allowedWarningRoles = ["admin", "manager", "cashier", "waiter"];
    const normalizedRole = String(role || "").toLowerCase();
    const renewalPhone = "+91 98765 43210";
    const renewalEmail = "support@sarasbillingpro.com";
    const subscriptionEndDate = subscription?.ends_at || subscription?.end_date;
    const formattedExpiryDate = subscriptionEndDate
        ? new Intl.DateTimeFormat("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }).format(new Date(subscriptionEndDate))
        : "";

    const shouldShowSubscriptionWarning =
        allowedWarningRoles.includes(normalizedRole) &&
        subscriptionEndDate &&
        (() => {
            const endDate = new Date(subscriptionEndDate);
            const now = new Date();
            const diffInDays = (endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
            return diffInDays <= 5 && diffInDays >= 0;
        })();

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (accountRef.current && !accountRef.current.contains(e.target)) {
                setAccountOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const handleUpdateRefresh = async () => {
        if (!isElectron || manualSyncAction) return;
        if (!navigator.onLine) {
            toast.error("Wi-Fi / internet connection is unavailable");
            return;
        }

        setManualSyncAction("push");
        try {
            const result = await window.electronAPI.sync.pushNow();
            if (result?.success) {
                toast.success("Local data updated to live server");
            } else {
                toast.error(result?.reason || result?.last_error || result?.error || "Update refresh failed");
            }
        } catch (error) {
            toast.error(error?.message || "Update refresh failed");
        } finally {
            setManualSyncAction(null);
        }
    };

    const handleSyncRefresh = async () => {
        if (!isElectron || manualSyncAction) return;
        if (!navigator.onLine) {
            toast.error("Wi-Fi / internet connection is unavailable");
            return;
        }

        setManualSyncAction("pull");
        try {
            const result = await window.electronAPI.sync.pullNow();
            if (result?.success) {
                toast.success("Latest live data synced");
                // Refresh the current Electron view so every page reads the
                // newly imported SQLite data immediately.
                setTimeout(() => window.location.reload(), 500);
            } else {
                toast.error(result?.reason || result?.last_error || result?.error || "Sync refresh failed");
            }
        } catch (error) {
            toast.error(error?.message || "Sync refresh failed");
        } finally {
            setManualSyncAction(null);
        }
    };

    const handleQuickActionsPointerDown = (event) => {
        if (!quickActionsRef.current) return;
        quickActionsDrag.current = {
            active: true,
            startX: event.clientX,
            startScrollLeft: quickActionsRef.current.scrollLeft,
        };
        quickActionsRef.current.setPointerCapture(event.pointerId);
    };

    const handleQuickActionsPointerMove = (event) => {
        if (!quickActionsDrag.current.active || !quickActionsRef.current) return;
        quickActionsRef.current.scrollLeft =
            quickActionsDrag.current.startScrollLeft -
            (event.clientX - quickActionsDrag.current.startX);
    };

    const handleQuickActionsPointerUp = (event) => {
        quickActionsDrag.current.active = false;
        quickActionsRef.current?.releasePointerCapture(event.pointerId);
    };

    return (
        <header className="w-full h-16 bg-white flex items-center justify-between px-4 sm:px-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)] z-80">
            <div className="flex items-center gap-3">
                <img src={logo} alt="Logo" className="h-10 w-auto" />
                {onToggleSidebarExpand && (
                    <button
                        type="button"
                        onClick={onToggleSidebarExpand}
                        aria-label={isSidebarExpanded ? "Collapse sidebar" : "Expand sidebar"}
                        aria-pressed={isSidebarExpanded}
                        title={isSidebarExpanded ? "Collapse sidebar" : "Expand sidebar"}
                        className="hidden md:flex items-center justify-center w-9 h-9 rounded-lg border border-[#e0e6ed] bg-white text-[#4a5568] cursor-pointer transition-colors duration-200 hover:bg-[#f0f2f5] hover:text-[#2d1b4e]"
                    >
                        {isSidebarExpanded ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
                    </button>
                )}
            </div>

            <div className="flex min-w-0 items-center gap-2">
                {portal === "client" && (
                    <div
                        ref={quickActionsRef}
                        onPointerDown={handleQuickActionsPointerDown}
                        onPointerMove={handleQuickActionsPointerMove}
                        onPointerUp={handleQuickActionsPointerUp}
                        onPointerCancel={handleQuickActionsPointerUp}
                        className="flex max-w-[min(58vw,760px)] cursor-grab select-none items-center gap-1.5 overflow-x-auto py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden active:cursor-grabbing"
                    >
                        {quickActions.map(({ label, icon: Icon }) => (
                            <button
                                key={label}
                                type="button"
                                onClick={() => navigate('/admin-pos')}
                                title={label}
                                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-[#40295C]/15 bg-[#40295C]/5 px-2.5 py-2 text-[11px] font-semibold text-[#40295C] transition-colors hover:bg-[#40295C] hover:text-white"
                            >
                                <Icon size={14} />
                                {/* <span>{label}</span> */}
                            </button>
                        ))}
                    </div>
                )}


                {isElectron && portal === "client" && (
                    <div className="flex items-center gap-1.5">
                        <button
                            type="button"
                            onClick={handleUpdateRefresh}
                            disabled={Boolean(manualSyncAction)}
                            title="Update Refresh — Local to Live"
                            aria-label="Update Refresh — Local to Live"
                            className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#40295C]/20 bg-white text-[#40295C] transition hover:bg-[#40295C]/5 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <Upload
                                size={16}
                                className={manualSyncAction === "push" ? "animate-pulse" : ""}
                            />
                        </button>

                        <button
                            type="button"
                            onClick={handleSyncRefresh}
                            disabled={Boolean(manualSyncAction)}
                            title="Sync Refresh — Live to Local"
                            aria-label="Sync Refresh — Live to Local"
                            className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#40295C]/20 bg-white text-[#40295C] transition hover:bg-[#40295C]/5 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <RefreshCw
                                size={16}
                                className={manualSyncAction === "pull" ? "animate-spin" : ""}
                            />
                        </button>
                    </div>
                )}

                {shouldShowSubscriptionWarning && (
                    <div className="flex items-center gap-2 rounded-full border border-red-300 bg-red-500 px-3 py-1.5 text-[11px] font-bold text-white shadow-[0_0_18px_rgba(239,68,68,0.7)] animate-pulse max-w-[520px]">
                        <AlertTriangle size={14} className="shrink-0" />
                        <span className="leading-snug">
                            Subscription gonna expire on {formattedExpiryDate}. Contact us to renew.
                        </span>
                    </div>
                )}

                {portal === "client" && <button
                    className="flex items-center gap-2 rounded-lg border border-[#40295C]/20 bg-[#40295C] px-3 py-2 text-white shadow-[0_4px_12px_rgba(64,41,92,0.28)] transition hover:translate-y-[-1px] hover:shadow-[0_6px_16px_rgba(64,41,92,0.34)] cursor-pointer"
                    onClick={() => navigate('/admin-pos')}
                    aria-label="Open POS"
                    title="Open POS"
                >
                    <div className="flex gap-1">
                        <span className="block h-2.5 w-2.5 rounded-[2px] bg-white/90" />
                        <span className="block h-2.5 w-2.5 rounded-[2px] bg-white/70" />
                    </div>
                    <span className="text-sm font-bold tracking-wide">POS</span>
                </button>}

                <div className="relative" ref={accountRef}>
                    <button
                        className="flex items-center justify-center bg-transparent border-none cursor-pointer"
                        onClick={() => setAccountOpen((prev) => !prev)}
                        aria-haspopup="true"
                        aria-expanded={accountOpen}
                    >
                        <div
                            className="w-9 h-9 rounded-full text-white flex items-center justify-center font-bold"
                            style={{ backgroundColor: '#40295C' }}
                        >
                            <User size={18} strokeWidth={2.2} />
                        </div>
                    </button>

                    <div
                        className={`
                            absolute right-0 top-12 w-40 bg-white border border-[#e6e6ef]
                            shadow-[0_6px_18px_rgba(33,33,66,0.12)] rounded-lg py-2 z-200
                            ${accountOpen ? 'flex flex-col' : 'hidden'}
                        `}
                    >
                        <button
                            className="bg-transparent border-none px-4 py-2.5 text-left cursor-pointer text-[#333] hover:bg-[#f5f7fa]"
                            onClick={handleLogout}
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;