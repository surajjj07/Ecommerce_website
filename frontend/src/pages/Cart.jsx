import { Minus, Plus } from "lucide-react";
import { useCart } from "../Context/CartContext";
import { useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";
import { useAuth } from "../Context/AuthContext";
import { api } from "../services/api";

const RAZORPAY_CHECKOUT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

const loadRazorpayScript = () =>
    new Promise((resolve) => {
        if (window.Razorpay) {
            resolve(true);
            return;
        }

        const script = document.createElement("script");
        script.src = RAZORPAY_CHECKOUT_SRC;
        script.async = true;
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });

const parsePrice = (value) => Number(String(value || "").replace(/[^\d.]/g, "")) || 0;

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
    const [paymentMethod, setPaymentMethod] = useState("cod");

    const products = useMemo(
        () =>
            cart.map((item) => ({
                product: item.id,
                quantity: item.qty,
                price: parsePrice(item.price),
            })),
        [cart]
    );

    const total = useMemo(
        () => cart.reduce((sum, item) => sum + parsePrice(item.price) * item.qty, 0),
        [cart]
    );

    const payable = Math.max(total - discount, 0);

    const handleOrderSuccess = () => {
        clearCart();
        setShowSuccess(true);
        setTimeout(() => {
            setShowSuccess(false);
            navigate("/profile");
        }, 1400);
    };

    const handleCashOnDeliveryOrder = async () => {
        const result = await api.createOrder({
            products,
            shippingAddress: address,
            paymentMethod: "cod",
        });

        if (result.message === "Order created successfully") {
            handleOrderSuccess();
            return;
        }

        throw new Error(result.message || "Failed to place order");
    };

    const handleOnlinePaymentOrder = async () => {
        const razorpayOrder = await api.createPaymentOrder({
            products,
            shippingAddress: address,
        });

        const scriptLoaded = await loadRazorpayScript();
        if (!scriptLoaded) {
            throw new Error("Unable to load payment gateway. Please try again.");
        }

        return new Promise((resolve, reject) => {
            const checkout = new window.Razorpay({
                key: razorpayOrder.key,
                amount: razorpayOrder.amount,
                currency: razorpayOrder.currency,
                name: "ShopX",
                description: "Secure order payment",
                order_id: razorpayOrder.orderId,
                prefill: {
                    name: user?.name || "",
                    email: user?.email || "",
                },
                theme: {
                    color: "#f59e0b",
                },
                handler: async (response) => {
                    try {
                        await api.verifyPaymentAndCreateOrder({
                            products,
                            shippingAddress: address,
                            razorpayOrderId: response.razorpay_order_id,
                            razorpayPaymentId: response.razorpay_payment_id,
                            razorpaySignature: response.razorpay_signature,
                        });
                        handleOrderSuccess();
                        resolve();
                    } catch (verifyError) {
                        reject(verifyError);
                    }
                },
                modal: {
                    ondismiss: () => reject(new Error("Payment cancelled by user")),
                },
            });

            checkout.open();
        });
    };

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

        try {
            if (paymentMethod === "online") {
                await handleOnlinePaymentOrder();
            } else {
                await handleCashOnDeliveryOrder();
            }
        } catch (err) {
            setError(err?.message || "Failed to place order");
        } finally {
            setLoading(false);
        }
    };

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
            setCouponMsg("FLAT200 applied (INR 200 off)");
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
                <div className="relative mx-auto max-w-3xl px-6 text-center">
                    <p className="text-xs uppercase tracking-[0.3em] text-gray-500">Cart</p>
                    <h2 className="mt-4 text-3xl font-extrabold text-gray-900 md:text-4xl">
                        Your cart is empty
                    </h2>
                    <p className="mt-3 text-gray-600">
                        Add a few premium picks to get started.
                    </p>
                    <button
                        onClick={() => navigate("/shop")}
                        className="mt-8 rounded-full bg-gradient-to-r from-indigo-600 to-gray-900 px-8 py-3 font-semibold text-white shadow-lg shadow-indigo-500/20"
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

            <div className="relative mx-auto max-w-7xl px-6">
                {showSuccess && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
                        <div className="notify-overlay absolute inset-0 bg-black/40 backdrop-blur-sm" />
                        <div className="notify-card relative w-full max-w-sm rounded-3xl border border-green-100 bg-white px-8 py-6 text-center shadow-2xl">
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

                <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                    <div>
                        <p className="text-xs uppercase tracking-[0.3em] text-gray-500">
                            Secure Checkout
                        </p>
                        <h1 className="mt-3 text-3xl font-extrabold text-gray-900 md:text-4xl">
                            Shopping Cart
                        </h1>
                    </div>
                    <div className="text-sm text-gray-600">
                        {cart.length} item{cart.length > 1 ? "s" : ""} in your bag
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
                    <div className="space-y-6 lg:col-span-2">
                        {cart.map((item) => (
                            <div
                                key={item.id}
                                className="flex flex-col gap-6 rounded-3xl border border-white/70 bg-white/80 p-6 shadow-[0_20px_60px_-40px_rgba(0,0,0,0.5)] backdrop-blur sm:flex-row sm:items-center md:p-8"
                            >
                                <img
                                    src={item.image}
                                    alt={item.name}
                                    className="h-28 w-28 rounded-2xl object-cover ring-1 ring-black/5"
                                />

                                <div className="flex-1">
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900">
                                                {item.name}
                                            </h3>
                                            <p className="mt-1 text-sm text-gray-500">
                                                Curated premium selection
                                            </p>
                                        </div>
                                        <p className="font-bold text-indigo-700">{item.price}</p>
                                    </div>

                                    <div className="mt-6 flex items-center gap-3">
                                        <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-2 py-1 shadow-sm">
                                            <button
                                                onClick={() => decreaseQty(item.id)}
                                                className="rounded-full p-2 hover:bg-gray-100"
                                                aria-label="Decrease quantity"
                                            >
                                                <Minus size={16} />
                                            </button>

                                            <span className="min-w-[24px] text-center font-semibold">
                                                {item.qty}
                                            </span>

                                            <button
                                                onClick={() => increaseQty(item.id)}
                                                className="rounded-full p-2 hover:bg-gray-100"
                                                aria-label="Increase quantity"
                                            >
                                                <Plus size={16} />
                                            </button>
                                        </div>

                                        <button
                                            onClick={() => removeFromCart(item.id)}
                                            className="text-sm font-medium text-red-500 hover:text-red-600"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="lg:col-span-1">
                        <div className="sticky top-8 rounded-3xl border border-white/70 bg-white/90 p-8 shadow-[0_30px_80px_-50px_rgba(0,0,0,0.6)] backdrop-blur">
                            <h2 className="mb-6 text-xl font-bold text-gray-900">Order Summary</h2>

                            <div className="mb-4 flex justify-between text-gray-700">
                                <span>Subtotal</span>
                                <span>INR {total.toLocaleString()}</span>
                            </div>

                            <div className="mb-4 flex justify-between text-gray-700">
                                <span>Discount</span>
                                <span className={discount > 0 ? "text-green-700" : "text-gray-500"}>
                                    -INR {discount.toLocaleString()}
                                </span>
                            </div>

                            <div className="mb-4 flex justify-between text-gray-700">
                                <span>Delivery</span>
                                <span className="text-green-600">Free</span>
                            </div>

                            <div className="flex justify-between border-t pt-4 text-lg font-bold">
                                <span>Total</span>
                                <span>INR {payable.toLocaleString()}</span>
                            </div>

                            <div className="mt-6">
                                <label className="mb-2 block text-sm font-medium text-gray-700">
                                    Payment Method
                                </label>
                                <div className="space-y-2">
                                    <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-gray-200 bg-white/80 px-4 py-3">
                                        <input
                                            type="radio"
                                            name="paymentMethod"
                                            value="cod"
                                            checked={paymentMethod === "cod"}
                                            onChange={(e) => setPaymentMethod(e.target.value)}
                                        />
                                        <span className="text-sm font-medium text-gray-800">
                                            Cash on Delivery
                                        </span>
                                    </label>
                                    <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-gray-200 bg-white/80 px-4 py-3">
                                        <input
                                            type="radio"
                                            name="paymentMethod"
                                            value="online"
                                            checked={paymentMethod === "online"}
                                            onChange={(e) => setPaymentMethod(e.target.value)}
                                        />
                                        <span className="text-sm font-medium text-gray-800">
                                            Pay Online (Razorpay)
                                        </span>
                                    </label>
                                </div>
                            </div>

                            <div className="mt-6">
                                <label className="mb-2 block text-sm font-medium text-gray-700">
                                    Coupon / Discount
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        value={coupon}
                                        onChange={(e) => setCoupon(e.target.value)}
                                        placeholder="Try SAVE10 or FLAT200"
                                        className="flex-1 rounded-2xl border border-gray-200 bg-white/70 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                    />
                                    <button
                                        onClick={handleApplyCoupon}
                                        type="button"
                                        className="rounded-2xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
                                    >
                                        Apply
                                    </button>
                                </div>
                                {couponMsg && (
                                    <p
                                        className={`notify-card mt-2 text-xs ${couponMsg.includes("applied")
                                            ? "text-green-700"
                                            : "text-red-500"
                                            }`}
                                    >
                                        {couponMsg}
                                    </p>
                                )}
                            </div>

                            <div className="mt-6">
                                <label className="mb-2 block text-sm font-medium text-gray-700">
                                    Shipping Address
                                </label>
                                <textarea
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    placeholder="Enter your shipping address"
                                    className="w-full rounded-2xl border border-gray-200 bg-white/70 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                    rows="3"
                                />
                            </div>

                            {error && (
                                <div className="notify-card mt-3 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
                                    {error}
                                </div>
                            )}

                            <button
                                onClick={handlePlaceOrder}
                                disabled={loading}
                                className="mt-8 w-full rounded-full bg-gradient-to-r from-indigo-600 to-gray-900 py-3 font-semibold text-white shadow-lg shadow-indigo-500/20 hover:opacity-95 disabled:opacity-50"
                            >
                                {loading
                                    ? paymentMethod === "online"
                                        ? "Processing Payment..."
                                        : "Placing Order..."
                                    : paymentMethod === "online"
                                        ? "Pay and Place Order"
                                        : "Place Order"}
                            </button>

                            <p className="mt-4 text-center text-xs text-gray-500">
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
