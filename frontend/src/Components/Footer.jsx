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
        <footer className="bg-white border-t border-gray-200">
            <div className="max-w-7xl mx-auto px-6 py-10">

                {/* Desktop Footer */}
                <div className="hidden md:grid grid-cols-4 gap-10 mb-6">

                    {/* Brand */}
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">
                            Shop<span className="text-indigo-600">X</span>
                        </h2>
                        <p className="mt-3 text-sm text-gray-600">
                            Premium products with fast delivery and trusted quality.
                        </p>

                        <div className="mt-4 flex items-center gap-3">
                            {[Facebook, Instagram, Twitter, Youtube].map((Icon, i) => (
                                <a
                                    key={i}
                                    className="p-2 rounded-full bg-gray-100 hover:bg-indigo-600 hover:text-white transition"
                                >
                                    <Icon className="h-4 w-4" />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Shop */}
                    <div>
                        <h3 className="text-sm font-semibold text-gray-900 mb-3">Shop</h3>
                        <ul className="space-y-2 text-sm text-gray-600">
                            {["Men", "Women", "Electronics", "Accessories", "New Arrivals"].map(
                                (item) => (
                                    <li key={item} className="hover:text-indigo-600 cursor-pointer">
                                        {item}
                                    </li>
                                )
                            )}
                        </ul>
                    </div>

                    {/* Support */}
                    <div>
                        <h3 className="text-sm font-semibold text-gray-900 mb-3">
                            Support
                        </h3>
                        <ul className="space-y-2 text-sm text-gray-600">
                            {["Contact Us", "FAQs", "Shipping", "Returns", "Track Order"].map(
                                (item) => (
                                    <li key={item} className="hover:text-indigo-600 cursor-pointer">
                                        {item}
                                    </li>
                                )
                            )}
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <h3 className="text-sm font-semibold text-gray-900 mb-3">
                            Contact
                        </h3>
                        <ul className="space-y-3 text-sm text-gray-600">
                            <li className="flex items-center gap-2">
                                <Mail className="h-4 w-4 text-indigo-600" />
                                support@shopx.com
                            </li>
                            <li className="flex items-center gap-2">
                                <Phone className="h-4 w-4 text-indigo-600" />
                                +91 98765 43210
                            </li>
                            <li className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-indigo-600" />
                                India
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar – Desktop */}
                <div className="hidden md:flex items-center justify-between border-t pt-4 text-xs text-gray-500">
                    <span>© {new Date().getFullYear()} ShopX</span>

                    <div className="flex items-center gap-4">
                        <span>Secure Payments</span>
                        <span>Fast Delivery</span>
                        <span>Easy Returns</span>
                    </div>

                    <div className="flex items-center gap-3">
                        <img src={visa} alt="Visa" className="h-5" />
                        <img src={upi} alt="UPI" className="h-5" />
                        <img src={paytm} alt="Paytm" className="h-5" />
                    </div>
                </div>

                {/* ✅ Mobile Footer – Premium with Context */}
                <div className="md:hidden mt-6 border-t border-gray-200 pt-4 pb-5">
                    {/* Brand + Trust */}
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-gray-900">
                            Shop<span className="text-indigo-600">X</span>
                        </span>

                        <span className="text-[10px] text-gray-500">
                            Secure Checkout • Fast Delivery
                        </span>

                        <div className="flex items-center gap-2">
                            <img src={visa} alt="Visa" className="h-3 opacity-80" />
                            <img src={upi} alt="UPI" className="h-3 opacity-80" />
                            <img src={paytm} alt="Paytm" className="h-3 opacity-80" />
                        </div>
                    </div>

                    {/* Short description */}
                    <p className="mt-3 text-[10px] text-gray-500 leading-relaxed">
                        ShopX offers premium quality products with quick delivery, easy returns,
                        and reliable customer support across India.
                    </p>

                    {/* Support hint */}
                    <p className="mt-2 text-[10px] text-gray-400">
                        Need help? Contact support or visit FAQs for assistance.
                    </p>

                    {/* Legal */}
                    <div className="mt-3 flex items-center justify-between text-[9px] text-gray-400">
                        <span>© {new Date().getFullYear()} ShopX. All rights reserved.</span>
                        <span>Terms & Conditions</span>
                    </div>
                </div>



            </div>
        </footer>
    );
};

export default Footer;
  