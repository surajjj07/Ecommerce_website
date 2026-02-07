import { Minus, Plus, Trash2 } from "lucide-react";
import { useCart } from "../Context/CartContext";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../Context/AuthContext";
import { api } from "../services/api";

const Cart = () => {
    const { cart, increaseQty, decreaseQty, removeFromCart, clearCart } = useCart();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [address, setAddress] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [coupon, setCoupon] = useState("");
    const [discount, setDiscount] = useState(0);
    const [couponMsg, setCouponMsg] = useState("");
    const [showSuccess, setShowSuccess] = useState(false);

    const handlePlaceOrder = async () => {
        if (!user) {
            navigate("/login");
            return;
        }
        if (!address.trim()) {
            setError("Please enter shipping address");
            return;
        }

        setLoading(true);
        setError("");

        const products = cart.map(item => ({
            product: item.id,
            quantity: item.qty,
            price: Number(item.price.replace(/[â‚¹,]/g, ""))
        }));

        try {
            const result = await api.createOrder({ products, shippingAddress: address });
            if (result.message === "Order created successfully") {
                clearCart();
                setShowSuccess(true);
                setTimeout(() => {
                    setShowSuccess(false);
                    navigate("/profile");
                }, 1400);
            } else {
                setError(result.message);
            }
        } catch (err) {
            setError("Failed to place order");
        } finally {
            setLoading(false);
        }
    };

    const total = cart.reduce(
        (sum, item) =>
            sum + Number(item.price.replace(/[â‚¹,]/g, "")) * item.qty,
        0
    );
    const payable = Math.max(total - discount, 0);

    const handleApplyCoupon = () => {
        const code = coupon.trim().toUpperCase();
        if (!code) {
            setCouponMsg("Enter a coupon code");
            setDiscount(0);
            return;
        }

        if (code === "SAVE10") {
            const value = Math.round(total * 0.1);
            setDiscount(value);
            setCouponMsg("SAVE10 applied (10% off)");
            return;
        }

        if (code === "FLAT200") {
            const value = Math.min(200, total);
            setDiscount(value);
            setCouponMsg("FLAT200 applied (â‚¹200 off)");
            return;
        }

        setDiscount(0);
        setCouponMsg("Invalid coupon code");
    };

    if (cart.length === 0) {
        return (
            <section className="relative overflow-hidden bg-[#f7f4ef] py-28">
                <div className="absolute -top-20 -right-24 h-64 w-64 rounded-full bg-amber-200/50 blur-3xl" />
                <div className="absolute -bottom-24 -left-20 h-72 w-72 rounded-full bg-indigo-200/50 blur-3xl" />
                <div className="max-w-3xl mx-auto px-6 text-center relative">
                    <p className="text-xs uppercase tracking-[0.3em] text-gray-500">
                        Cart
                    </p>
                    <h2 className="mt-4 text-3xl md:text-4xl font-extrabold text-gray-900">
                        Your cart is empty
                    </h2>
                    <p className="mt-3 text-gray-600">
                        Add a few premium picks to get started.
                    </p>
                    <button
                        onClick={() => navigate("/shop")}
                        className="mt-8 px-8 py-3 rounded-full bg-gradient-to-r from-indigo-600 to-gray-900 text-white font-semibold shadow-lg shadow-indigo-500/20"
                    >
                        Continue Shopping
                    </button>
                </div>
            </section>
        );
    }

    return (
        <section className="relative overflow-hidden bg-[#f7f4ef] py-20">
            <div className="absolute -top-24 -right-28 h-72 w-72 rounded-full bg-amber-200/50 blur-3xl" />
            <div className="absolute -bottom-28 -left-24 h-80 w-80 rounded-full bg-indigo-200/50 blur-3xl" />

            <div className="max-w-7xl mx-auto px-6 relative">
                {showSuccess && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
                        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm notify-overlay" />
                        <div className="relative w-full max-w-sm rounded-3xl bg-white shadow-2xl border border-green-100 px-8 py-6 text-center notify-card">
                            <p className="text-xs uppercase tracking-[0.35em] text-green-600">
                                Success
                            </p>
                            <h3 className="mt-3 text-xl font-extrabold text-gray-900">
                                Order placed
                            </h3>
                            <p className="mt-2 text-sm text-gray-600">
                                Thank you for shopping with us.
                            </p>
                        </div>
                    </div>
                )}

                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10">
                    <div>
                        <p className="text-xs uppercase tracking-[0.3em] text-gray-500">
                            Secure Checkout
                        </p>
                        <h1 className="mt-3 text-3xl md:text-4xl font-extrabold text-gray-900">
                            Shopping Cart
                        </h1>
                    </div>
                    <div className="text-sm text-gray-600">
                        {cart.length} item{cart.length > 1 ? "s" : ""} in your bag
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    {/* CART ITEMS */}
                    <div className="lg:col-span-2 space-y-6">
                        {cart.map((item) => (
                            <div
                                key={item.id}
                                className="flex flex-col sm:flex-row sm:items-center gap-6 bg-white/80 backdrop-blur rounded-3xl p-6 md:p-8 border border-white/70 shadow-[0_20px_60px_-40px_rgba(0,0,0,0.5)]"
                            >
                                <img
                                    src={item.image}
                                    alt={item.name}
                                    className="w-28 h-28 object-cover rounded-2xl ring-1 ring-black/5"
                                />

                                <div className="flex-1">
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900">
                                                {item.name}
                                            </h3>
                                            <p className="text-gray-500 text-sm mt-1">
                                                Curated premium selection
                                            </p>
                                        </div>
                                        <p className="text-indigo-700 font-bold">
                                            {item.price}
                                        </p>
                                    </div>

                                    {/* Quantity */}
                                    <div className="mt-6 flex items-center gap-3">
                                        <div className="flex items-center gap-2 rounded-full bg-white px-2 py-1 border border-gray-200 shadow-sm">
                                            <button
                                                onClick={() => decreaseQty(item.id)}
                                                className="p-2 rounded-full hover:bg-gray-100"
                                                aria-label="Decrease quantity"
                                            >
                                                <Minus size={16} />
                                            </button>

                                            <span className="min-w-[24px] text-center font-semibold">
                                                {item.qty}
                                            </span>

                                            <button
                                                onClick={() => increaseQty(item.id)}
                                                className="p-2 rounded-full hover:bg-gray-100"
                                                aria-label="Increase quantity"
                                            >
                                                <Plus size={16} />
                                            </button>
                                        </div>

                                        {/* Remove */}
                                        <button
                                            onClick={() => removeFromCart(item.id)}
                                            className="text-red-500 hover:text-red-600 text-sm font-medium"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* SUMMARY */}
                    <div className="lg:col-span-1">
                        <div className="bg-white/90 backdrop-blur rounded-3xl p-8 border border-white/70 shadow-[0_30px_80px_-50px_rgba(0,0,0,0.6)] sticky top-8">
                            <h2 className="text-xl font-bold text-gray-900 mb-6">
                                Order Summary
                            </h2>

                            <div className="flex justify-between text-gray-700 mb-4">
                                <span>Subtotal</span>
                                <span>â‚¹{total.toLocaleString()}</span>
                            </div>

                            <div className="flex justify-between text-gray-700 mb-4">
                                <span>Discount</span>
                                <span className={discount > 0 ? "text-green-700" : "text-gray-500"}>
                                    -â‚¹{discount.toLocaleString()}
                                </span>
                            </div>

                            <div className="flex justify-between text-gray-700 mb-4">
                                <span>Delivery</span>
                                <span className="text-green-600">Free</span>
                            </div>

                            <div className="border-t pt-4 flex justify-between text-lg font-bold">
                                <span>Total</span>
                                <span>â‚¹{payable.toLocaleString()}</span>
                            </div>

                            <div className="mt-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Coupon / Discount
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        value={coupon}
                                        onChange={(e) => setCoupon(e.target.value)}
                                        placeholder="Try SAVE10 or FLAT200"
                                        className="flex-1 px-3 py-2 border border-gray-200 rounded-2xl bg-white/70 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                    />
                                    <button
                                        onClick={handleApplyCoupon}
                                        type="button"
                                        className="px-4 py-2 rounded-2xl bg-gray-900 text-white text-sm font-semibold hover:opacity-90"
                                    >
                                        Apply
                                    </button>
                                </div>
                                {couponMsg && (
                                    <p className={`mt-2 text-xs notify-card ${couponMsg.includes("applied") ? "text-green-700" : "text-red-500"}`}>
                                        {couponMsg}
                                    </p>
                                )}
                            </div>

                            <div className="mt-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Shipping Address
                                </label>
                                <textarea
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    placeholder="Enter your shipping address"
                                    className="w-full px-3 py-2 border border-gray-200 rounded-2xl bg-white/70 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                    rows="3"
                                />
                            </div>

                            {error && (
                                <div className="mt-3 rounded-2xl bg-red-50 text-red-700 px-4 py-3 text-sm notify-card">
                                    {error}
                                </div>
                            )}

                            <button
                                onClick={handlePlaceOrder}
                                disabled={loading}
                                className="mt-8 w-full py-3 rounded-full bg-gradient-to-r from-indigo-600 to-gray-900 text-white font-semibold hover:opacity-95 disabled:opacity-50 shadow-lg shadow-indigo-500/20"
                            >
                                {loading ? "Placing Order..." : "Place Order"}
                            </button>

                            <p className="mt-4 text-xs text-gray-500 text-center">
                                By placing your order, you agree to our store policies.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Cart;
