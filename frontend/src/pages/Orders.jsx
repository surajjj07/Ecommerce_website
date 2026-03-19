import { useEffect, useMemo, useState } from "react";
import {
    ArrowRight,
    Box,
    CreditCard,
    MapPin,
    PackageSearch,
    Search,
    ShieldCheck,
    Truck,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../Context/AuthContext";
import { api } from "../services/api";
import { useToast } from "../Context/ToastContext";

const STATUS_STEPS = ["pending", "processing", "shipped", "delivered"];

const normalizeLabel = (value) => {
    const safeValue = String(value || "").trim();
    if (!safeValue) return "Unavailable";
    return safeValue.charAt(0).toUpperCase() + safeValue.slice(1);
};

const formatMoney = (value) => `INR ${Number(value || 0).toLocaleString("en-IN")}`;

const formatDate = (value) => {
    if (!value) return "Date unavailable";
    return new Date(value).toLocaleString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
    });
};

const getOrderProgress = (status) => {
    const normalizedStatus = String(status || "pending").toLowerCase();

    if (normalizedStatus === "cancelled") {
        return {
            currentStep: -1,
            isCancelled: true,
        };
    }

    return {
        currentStep: Math.max(STATUS_STEPS.indexOf(normalizedStatus), 0),
        isCancelled: false,
    };
};

const getStatusTone = (status) => {
    const normalizedStatus = String(status || "").toLowerCase();

    if (normalizedStatus === "delivered") {
        return "border-emerald-200 bg-emerald-50 text-emerald-700";
    }
    if (normalizedStatus === "cancelled") {
        return "border-rose-200 bg-rose-50 text-rose-700";
    }
    if (normalizedStatus === "shipped") {
        return "border-sky-200 bg-sky-50 text-sky-700";
    }
    return "border-amber-200 bg-amber-50 text-amber-700";
};

