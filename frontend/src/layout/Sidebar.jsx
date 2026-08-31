import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useRef } from 'react';
import { useAuth } from '../context/authContext';
import {
    LayoutDashboard,
    BarChart3,
    List,
    UserPlus,
    Users,
    CalendarPlus2,
    MapPin,
    IdCardLanyard,
    ChartBarStacked,
    ListSortAscending,
    Ruler,
    ShoppingBasket,
    BadgeDollarSign,
    Printer,
    HandPlatter,
    UserRound
} from "lucide-react";

const SUPER_ADMIN_NAVIGATION = [
    {
        id: "dashboard",
        label: "Dashboard",
        path: "/dashboard",
        icon: LayoutDashboard,
    },
    {
        id: "features list",
        label: "Features List",
        path: "/features",
        icon: List,
    },
    {
        id: "subscriptions",
        label: "Subscriptions List",
        path: "/subscription",
        icon: CalendarPlus2,
    },
    {
        id: "clients",
        label: "Clients List",
        path: "/clients",
        icon: Users,
    },
    {
        id: "client subcriptions",
        label: "Clients Subscriptions",
        path: "/client-subscriptions",
        icon: UserPlus,
    }
];

const ADMIN_NAVIGATION = [
    {
        id: "dashboard",
        label: "Dashboard",
        path: "/admin-dashboard",
        icon: LayoutDashboard,
        roles: ["admin", "manager", "cashier", "waiter"],
    },
    {
        id: "business locations",
        label: "Business Locations",
        path: "/admin-locations",
        icon: MapPin,
        roles: ["admin"],
    },
    {
        id: "employees",
        label: "Employees",
        path: "/admin-employees",
        icon: IdCardLanyard,
        roles: ["admin"],
    },
    {
        id: "categories",
        label: "Categories",
        path: "/admin-categories",
        icon: ChartBarStacked,
        roles: ["admin", "manager", "cashier", "waiter"],
    },
    {
        id: "subcategories",
        label: "Sub Categories",
        path: "/admin-subcategories",
        icon: ListSortAscending,
        roles: ["admin", "manager", "cashier", "waiter"],
    },
    {
        id: "unit-types",
        label: "Unit Types",
        path: "/admin-unit-types",
        icon: Ruler,
        roles: ["admin", "manager", "cashier", "waiter"],
    },
    {
        id: "products",
        label: "Products",
        path: "/admin-product",
        icon: ShoppingBasket,
        roles: ["admin", "manager", "cashier", "waiter"],
    },
    {
        id: "tables",
        label: "Tables",
        path: "/admin-table",
        icon: HandPlatter,
        roles: ["admin", "manager", "cashier", "waiter"],
    },
    {
        id: "customers",
        label: "Customers",
        path: "/admin-customers",
        icon: UserRound,
        roles: ["admin", "manager", "cashier", "waiter"],
    },
    {
        id: "pos",
        label: "Pos",
        path: "/admin-pos",
        icon: BadgeDollarSign,
        roles: ["admin", "manager", "cashier", "waiter"],
    },
    {
        id: "sales",
        label: "Sales",
        path: "/admin-sales",
        icon: BarChart3,
        roles: ["admin", "manager", "cashier", "waiter"],
    },
    {
        id: "kot printer settings",
        label: "KOT Printer Settings",
        path: "/admin-kot-settings",
        icon: Printer,
        roles: ["admin", "manager", "cashier", "waiter"],
    },
    // {
    //     id: "static-pos",
    //     label: "Static POS",
    //     path: "/static-pos",
    //     icon: Printer,
    //     roles: ["admin", "manager", "cashier", "waiter"],
    // }
];

