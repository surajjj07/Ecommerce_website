import {
    Facebook,
    Instagram,
    Twitter,
    Youtube,
    Mail,
    Phone,
    MapPin,
} from "lucide-react";
import { Link } from "react-router-dom";

import visa from "../assets/payments/visa.png";
import upi from "../assets/payments/upi.png";
import paytm from "../assets/payments/paytm.png";
import { useCategories } from "../Context/CategoryContext";

const supportLinks = [
    { label: "Contact Us", to: "/contact" },
    { label: "FAQs", to: "/faqs" },
    { label: "Shipping", to: "/shipping" },
    { label: "Returns", to: "/returns" },
    { label: "Track Order", to: "/orders" },
];

const socialLinks = [
    { icon: Facebook, label: "Facebook", to: "/contact" },
    { icon: Instagram, label: "Instagram", to: "/contact" },
    { icon: Twitter, label: "Twitter", to: "/contact" },
    { icon: Youtube, label: "YouTube", to: "/contact" },
];

const Footer = () => {
    const { categories } = useCategories();
    const shopLinks = [
        ...categories.slice(0, 4).map((category) => ({
            label: category,
            to: `/shop?category=${encodeURIComponent(category)}`,
        })),
        { label: "New Arrivals", to: "/shop" },
    ];

    return (
        <footer className="relative overflow-hidden bg-transparent">
            <div className="pointer-events-none absolute -left-16 top-0 h-64 w-64 rounded-full bg-amber-500/10 blur-[100px]" />
            <div className="pointer-events-none absolute -right-16 bottom-0 h-72 w-72 rounded-full bg-cyan-500/10 blur-[110px]" />

            <div className="relative mx-auto max-w-7xl px-6 py-10">
                <div className="mb-8 hidden grid-cols-4 gap-10 md:grid">
                    <div>
                        <h2 className="text-xl font-bold text-white">
                            Luxe<span className="text-amber-400">Cart</span>
                        </h2>
                        <p className="mt-3 text-sm text-slate-300">
                            Premium products with fast delivery and trusted quality.
                        </p>

                        <div className="mt-4 flex items-center gap-3">
                            {socialLinks.map(({ icon, label, to }) => {
                                const SocialIcon = icon;
                                return (
                                    <Link
                                        key={label}
                                        to={to}
                                        aria-label={label}
                                        className="rounded-full border border-white/10 bg-white/5 p-2 text-slate-200 transition hover:border-amber-300/50 hover:text-amber-300"
                                    >
                                        <SocialIcon className="h-4 w-4" />
                                    </Link>
                                );
                            })}
                        </div>
                    </div>

                    <div>
                        <h3 className="mb-3 text-sm font-semibold text-white">Shop</h3>
                        <ul className="space-y-2 text-sm text-slate-300">
                            {shopLinks.map((item) => (
                                <li key={item.label}>
                                    <Link
                                        to={item.to}
                                        className="transition hover:text-amber-300"
                                    >
                                        {item.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h3 className="mb-3 text-sm font-semibold text-white">Support</h3>
                        <ul className="space-y-2 text-sm text-slate-300">
                            {supportLinks.map((item) => (
                                <li key={item.label}>
                                    <Link
                                        to={item.to}
                                        className="transition hover:text-amber-300"
                                    >
                                        {item.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h3 className="mb-3 text-sm font-semibold text-white">Contact</h3>
                        <ul className="space-y-3 text-sm text-slate-300">
                            <li className="flex items-center gap-2">
                                <Mail className="h-4 w-4 text-amber-300" />
                                <a href="mailto:support@luxecart.com" className="hover:text-amber-300">
                                    support@luxecart.com
                                </a>
                            </li>
                            <li className="flex items-center gap-2">
                                <Phone className="h-4 w-4 text-amber-300" />
                                <a href="tel:+919876543210" className="hover:text-amber-300">
                                    +91 98765 43210
                                </a>
                            </li>
                            <li className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-amber-300" />
                                <Link to="/contact" className="hover:text-amber-300">
                                    Mumbai, India
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="hidden items-center justify-between border-t border-white/10 pt-4 text-xs text-slate-400 md:flex">
                    <span>Copyright {new Date().getFullYear()} LuxeCart</span>

                    <div className="flex items-center gap-4">
                        <Link to="/shipping" className="hover:text-amber-300">
                            Fast Delivery
                        </Link>
                        <Link to="/returns" className="hover:text-amber-300">
                            Easy Returns
                        </Link>
                        <Link to="/terms" className="hover:text-amber-300">
                            Terms & Conditions
                        </Link>
                    </div>

                    <div className="flex items-center gap-3">
                        <img src={visa} alt="Visa" className="h-5 opacity-80" />
                        <img src={upi} alt="UPI" className="h-5 opacity-80" />
                        <img src={paytm} alt="Paytm" className="h-5 opacity-80" />
                    </div>
                </div>

                <div className="mt-6 border-t border-white/10 pb-5 pt-4 md:hidden">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-white">
                            Luxe<span className="text-amber-400">Cart</span>
                        </span>

                        <Link to="/shipping" className="text-[10px] text-slate-300 hover:text-amber-300">
                            Secure Checkout | Fast Delivery
                        </Link>

                        <div className="flex items-center gap-2">
                            <img src={visa} alt="Visa" className="h-3 opacity-80" />
                            <img src={upi} alt="UPI" className="h-3 opacity-80" />
                            <img src={paytm} alt="Paytm" className="h-3 opacity-80" />
                        </div>
                    </div>

                    <p className="mt-3 text-[10px] leading-relaxed text-slate-300">
                        LuxeCart offers premium quality products with quick delivery, easy returns,
                        and reliable customer support across India.
                    </p>

                    <p className="mt-2 text-[10px] text-slate-400">
                        Need help?{" "}
                        <Link to="/contact" className="hover:text-amber-300">
                            Contact support
                        </Link>{" "}
                        or{" "}
                        <Link to="/faqs" className="hover:text-amber-300">
                            visit FAQs
                        </Link>
                        .
                    </p>

                    <div className="mt-3 flex items-center justify-between text-[9px] text-slate-500">
                        <span>Copyright {new Date().getFullYear()} LuxeCart</span>
                        <Link to="/terms" className="hover:text-amber-300">
                            Terms and Conditions
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
