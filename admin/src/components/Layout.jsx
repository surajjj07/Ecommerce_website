import { useContext, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
    LayoutDashboard,
    Package,
    ShoppingCart,
    Settings,
    UserCircle2,
    LogOut,
    Menu,
    X,
} from "lucide-react";
import AuthContext from "../context/CreateAuthContext";
import { adminApi } from "../services/api";

export default function Layout() {
    const navigate = useNavigate();
    const { admin, setAdmin } = useContext(AuthContext);
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    const navItems = [
        { name: "Dashboard", icon: LayoutDashboard, path: "/" },
        { name: "Add Products", icon: Package, path: "/add-product" },
        { name: "Orders", icon: ShoppingCart, path: "/orders" },
        { name: "Profile", icon: UserCircle2, path: "/profile" },
        { name: "Settings", icon: Settings, path: "/settings" },
    ];

    const handleLogout = async () => {
        try {
            await adminApi.logout();
        } catch {
            // Clear local auth state even if API fails.
        } finally {
            setAdmin(null);
            navigate("/login", { replace: true });
        }
    };

    return (
        <div className="flex h-screen bg-slate-100 overflow-hidden">
            {/* Mobile Overlay */}
            {mobileOpen && (
                <div
                    onClick={() => setMobileOpen(false)}
                    className="fixed inset-0 bg-black/40 z-40 lg:hidden"
                />
            )}

            {/* Sidebar */}
            <aside
                className={`
          fixed lg:static z-50
          h-full bg-slate-900 text-slate-200
          transition-all duration-300 flex flex-col
          ${collapsed ? "w-20" : "w-64"}
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0
        `}
            >
                {/* Logo */}
                <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800">
                    <span className="font-bold text-lg">
                        {!collapsed && "Admin Panel"}
                    </span>

                    {/* Desktop collapse */}
                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        className="hidden lg:block text-slate-400 hover:text-white"
                    >
                        <Menu size={20} />
                    </button>

                    {/* Mobile close */}
                    <button
                        onClick={() => setMobileOpen(false)}
                        className="lg:hidden text-slate-400 hover:text-white"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Nav */}
                <nav className="flex-1 py-4">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        return (
                            <NavLink
                                key={item.name}
                                to={item.path}
                                onClick={() => setMobileOpen(false)}
                                end
                                className={({ isActive }) =>
                                    `flex items-center gap-3 px-4 py-3 mx-2 rounded-lg text-sm font-medium transition
                  ${isActive
                                        ? "bg-indigo-600 text-white"
                                        : "text-slate-400 hover:bg-slate-800 hover:text-white"
                                    }`
                                }
                            >
                                <Icon size={18} />
                                {!collapsed && item.name}
                            </NavLink>
                        );
                    })}
                </nav>

                {/* Logout */}
                <div className="p-4 border-t border-slate-800">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 text-slate-400 hover:text-white text-sm"
                    >
                        <LogOut size={18} />
                        {!collapsed && "Logout"}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col lg:ml-0">
                {/* Topbar */}
                <header className="h-16 bg-white border-b flex items-center justify-between px-4 lg:px-6">
                    <div className="flex items-center gap-3">
                        {/* Mobile menu */}
                        <button
                            onClick={() => setMobileOpen(true)}
                            className="lg:hidden text-slate-600"
                        >
                            <Menu size={22} />
                        </button>

                        <h1 className="text-lg lg:text-xl font-semibold text-slate-800">
                            Admin Dashboard
                        </h1>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-medium text-slate-700">
                                {admin?.name || "Admin User"}
                            </p>
                            <p className="text-xs text-slate-400">
                                {admin?.email || "admin@example.com"}
                            </p>
                        </div>
                        {admin?.profilePic ? (
                            <img
                                src={admin.profilePic}
                                alt="profile"
                                className="w-9 h-9 rounded-full object-cover"
                            />
                        ) : (
                            <div className="w-9 h-9 rounded-full bg-slate-900 text-white flex items-center justify-center text-sm font-semibold">
                                {String(admin?.name || "A").trim().slice(0, 1).toUpperCase()}
                            </div>
                        )}
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto p-4 lg:p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
