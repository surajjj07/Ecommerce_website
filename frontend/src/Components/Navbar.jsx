import { useEffect, useState } from "react";
import {
    ShoppingCart,
    Search,
    Menu,
    X,
    ChevronDown,
} from "lucide-react";
import { useCart } from "../Context/CartContext";
import { useAuth } from "../Context/AuthContext";
import { Link } from "react-router-dom";

const Navbar = () => {
    const [desktopOpen, setDesktopOpen] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [mobileCategoryOpen, setMobileCategoryOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    const { cart } = useCart();
    const { user, loading } = useAuth();

    // Scroll detection
    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 10);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <nav
            className={`sticky top-0 z-50 w-full transition-all duration-300
        ${scrolled
                    ? "bg-white/70 backdrop-blur-lg border-b shadow-sm"
                    : "bg-white border-b"
                }
      `}
        >
            <div className="max-w-7xl mx-auto px-4">
                <div className="flex items-center justify-between h-16">

                    {/* Left */}
                    <div className="flex items-center gap-6">
                        <button
                            className="md:hidden"
                            onClick={() => setMobileOpen(!mobileOpen)}
                        >
                            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                        </button>

                        <h1 className="text-2xl font-bold text-gray-900">
                            Shop<span className="text-indigo-600">X</span>
                        </h1>

                        {/* Desktop Nav */}
                        <ul className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-700">
                            <li
                                className="relative"
                                onMouseEnter={() => setDesktopOpen(true)}
                                onMouseLeave={() => setDesktopOpen(false)}
                            >
                                <button className="flex items-center gap-1 hover:text-indigo-600">
                                    Categories <ChevronDown className="h-4 w-4" />
                                </button>

                                {desktopOpen && (
                                    <div className="absolute top-10 left-0 w-52 bg-white rounded-lg border shadow-lg py-2">
                                        {[
                                            "Electronics",
                                            "Fashion",
                                            "Home & Kitchen",
                                            "Beauty & Health",
                                            "Sports & Fitness",
                                        ].map((item) => (
                                            <div
                                                key={item}
                                                className="px-4 py-2 text-sm hover:bg-indigo-50 hover:text-indigo-600 cursor-pointer"
                                            >
                                                {item}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </li>

                            <li className="cursor-pointer hover:text-indigo-600">
                                Bestselling
                            </li>
                        </ul>
                    </div>

                    {/* Search */}
                    <div className="hidden md:flex flex-1 justify-center px-6">
                        <div className="relative w-full max-w-md">
                            <input
                                type="text"
                                placeholder="Search products..."
                                className="w-full rounded-full border border-gray-300 py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                        </div>
                    </div>

                    {/* Right */}
                    <div className="flex items-center gap-6">
                        {/* Cart */}
                        <div className="relative cursor-pointer">
                            <Link to="/cart">
                                <ShoppingCart className="h-6 w-6 hover:text-indigo-600" />
                                <span className="absolute -top-2 -right-2 bg-indigo-600 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                                    {cart.reduce((total, item) => total + item.qty, 0)}
                                </span>
                            </Link>
                        </div>

                        {/* ✅ Auth Area (Desktop) */}
                        {!loading && !user && (
                            <Link
                                to="/login"
                                className="hidden sm:block px-5 py-2 rounded-full text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700"
                            >
                                Login
                            </Link>
                        )}

                        {!loading && user && (
                            <Link to="/profile" className="hidden sm:block">
                                <img
                                    src={user.avatar}
                                    alt={user.name}
                                    className="w-9 h-9 rounded-full object-cover border"
                                />
                            </Link>
                        )}
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {mobileOpen && (
                <div className="md:hidden border-t bg-white/90 backdrop-blur-lg shadow-lg">
                    <div className="px-4 py-4 space-y-4">

                        {/* ✅ User Info (Mobile) */}
                        {!loading && user && (
                            <div className="flex items-center gap-4 pb-4 border-b">
                                <img
                                    src={user.avatar}
                                    alt={user.name}
                                    className="w-12 h-12 rounded-full object-cover"
                                />
                                <div>
                                    <p className="font-semibold text-gray-900">{user.name}</p>
                                    <p className="text-sm text-gray-500">View Profile</p>
                                </div>
                            </div>
                        )}

                        {/* Search */}
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search products..."
                                className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                        </div>

                        {/* Categories */}
                        <div>
                            <button
                                className="flex items-center justify-between w-full text-sm font-medium"
                                onClick={() => setMobileCategoryOpen(!mobileCategoryOpen)}
                            >
                                Categories
                                <ChevronDown
                                    className={`h-4 w-4 transition ${mobileCategoryOpen ? "rotate-180" : ""
                                        }`}
                                />
                            </button>

                            {mobileCategoryOpen && (
                                <div className="mt-2 pl-4 space-y-2 text-sm text-gray-600">
                                    {[
                                        "Electronics",
                                        "Fashion",
                                        "Home & Kitchen",
                                        "Beauty & Health",
                                        "Sports & Fitness",
                                    ].map((item) => (
                                        <div
                                            key={item}
                                            className="py-1 cursor-pointer hover:text-indigo-600"
                                        >
                                            {item}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="text-sm font-medium cursor-pointer hover:text-indigo-600">
                            Bestselling
                        </div>

                        {/* ✅ Auth Area (Mobile) */}
                        {!loading && !user && (
                            <Link
                                to="/login"
                                className="block w-full mt-4 px-5 py-2 rounded-lg text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 text-center"
                            >
                                Login
                            </Link>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
