import { useNavigate, useLocation } from 'react-router-dom';
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

const Sidebar = ({ isOpen, isMobile, closeSidebar }) => {
    const navigate = useNavigate();
    const location = useLocation();

    const { role, portal } = useAuth();

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
                    fixed top-0 left-0 h-screen w-62.5 bg-white flex flex-col p-0 items-stretch
                    z-90 shadow-[2px_0_8px_rgba(0,0,0,0.15)] transition-transform duration-300
                    md:static md:h-auto md:w-19 md:items-center md:py-4
                    md:shadow-[1px_0_3px_rgba(0,0,0,0.06)] md:translate-x-0
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

                <nav className="flex-1 overflow-visible py-2 w-full">
                    <ul className="list-none m-0 p-0 w-full flex flex-col items-stretch gap-0 md:items-center md:gap-2.5">
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
                                                md:w-11 md:h-10 md:justify-center md:rounded-xl md:gap-0
                                                md:px-0 md:py-0 md:text-base md:font-normal
                                                ${active
                                                    ? 'text-white'
                                                    : 'text-[#4a5568] hover:bg-[#f0f2f5] hover:text-[#2d1b4e]'}
                                            `}
                                            style={active ? { backgroundColor: '#40295C' } : undefined}
                                            onClick={() => handleNavigation(item.path)}
                                            aria-label={item.label}
                                        >
                                            <span className="text-xl flex items-center justify-center">
                                                <Icon size={20} />
                                            </span>
                                            {item.hasNotification && (
                                                <span className="absolute top-1 right-1.5 w-2 h-2 rounded-full bg-[#e53e3e] border-[1.5px] border-white" />
                                            )}
                                            <span className="block md:hidden">{item.label}</span>
                                            <span className="hidden md:block absolute left-full top-1/2 -translate-y-1/2 whitespace-nowrap bg-[#1f1a44] text-white px-[0.9rem] py-[0.35rem] rounded-full text-xs font-semibold tracking-wide opacity-0 pointer-events-none transition-all duration-200 ml-[0.6rem] z-150 group-hover:opacity-100 group-hover:translate-x-1">
                                                {item.label.toUpperCase()}
                                            </span>
                                        </button>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                </nav>
            </aside>
        </>
    );
};

export default Sidebar;