const Sidebar = ({ isOpen, isMobile, closeSidebar, isExpanded = false }) => {
    const navigate = useNavigate();
    const location = useLocation();

    const { role, portal } = useAuth();
    const [hoveredItem, setHoveredItem] = useState(null);
    const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });
    const hideTimeout = useRef(null);

    const navigationItems =
        portal === "admin"
            ? SUPER_ADMIN_NAVIGATION
            : ADMIN_NAVIGATION.filter((item) =>
                item.roles.includes(role)
            );

    const handleNavigation = (path) => {
        if (path) {
            navigate(path);
            closeSidebar();
        }
    };

    const isActive = (path) => location.pathname === path;

    const handleMouseEnter = (e, itemId) => {
        if (isExpanded) return;
        if (hideTimeout.current) {
            clearTimeout(hideTimeout.current);
            hideTimeout.current = null;
        }
        const rect = e.currentTarget.getBoundingClientRect();
        setTooltipPos({
            top: rect.top + rect.height / 2,
            left: rect.right + 10,
        });
        setHoveredItem(itemId);
    };

    const handleMouseLeave = () => {
        hideTimeout.current = setTimeout(() => setHoveredItem(null), 50);
    };

    const hoveredLabel = navigationItems.find((item) => item.id === hoveredItem)?.label;

    return (
        <>
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-85 md:hidden"
                    onClick={closeSidebar}
                />
            )}

            <aside
                className={`
                    fixed top-0 left-0 h-screen w-62.5 bg-white flex flex-col p-0 items-stretch min-h-0
                    z-90 shadow-[2px_0_8px_rgba(0,0,0,0.15)] transition-[width,transform] duration-300
                    md:static md:h-auto md:min-h-0 md:py-4
                    md:shadow-[1px_0_3px_rgba(0,0,0,0.06)] md:translate-x-0
                    ${isExpanded ? 'md:w-56 md:items-stretch' : 'md:w-19 md:items-center'}
                    ${isMobile && isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
                `}
            >
                <div className="flex justify-end p-4 md:hidden">
                    <button
                        className="bg-transparent border-none text-2xl text-[#666] cursor-pointer p-0 transition-colors duration-200 hover:text-[#2d1b4e]"
                        onClick={closeSidebar}
                        aria-label="Close sidebar"
                    >
                        ✕
                    </button>
                </div>

                <nav
                    className="flex-1 min-h-0 overflow-y-auto overflow-x-visible py-2 w-full scrollbar-hide"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    <ul className={`list-none m-0 p-0 w-full flex flex-col items-stretch gap-0 ${isExpanded ? 'md:items-stretch md:gap-1 md:px-3' : 'md:items-center md:gap-2.5'}`}>
                        {navigationItems.map((item) => {
                            const Icon = item.icon;
                            const active = isActive(item.path);

                            return (
                                <li key={item.id} className="w-full flex justify-center">
                                    <div className="flex items-center justify-center w-full">
                                        <button
                                            className={`
                                                group relative w-full h-auto flex items-center justify-start
                                                bg-transparent border-none cursor-pointer rounded-none
                                                gap-3 px-5 py-3.5 text-[0.95rem] font-medium
                                                transition-colors duration-200
                                                ${isExpanded
                                                    ? 'md:w-full md:h-10 md:justify-start md:rounded-lg md:gap-3 md:px-3 md:py-0 md:text-sm md:font-medium'
                                                    : 'md:w-11 md:h-10 md:justify-center md:rounded-xl md:gap-0 md:px-0 md:py-0 md:text-base md:font-normal'}
                                                ${active
                                                    ? 'text-white'
                                                    : 'text-[#4a5568] hover:bg-[#f0f2f5] hover:text-[#2d1b4e]'}
                                            `}
                                            style={active ? { backgroundColor: '#40295C' } : undefined}
                                            onClick={() => handleNavigation(item.path)}
                                            onMouseEnter={(e) => handleMouseEnter(e, item.id)}
                                            onMouseLeave={handleMouseLeave}
                                            aria-label={item.label}
                                        >
                                            <span className="text-xl flex items-center justify-center shrink-0">
                                                <Icon size={20} />
                                            </span>
                                            {item.hasNotification && (
                                                <span className="absolute top-1 right-1.5 w-2 h-2 rounded-full bg-[#e53e3e] border-[1.5px] border-white" />
                                            )}
                                            <span className={`block whitespace-nowrap ${isExpanded ? '' : 'md:hidden'}`}>
                                                {item.label}
                                            </span>
                                        </button>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                </nav>
            </aside>

            {hoveredLabel && (
                <span
                    className="hidden md:block fixed bg-[#1f1a44] text-white px-[0.9rem] py-[0.35rem] rounded-full text-xs font-semibold tracking-wide whitespace-nowrap pointer-events-none z-150"
                    style={{
                        top: tooltipPos.top,
                        left: tooltipPos.left,
                        transform: 'translateY(-50%)',
                    }}
                >
                    {hoveredLabel.toUpperCase()}
                </span>
            )}
        </>
    );
};

export default Sidebar;