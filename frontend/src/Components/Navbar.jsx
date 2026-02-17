import { useEffect, useMemo, useState } from "react";
import {
    ShoppingCart,
    Search,
    Menu,
    X,
    ChevronDown,
    Sparkles,
} from "lucide-react";
import { useCart } from "../Context/CartContext";
import { useAuth } from "../Context/AuthContext";
import { Link, useLocation, useNavigate } from "react-router-dom";

const categories = [
    "Electronics",
    "Fashion",
    "Home & Kitchen",
    "Beauty & Health",
    "Sports & Fitness",
];

const Navbar = () => {
    const [desktopOpen, setDesktopOpen] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [mobileCategoryOpen, setMobileCategoryOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [search, setSearch] = useState("");

    const { cart } = useCart();
    const { user, loading } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 10);
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const cartCount = useMemo(
        () => cart.reduce((total, item) => total + item.qty, 0),
        [cart]
    );

    const handleSearchSubmit = (event) => {
        event.preventDefault();
        const query = search.trim();

        if (!query) {
            navigate("/shop");
            return;
        }

        navigate(`/shop?search=${encodeURIComponent(query)}`);
        setMobileOpen(false);
    };

    const goToCategory = (category) => {
        navigate(`/shop?category=${encodeURIComponent(category)}`);
        setDesktopOpen(false);
        setMobileOpen(false);
    };

    const isHome = location.pathname === "/";

    return (
        <nav className="sticky top-0 z-50 w-full">
            <div className="bg-slate-900 text-slate-100">
                <div className="mx-auto flex h-9 max-w-7xl items-center justify-center px-4 text-xs font-medium tracking-wide">
                    <Sparkles className="mr-2 h-3.5 w-3.5 text-amber-300" />
                    Premium drops now live. Free shipping on orders above INR 999.
                </div>
            </div>

            <div
                className={`w-full border-b transition-all duration-300 ${
                    scrolled
                        ? "border-white/20 bg-slate-950/85 shadow-xl shadow-slate-900/20 backdrop-blur-xl"
                        : "border-slate-200 bg-white"
                }`}
            >
                <div className="mx-auto max-w-7xl px-4">
                    <div className="flex h-16 items-center justify-between gap-4">
                        <button
                            className={`md:hidden ${
                                scrolled ? "text-slate-100" : "text-slate-900"
                            }`}
                            onClick={() => setMobileOpen(!mobileOpen)}
                        >
                            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                        </button>

                        <Link
                            to="/"
                            className={`text-2xl font-black tracking-tight ${
                                scrolled ? "text-white" : "text-slate-900"
                            }`}
                        >
                            Luxe<span className="text-amber-500">Cart</span>
                        </Link>

                        <ul
                            className={`hidden md:flex items-center gap-6 text-sm font-medium ${
                                scrolled ? "text-slate-200" : "text-slate-700"
                            }`}
                        >
                            <li>
                                <Link
                                    to="/"
                                    className={`hover:text-amber-500 ${
                                        isHome ? "text-amber-500" : ""
                                    }`}
                                >
                                    Home
                                </Link>
                            </li>
                            <li>
                                <Link to="/shop" className="hover:text-amber-500">
                                    Shop
                                </Link>
                            </li>
                            <li
                                className="relative"
                                onMouseEnter={() => setDesktopOpen(true)}
                                onMouseLeave={() => setDesktopOpen(false)}
                            >
                                <button className="flex items-center gap-1 hover:text-amber-500">
                                    Categories <ChevronDown className="h-4 w-4" />
                                </button>

                                {desktopOpen && (
                                    <div className="absolute left-0 top-10 w-56 rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
                                        {categories.map((item) => (
                                            <button
                                                key={item}
                                                className="w-full rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100 hover:text-amber-600"
                                                onClick={() => goToCategory(item)}
                                            >
                                                {item}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </li>
                            <li>
                                <Link to="/#bestselling" className="hover:text-amber-500">
                                    Bestselling
                                </Link>
                            </li>
                        </ul>

                        <form
                            onSubmit={handleSearchSubmit}
                            className="hidden flex-1 justify-center px-2 md:flex"
                        >
                            <div className="relative w-full max-w-md">
                                <Search className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search premium products..."
                                    className={`w-full rounded-full border py-2 pl-10 pr-4 text-sm outline-none transition ${
                                        scrolled
                                            ? "border-slate-700 bg-slate-900/70 text-white placeholder:text-slate-400 focus:border-amber-500"
                                            : "border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:border-amber-500"
                                    }`}
                                />
                            </div>
                        </form>

                        <div
                            className={`flex items-center gap-4 ${
                                scrolled ? "text-slate-100" : "text-slate-900"
                            }`}
                        >
                            <Link to="/cart" className="relative cursor-pointer">
                                <ShoppingCart className="h-6 w-6 hover:text-amber-500" />
                                <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-xs font-semibold text-slate-900">
                                    {cartCount}
                                </span>
                            </Link>

                            {!loading && !user && (
                                <Link
                                    to="/login"
                                    className={`hidden rounded-full px-5 py-2 text-sm font-semibold sm:block ${
                                        scrolled
                                            ? "bg-amber-500 text-slate-900 hover:bg-amber-400"
                                            : "bg-slate-900 text-white hover:bg-slate-800"
                                    }`}
                                >
                                    Login
                                </Link>
                            )}

                            {!loading && user && (
                                <Link to="/profile" className="hidden sm:block">
                                    <img
                                        src={user.avatar || "https://via.placeholder.com/80"}
                                        alt={user.name || "Profile"}
                                        className="h-9 w-9 rounded-full border border-white/40 object-cover"
                                    />
                                </Link>
                            )}
                        </div>
                    </div>
                </div>

                {mobileOpen && (
                    <div className="border-t border-slate-200 bg-white md:hidden">
                        <div className="space-y-4 px-4 py-4">
                            {!loading && user && (
                                <Link
                                    to="/profile"
                                    onClick={() => setMobileOpen(false)}
                                    className="flex items-center gap-4 border-b border-slate-200 pb-4"
                                >
                                    <img
                                        src={user.avatar || "https://via.placeholder.com/80"}
                                        alt={user.name || "Profile"}
                                        className="h-12 w-12 rounded-full object-cover"
                                    />
                                    <div>
                                        <p className="font-semibold text-slate-900">
                                            {user.name}
                                        </p>
                                        <p className="text-sm text-slate-500">View profile</p>
                                    </div>
                                </Link>
                            )}

                            <form onSubmit={handleSearchSubmit} className="relative">
                                <Search className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search products..."
                                    className="w-full rounded-xl border border-slate-300 py-2 pl-10 pr-4 text-sm outline-none focus:border-amber-500"
                                />
                            </form>

                            <div className="flex items-center gap-3">
                                <Link
                                    to="/"
                                    onClick={() => setMobileOpen(false)}
                                    className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700"
                                >
                                    Home
                                </Link>
                                <Link
                                    to="/shop"
                                    onClick={() => setMobileOpen(false)}
                                    className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700"
                                >
                                    Shop
                                </Link>
                            </div>

                            <div>
                                <button
                                    className="flex w-full items-center justify-between text-sm font-semibold text-slate-900"
                                    onClick={() => setMobileCategoryOpen(!mobileCategoryOpen)}
                                >
                                    Categories
                                    <ChevronDown
                                        className={`h-4 w-4 transition ${
                                            mobileCategoryOpen ? "rotate-180" : ""
                                        }`}
                                    />
                                </button>

                                {mobileCategoryOpen && (
                                    <div className="mt-2 space-y-1 rounded-lg bg-slate-50 p-2">
                                        {categories.map((item) => (
                                            <button
                                                key={item}
                                                className="w-full rounded-md px-3 py-2 text-left text-sm text-slate-700 hover:bg-white hover:text-amber-600"
                                                onClick={() => goToCategory(item)}
                                            >
                                                {item}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {!loading && !user && (
                                <Link
                                    to="/login"
                                    onClick={() => setMobileOpen(false)}
                                    className="block w-full rounded-lg bg-slate-900 px-5 py-2 text-center text-sm font-semibold text-white"
                                >
                                    Login
                                </Link>
                            )}

                            <Link
                                to="/cart"
                                onClick={() => setMobileOpen(false)}
                                className="block text-sm font-medium text-slate-700 hover:text-amber-600"
                            >
                                Cart ({cartCount})
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