const Orders = () => {
    const navigate = useNavigate();
    const { user, loading: authLoading } = useAuth();
    const { showToast } = useToast();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [query, setQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    useEffect(() => {
        if (!authLoading && !user) {
            navigate("/login");
        }
    }, [authLoading, navigate, user]);

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const result = await api.getUserOrders();
                setOrders(result.orders || []);
            } catch (error) {
                showToast(error.message || "Failed to load orders", "error");
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchOrders();
        }
    }, [showToast, user]);

    const filteredOrders = useMemo(() => {
        const normalizedQuery = query.trim().toLowerCase();

        return orders.filter((order) => {
            const matchesStatus =
                statusFilter === "all" ||
                String(order.status || "").toLowerCase() === statusFilter;

            if (!matchesStatus) return false;
            if (!normalizedQuery) return true;

            const haystack = [
                order.orderId,
                order._id,
                order.shipment?.awbCode,
                order.shipment?.courierName,
                ...(order.items || []).map((item) => item.product?.name || ""),
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();

            return haystack.includes(normalizedQuery);
        });
    }, [orders, query, statusFilter]);

    const stats = useMemo(() => {
        const delivered = orders.filter((order) => order.status === "delivered").length;
        const inTransit = orders.filter(
            (order) => order.status === "processing" || order.status === "shipped"
        ).length;

        return {
            total: orders.length,
            inTransit,
            delivered,
        };
    }, [orders]);

    if (authLoading || (!user && loading)) {
        return (
            <section className="bg-[#f7f4ef] py-24">
                <div className="mx-auto max-w-6xl px-6">
                    <p className="text-sm text-slate-500">Loading your orders...</p>
                </div>
            </section>
        );
    }

    return (
        <section className="relative overflow-hidden bg-[#f7f4ef] py-16 md:py-20">
            <div className="absolute -left-28 top-10 h-72 w-72 rounded-full bg-amber-200/60 blur-3xl" />
            <div className="absolute -right-28 top-32 h-80 w-80 rounded-full bg-sky-200/60 blur-3xl" />

            <div className="relative mx-auto max-w-7xl px-6">
                <div className="grid gap-6 rounded-[2rem] bg-slate-950 px-6 py-8 text-white shadow-[0_30px_90px_-50px_rgba(15,23,42,0.9)] md:grid-cols-[1.4fr_0.9fr] md:px-10">
                    <div>
                        <p className="text-xs uppercase tracking-[0.35em] text-amber-300">
                            Track Orders
                        </p>
                        <h1 className="mt-4 text-3xl font-black tracking-tight md:text-5xl">
                            Follow every order from checkout to doorstep.
                        </h1>
                        <p className="mt-4 max-w-2xl text-sm text-slate-300 md:text-base">
                            Live status, shipment details, payment state, and delivery
                            progress are pulled from your backend order APIs.
                        </p>
                        <div className="mt-6 flex flex-wrap gap-3 text-xs uppercase tracking-[0.24em] text-slate-300">
                            <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2">
                                Shipment Tracking
                            </span>
                            <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2">
                                Payment Status
                            </span>
                            <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2">
                                Address Snapshot
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 md:grid-cols-1 xl:grid-cols-3">
                        <StatsCard label="Orders" value={stats.total} icon={<Box className="h-5 w-5" />} />
                        <StatsCard label="In Transit" value={stats.inTransit} icon={<Truck className="h-5 w-5" />} />
                        <StatsCard label="Delivered" value={stats.delivered} icon={<ShieldCheck className="h-5 w-5" />} />
                    </div>
                </div>

                <div className="mt-8 grid gap-4 rounded-[2rem] border border-white/70 bg-white/80 p-5 shadow-[0_25px_80px_-55px_rgba(15,23,42,0.65)] backdrop-blur md:grid-cols-[1fr_auto] md:items-center md:p-6">
                    <label className="relative block">
                        <Search className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
                        <input
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder="Search by order ID, product, AWB, or courier"
                            className="w-full rounded-2xl border border-slate-200 bg-white px-12 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-400"
                        />
                    </label>

                    <select
                        value={statusFilter}
                        onChange={(event) => setStatusFilter(event.target.value)}
                        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-400"
                    >
                        <option value="all">All statuses</option>
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                </div>

                {loading ? (
                    <div className="mt-8 rounded-[2rem] border border-dashed border-slate-300 bg-white/70 px-6 py-12 text-center text-slate-500">
                        Loading order timeline...
                    </div>
                ) : filteredOrders.length === 0 ? (
                    <div className="mt-8 rounded-[2rem] border border-dashed border-slate-300 bg-white/70 px-6 py-14 text-center">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-900 text-white">
                            <PackageSearch className="h-7 w-7" />
                        </div>
                        <h2 className="mt-5 text-2xl font-bold text-slate-900">
                            No matching orders found
                        </h2>
                        <p className="mt-2 text-sm text-slate-600">
                            Try a different search term, or place a new order to see it here.
                        </p>
                        <Link
                            to="/shop"
                            className="mt-6 inline-flex items-center gap-2 rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                        >
                            Continue Shopping
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                    </div>
                ) : (
                    <div className="mt-8 space-y-6">
                        {filteredOrders.map((order) => (
                            <OrderCard key={order._id} order={order} />
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
};

const StatsCard = ({ icon, label, value }) => (
    <div className="rounded-3xl border border-white/10 bg-white/5 px-5 py-4">
        <div className="flex items-center justify-between text-slate-300">
            <span className="text-xs uppercase tracking-[0.28em]">{label}</span>
            {icon}
        </div>
        <p className="mt-4 text-3xl font-black text-white">{value}</p>
    </div>
);

const OrderCard = ({ order }) => {
    const { currentStep, isCancelled } = getOrderProgress(order.status);
    const shippingDetails = order.shippingDetails || {};
    const address = [
        shippingDetails.addressLine1,
        shippingDetails.addressLine2,
        shippingDetails.city,
        shippingDetails.state,
        shippingDetails.pincode,
        shippingDetails.country,
    ]
        .filter(Boolean)
        .join(", ");

    return (
        <article className="overflow-hidden rounded-[2rem] border border-white/70 bg-white/90 shadow-[0_30px_80px_-55px_rgba(15,23,42,0.65)]">
            <div className="flex flex-col gap-5 border-b border-slate-100 px-6 py-6 lg:flex-row lg:items-start lg:justify-between">
                <div>
                    <div className="flex flex-wrap items-center gap-3">
                        <p className="text-xs uppercase tracking-[0.32em] text-slate-500">
                            Order #{order.orderId || order._id?.slice(-8)}
                        </p>
                        <span
                            className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getStatusTone(order.status)}`}
                        >
                            {normalizeLabel(order.status)}
                        </span>
                    </div>
                    <h2 className="mt-3 text-2xl font-bold text-slate-900">
                        {formatMoney(order.totalAmount)}
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                        Placed on {formatDate(order.createdAt)}
                    </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[23rem]">
                    <InfoChip
                        icon={<CreditCard className="h-4 w-4" />}
                        label="Payment"
                        value={`${normalizeLabel(order.paymentMethod)} / ${normalizeLabel(order.paymentStatus)}`}
                    />
                    <InfoChip
                        icon={<Truck className="h-4 w-4" />}
                        label="Shipment"
                        value={order.shipment?.awbCode || "Not created yet"}
                    />
                </div>
            </div>

            <div className="grid gap-8 px-6 py-6 lg:grid-cols-[1.2fr_0.8fr]">
                <div>
                    <h3 className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-500">
                        Delivery Progress
                    </h3>

                    {isCancelled ? (
                        <div className="mt-4 rounded-3xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
                            This order was cancelled. Shipment activity is no longer available.
                        </div>
                    ) : (
                        <div className="mt-5 grid gap-4 md:grid-cols-4">
                            {STATUS_STEPS.map((step, index) => {
                                const active = index <= currentStep;
                                const finalStep = index === STATUS_STEPS.length - 1;

                                return (
                                    <div key={step} className="relative">
                                        {!finalStep ? (
                                            <span
                                                className={`absolute left-[calc(50%+1.5rem)] top-5 hidden h-0.5 w-[calc(100%-1rem)] md:block ${
                                                    index < currentStep ? "bg-emerald-500" : "bg-slate-200"
                                                }`}
                                            />
                                        ) : null}
                                        <div className="flex items-center gap-3 md:block">
                                            <div
                                                className={`flex h-10 w-10 items-center justify-center rounded-full border text-sm font-bold ${
                                                    active
                                                        ? "border-emerald-500 bg-emerald-500 text-white"
                                                        : "border-slate-200 bg-white text-slate-400"
                                                }`}
                                            >
                                                {index + 1}
                                            </div>
                                            <div className="md:mt-3">
                                                <p className="text-sm font-semibold text-slate-900">
                                                    {normalizeLabel(step)}
                                                </p>
                                                <p className="text-xs text-slate-500">
                                                    {active ? "Updated" : "Waiting"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    <div className="mt-8">
                        <h3 className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-500">
                            Items
                        </h3>
                        <div className="mt-4 space-y-3">
                            {(order.items || []).map((item, index) => (
                                <div
                                    key={`${item.product?._id || index}-${index}`}
                                    className="flex items-center justify-between rounded-3xl border border-slate-100 bg-slate-50 px-4 py-4"
                                >
                                    <div>
                                        <p className="font-semibold text-slate-900">
                                            {item.product?.name || "Product"}
                                        </p>
                                        <p className="text-sm text-slate-500">
                                            Qty {item.quantity} x {formatMoney(item.price)}
                                        </p>
                                    </div>
                                    <p className="font-semibold text-slate-900">
                                        {formatMoney(item.price * item.quantity)}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <aside className="space-y-5">
                    <Panel
                        icon={<Truck className="h-5 w-5" />}
                        title="Shipment Tracking"
                        content={
                            <div className="space-y-3 text-sm text-slate-600">
                                <InfoRow label="Courier" value={order.shipment?.courierName || "Awaiting assignment"} />
                                <InfoRow label="Tracking status" value={normalizeLabel(order.shipment?.status || "pending")} />
                                <InfoRow label="AWB" value={order.shipment?.awbCode || "Not available"} />
                                {order.shipment?.trackingUrl ? (
                                    <a
                                        href={order.shipment.trackingUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
                                    >
                                        Open courier tracking
                                        <ArrowRight className="h-4 w-4" />
                                    </a>
                                ) : null}
                            </div>
                        }
                    />

                    <Panel
                        icon={<MapPin className="h-5 w-5" />}
                        title="Shipping Address"
                        content={
                            <div className="space-y-2 text-sm text-slate-600">
                                <p className="font-semibold text-slate-900">
                                    {shippingDetails.name || "Customer"}
                                </p>
                                <p>{address || order.shippingAddress || "Address unavailable"}</p>
                                <p>{shippingDetails.phone || "Phone unavailable"}</p>
                                <p>{shippingDetails.email || "Email unavailable"}</p>
                            </div>
                        }
                    />
                </aside>
            </div>
        </article>
    );
};

const Panel = ({ icon, title, content }) => (
    <div className="rounded-[1.75rem] border border-slate-100 bg-slate-50 p-5">
        <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-slate-900 p-2 text-white">{icon}</div>
            <h3 className="font-semibold text-slate-900">{title}</h3>
        </div>
        <div className="mt-4">{content}</div>
    </div>
);

const InfoChip = ({ icon, label, value }) => (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3">
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-slate-500">
            {icon}
            <span>{label}</span>
        </div>
        <p className="mt-2 text-sm font-semibold text-slate-900">{value}</p>
    </div>
);

const InfoRow = ({ label, value }) => (
    <div className="flex items-start justify-between gap-4">
        <span className="text-slate-500">{label}</span>
        <span className="text-right font-medium text-slate-900">{value}</span>
    </div>
);

export default Orders;
