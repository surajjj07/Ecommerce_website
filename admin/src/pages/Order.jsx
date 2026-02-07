import { useEffect, useMemo, useState } from "react";
import {
  Eye,
  FileText,
  ShoppingBag,
  WalletCards,
  CreditCard,
} from "lucide-react";
import { api } from "../services/api";

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingOrderId, setUpdatingOrderId] = useState("");

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await api.get("/orders/all");
        setOrders(res.orders || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const downloadInvoice = (orderId) => {
    window.open(
      `${import.meta.env.VITE_API_URL}/admin/invoice/${orderId}`,
      "_blank"
    );
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      setUpdatingOrderId(orderId);
      const res = await api.put(`/orders/${orderId}/status`, { status });

      if (!res?.success || !res?.order) {
        throw new Error(res?.message || "Failed to update order status");
      }

      setOrders((prev) =>
        prev
          .map((order) => (order._id === orderId ? { ...order, ...res.order } : order))
          .filter((order) => order.status !== "delivered")
      );
    } catch (err) {
      alert(err.message || "Failed to update order status");
    } finally {
      setUpdatingOrderId("");
    }
  };

  const stats = useMemo(() => {
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce(
      (sum, order) => sum + (order.totalAmount || 0),
      0
    );
    const paidCount = orders.filter(
      (order) =>
        String(order.status || "").toLowerCase().includes("paid") ||
        String(order.paymentStatus || "").toLowerCase().includes("paid")
    ).length;

    return {
      totalOrders,
      totalRevenue,
      paidRate: totalOrders ? Math.round((paidCount / totalOrders) * 100) : 0,
    };
  }, [orders]);

  if (loading) {
    return <p className="text-center text-slate-500">Loading orders...</p>;
  }

  if (error) {
    return <p className="text-center text-red-600">{error}</p>;
  }

  const formatMoney = (value) => `INR ${value.toLocaleString("en-IN")}`;

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <section className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-6 py-8 text-white shadow-sm">
        <div className="pointer-events-none absolute -left-10 -top-16 h-48 w-48 rounded-full bg-emerald-500/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 right-0 h-56 w-56 rounded-full bg-sky-500/30 blur-3xl" />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.3em] text-emerald-200/80">
              Orders Center
            </p>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Order Management
            </h1>
            <p className="max-w-xl text-sm text-slate-200/80 sm:text-base">
              Track customer purchases, payment status, and invoice history in
              one place.
            </p>
          </div>
          <div className="rounded-2xl bg-white/10 px-5 py-4 text-center shadow-inner">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-200/70">
              Total Revenue
            </p>
            <p className="mt-2 text-2xl font-semibold">
              {formatMoney(stats.totalRevenue)}
            </p>
            <p className="mt-2 text-xs text-emerald-100/80">
              {stats.paidRate}% paid orders
            </p>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard
          icon={<ShoppingBag size={20} />}
          label="Total Orders"
          value={stats.totalOrders}
        />
        <StatCard
          icon={<WalletCards size={20} />}
          label="Revenue"
          value={formatMoney(stats.totalRevenue)}
        />
        <StatCard
          icon={<CreditCard size={20} />}
          label="Paid Rate"
          value={`${stats.paidRate}%`}
        />
      </section>

      {/* ===== Desktop Table ===== */}
      <div className="hidden overflow-hidden rounded-3xl border bg-white shadow-sm md:block">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-[0.18em] text-slate-500">
            <tr>
              <th className="px-6 py-4 text-left">Order</th>
              <th className="px-6 py-4 text-left">Customer</th>
              <th className="px-6 py-4 text-left">Amount</th>
              <th className="px-6 py-4 text-left">Payment</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {orders.map((order) => (
              <tr key={order._id} className="hover:bg-slate-50/80">
                <td className="px-6 py-4 font-semibold text-slate-800">
                  #{order.orderId || order._id.slice(-6)}
                </td>
                <td className="px-6 py-4 text-slate-600">
                  {order.user?.name || "Guest"}
                </td>
                <td className="px-6 py-4 text-slate-700">
                  {formatMoney(order.totalAmount || 0)}
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-slate-600">
                      {order.paymentMethod || "Online"}
                    </span>
                    <StatusPill status={order.status} />
                  </div>
                </td>
                <td className="px-6 py-4 text-right space-x-3">
                  {getStatusAction(order.status) ? (
                    <button
                      onClick={() =>
                        updateOrderStatus(order._id, getStatusAction(order.status).nextStatus)
                      }
                      disabled={updatingOrderId === order._id}
                      className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700 transition hover:border-indigo-300 disabled:opacity-60"
                    >
                      {updatingOrderId === order._id
                        ? "Updating..."
                        : getStatusAction(order.status).label}
                    </button>
                  ) : null}
                  <button className="rounded-full border border-slate-200 p-2 text-slate-600 transition hover:border-slate-300 hover:text-slate-900">
                    <Eye size={16} />
                  </button>
                  <button
                    onClick={() => downloadInvoice(order._id)}
                    className="rounded-full border border-emerald-200 bg-emerald-50 p-2 text-emerald-700 transition hover:border-emerald-300"
                  >
                    <FileText size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ===== Mobile Cards ===== */}
      <div className="space-y-4 md:hidden">
        {orders.map((order) => (
          <div
            key={order._id}
            className="space-y-3 rounded-3xl border bg-white p-4 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-800">
                #{order.orderId || order._id.slice(-6)}
              </span>
              <StatusPill status={order.status} />
            </div>

            <div className="space-y-1 text-sm text-slate-600">
              <p>
                <span className="text-slate-500">Customer:</span>{" "}
                {order.user?.name || "Guest"}
              </p>
              <p>
                <span className="text-slate-500">Payment:</span>{" "}
                {order.paymentMethod || "Online"}
              </p>
              <p className="font-semibold text-slate-800">
                {formatMoney(order.totalAmount || 0)}
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              {getStatusAction(order.status) ? (
                <button
                  onClick={() =>
                    updateOrderStatus(order._id, getStatusAction(order.status).nextStatus)
                  }
                  disabled={updatingOrderId === order._id}
                  className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700 disabled:opacity-60"
                >
                  {updatingOrderId === order._id
                    ? "Updating..."
                    : getStatusAction(order.status).label}
                </button>
              ) : null}
              <button className="rounded-full border border-slate-200 p-2 text-slate-600">
                <Eye size={18} />
              </button>
              <button
                onClick={() => downloadInvoice(order._id)}
                className="rounded-full border border-emerald-200 bg-emerald-50 p-2 text-emerald-700"
              >
                <FileText size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function getStatusAction(status) {
  const current = String(status || "").toLowerCase();

  if (current === "pending") {
    return { label: "Accept Order", nextStatus: "processing" };
  }
  if (current === "processing") {
    return { label: "Process to Customer", nextStatus: "shipped" };
  }
  if (current === "shipped") {
    return { label: "Mark Delivered", nextStatus: "delivered" };
  }

  return null;
}

function StatCard({ icon, label, value }) {
  return (
    <div className="rounded-3xl border bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="rounded-2xl bg-slate-900 p-2 text-white">{icon}</div>
      </div>
      <p className="mt-4 text-xs uppercase tracking-[0.2em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function StatusPill({ status }) {
  const safeStatus = String(status || "Pending");
  const normalized = safeStatus.toLowerCase();
  const tone = normalized.includes("cancel")
    ? "bg-rose-50 text-rose-700 border-rose-100"
    : normalized.includes("ship") || normalized.includes("deliver")
    ? "bg-emerald-50 text-emerald-700 border-emerald-100"
    : normalized.includes("paid")
    ? "bg-sky-50 text-sky-700 border-sky-100"
    : "bg-amber-50 text-amber-700 border-amber-100";

  return (
    <span
      className={`inline-flex w-fit items-center rounded-full border px-3 py-1 text-xs font-semibold ${tone}`}
    >
      {safeStatus}
    </span>
  );
}
