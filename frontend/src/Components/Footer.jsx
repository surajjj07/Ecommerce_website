import {
    Facebook,
    Instagram,
    Twitter,
    Youtube,
    Mail,
    Phone,
    MapPin,
} from "lucide-react";

import visa from "../assets/payments/visa.png";
import upi from "../assets/payments/upi.png";
import paytm from "../assets/payments/paytm.png";

const Footer = () => {
    return (
        <footer className="relative overflow-hidden bg-transparent">
            <div className="pointer-events-none absolute -left-16 top-0 h-64 w-64 rounded-full bg-amber-500/10 blur-[100px]" />
            <div className="pointer-events-none absolute -right-16 bottom-0 h-72 w-72 rounded-full bg-cyan-500/10 blur-[110px]" />

            <div className="relative mx-auto max-w-7xl px-6 py-10">
                <div className="mb-8 hidden grid-cols-4 gap-10 md:grid">
                    <div>
                        <h2 className="text-xl font-bold text-white">
                            Shop<span className="text-amber-400">X</span>
                        </h2>
                        <p className="mt-3 text-sm text-slate-300">
                            Premium products with fast delivery and trusted quality.
                        </p>

                        <div className="mt-4 flex items-center gap-3">
                            {[Facebook, Instagram, Twitter, Youtube].map((Icon, i) => (
                                <a
                                    key={i}
                                    className="rounded-full border border-white/10 bg-white/5 p-2 text-slate-200 transition hover:border-amber-300/50 hover:text-amber-300"
                                >
                                    <Icon className="h-4 w-4" />
                                </a>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h3 className="mb-3 text-sm font-semibold text-white">Shop</h3>
                        <ul className="space-y-2 text-sm text-slate-300">
                            {["Men", "Women", "Electronics", "Accessories", "New Arrivals"].map(
                                (item) => (
                                    <li
                                        key={item}
                                        className="cursor-pointer transition hover:text-amber-300"
                                    >
                                        {item}
                                    </li>
                                )
                            )}
                        </ul>
                    </div>

                    <div>
                        <h3 className="mb-3 text-sm font-semibold text-white">Support</h3>
                        <ul className="space-y-2 text-sm text-slate-300">
                            {["Contact Us", "FAQs", "Shipping", "Returns", "Track Order"].map(
                                (item) => (
                                    <li
                                        key={item}
                                        className="cursor-pointer transition hover:text-amber-300"
                                    >
                                        {item}
                                    </li>
                                )
                            )}
                        </ul>
                    </div>

                    <div>
                        <h3 className="mb-3 text-sm font-semibold text-white">Contact</h3>
                        <ul className="space-y-3 text-sm text-slate-300">
                            <li className="flex items-center gap-2">
                                <Mail className="h-4 w-4 text-amber-300" />
                                support@shopx.com
                            </li>
                            <li className="flex items-center gap-2">
                                <Phone className="h-4 w-4 text-amber-300" />
                                +91 98765 43210
                            </li>
                            <li className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-amber-300" />
                                India
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="hidden items-center justify-between border-t border-white/10 pt-4 text-xs text-slate-400 md:flex">
                    <span>Copyright {new Date().getFullYear()} ShopX</span>

                    <div className="flex items-center gap-4">
                        <span>Secure Payments</span>
                        <span>Fast Delivery</span>
                        <span>Easy Returns</span>
                    </div>

                    <div className="flex items-center gap-3">
                        <img src={visa} alt="Visa" className="h-5 opacity-80" />
                        <img src={upi} alt="UPI" className="h-5 opacity-80" />
                        <img src={paytm} alt="Paytm" className="h-5 opacity-80" />
                    </div>
                </div>

                <div className="mt-6 border-t border-white/10 pt-4 pb-5 md:hidden">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-white">
                            Shop<span className="text-amber-400">X</span>
                        </span>

                        <span className="text-[10px] text-slate-300">
                            Secure Checkout | Fast Delivery
                        </span>

                        <div className="flex items-center gap-2">
                            <img src={visa} alt="Visa" className="h-3 opacity-80" />
                            <img src={upi} alt="UPI" className="h-3 opacity-80" />
                            <img src={paytm} alt="Paytm" className="h-3 opacity-80" />
                        </div>
                    </div>

                    <p className="mt-3 text-[10px] leading-relaxed text-slate-300">
                        ShopX offers premium quality products with quick delivery, easy returns,
                        and reliable customer support across India.
                    </p>

                    <p className="mt-2 text-[10px] text-slate-400">
                        Need help? Contact support or visit FAQs for assistance.
                    </p>

                    <div className="mt-3 flex items-center justify-between text-[9px] text-slate-500">
                        <span>Copyright {new Date().getFullYear()} ShopX</span>
                        <span>Terms and Conditions</span>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
