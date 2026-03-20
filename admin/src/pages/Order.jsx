import { useEffect, useMemo, useState } from "react";
import {
  Eye,
  FileText,
  ShoppingBag,
  WalletCards,
  CreditCard,
} from "lucide-react";
import { api } from "../services/api";
import { useToast } from "../context/ToastContext";

export default function Orders() {
  const { showToast } = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionKey, setActionKey] = useState("");

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

  const patchOrder = (nextOrder, removeDelivered = false) => {
    setOrders((prev) => {
      const updated = prev.map((order) =>
        order._id === nextOrder._id ? { ...order, ...nextOrder } : order
      );
      return removeDelivered
        ? updated.filter((order) => order.status !== "delivered")
        : updated;
    });
  };

  const runAction = async ({ key, request, successMessage, removeDelivered = false }) => {
    try {
      setActionKey(key);
      const res = await request();

      if (!res?.success || !res?.order) {
        throw new Error(res?.message || "Action failed");
      }

      patchOrder(res.order, removeDelivered);
      showToast(res?.message || successMessage, "success");
    } catch (err) {
      showToast(err.message || successMessage || "Action failed", "error");
    } finally {
      setActionKey("");
    }
  };

  const createAdminShipment = (orderId, groupId) =>
    runAction({
      key: `${orderId}:${groupId}:admin-create`,
      request: () =>
        api.post(`/orders/${orderId}/fulfillment-groups/${groupId}/admin-shipping/create`),
      successMessage: "Admin shipment created",
    });

  const syncAdminShipment = (orderId, groupId) =>
    runAction({
      key: `${orderId}:${groupId}:admin-sync`,
      request: () =>
        api.post(`/orders/${orderId}/fulfillment-groups/${groupId}/admin-shipping/sync`),
      successMessage: "Admin shipment synced",
    });

  const startSupplierFulfillment = (orderId, groupId, mode) =>
    runAction({
      key: `${orderId}:${groupId}:${mode}`,
      request: () =>
        api.post(`/orders/${orderId}/fulfillment-groups/${groupId}/supplier/start`, {
          mode,
          note:
            mode === "manual"
              ? window.prompt("Manual note for supplier handoff", "") || ""
              : "",
        }),
      successMessage:
        mode === "automated"
          ? "Supplier API triggered"
          : "Manual supplier handoff saved",
    });

  const updateSupplierGroup = (orderId, groupId, status) => {
    const trackingNumber =
      status === "shipped"
        ? window.prompt("Tracking number (optional)", "") || ""
        : "";
    const trackingUrl =
      status === "shipped"
        ? window.prompt("Tracking URL (optional)", "") || ""
        : "";
    const note = window.prompt("Add note (optional)", "") || "";

    return runAction({
      key: `${orderId}:${groupId}:${status}`,
      request: () =>
        api.post(`/orders/${orderId}/fulfillment-groups/${groupId}/supplier/status`, {
          status,
          note,
          trackingNumber,
          trackingUrl,
        }),
      successMessage: `Supplier group marked ${status}`,
      removeDelivered: status === "delivered",
    });
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
              Track admin shipping, supplier API fulfillment, notes, and tracking
              per fulfillment group.
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
        <StatCard icon={<ShoppingBag size={20} />} label="Total Orders" value={stats.totalOrders} />
        <StatCard icon={<WalletCards size={20} />} label="Revenue" value={formatMoney(stats.totalRevenue)} />
        <StatCard icon={<CreditCard size={20} />} label="Paid Rate" value={`${stats.paidRate}%`} />
      </section>

      <div className="space-y-4">
        {orders.map((order) => (
          <article
            key={order._id}
            className="rounded-3xl border bg-white p-5 shadow-sm"
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-lg font-semibold text-slate-900">
                    #{order.orderId || order._id.slice(-6)}
                  </h2>
                  <StatusPill status={order.status} />
                </div>
                <p className="text-sm text-slate-600">
                  {order.user?.name || "Guest"} • {order.paymentMethod || "Online"} • {formatMoney(order.totalAmount || 0)}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button className="rounded-full border border-slate-200 p-2 text-slate-600 transition hover:border-slate-300 hover:text-slate-900">
                  <Eye size={16} />
                </button>
                <button
                  onClick={() => downloadInvoice(order._id)}
                  className="rounded-full border border-emerald-200 bg-emerald-50 p-2 text-emerald-700 transition hover:border-emerald-300"
                >
                  <FileText size={16} />
                </button>
              </div>
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              {(order.fulfillmentGroups || []).map((group) => (
                <div
                  key={group.groupId}
                  className="rounded-3xl border border-slate-200 bg-slate-50/70 p-4"
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${group.channel === "admin" ? "bg-slate-900 text-white" : "bg-sky-100 text-sky-700"}`}>
                          {group.channel === "admin" ? "Admin Fulfillment" : "Supplier Fulfillment"}
                        </span>
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                          {String(group.status || "not_started").replace(/_/g, " ")}
                        </span>
                        {group.mode && group.mode !== "none" ? (
                          <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                            {group.mode}
                          </span>
                        ) : null}
                      </div>

                      <p className="text-sm font-semibold text-slate-800">
                        {group.channel === "supplier"
                          ? group.supplier?.name || "Supplier"
                          : "Store Shipping Team"}
                      </p>

                      <div className="space-y-1 text-sm text-slate-600">
                        <p>Items: {getGroupItemNames(order, group)}</p>
                        {group.shipment?.awbCode ? <p>AWB: {group.shipment.awbCode}</p> : null}
                        {group.trackingNumber ? <p>Tracking: {group.trackingNumber}</p> : null}
                        {group.trackingUrl ? (
                          <a
                            href={group.trackingUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sky-700 hover:underline"
                          >
                            Open tracking
                          </a>
                        ) : null}
                        {group.note ? (
                          <p className="rounded-2xl bg-white px-3 py-2 text-sm text-slate-600">
                            {group.note}
                          </p>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 lg:max-w-[260px] lg:justify-end">
                      <GroupActions
                        order={order}
                        group={group}
                        actionKey={actionKey}
                        onCreateAdminShipment={createAdminShipment}
                        onSyncAdminShipment={syncAdminShipment}
                        onStartSupplierFulfillment={startSupplierFulfillment}
                        onUpdateSupplierGroup={updateSupplierGroup}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function GroupActions({
  order,
  group,
  actionKey,
  onCreateAdminShipment,
  onSyncAdminShipment,
  onStartSupplierFulfillment,
  onUpdateSupplierGroup,
}) {
  const orderId = order._id;
  const groupId = group.groupId;

  if (group.channel === "admin") {
    return (
      <>
        {!group.shipment?.awbCode ? (
          <button
            onClick={() => onCreateAdminShipment(orderId, groupId)}
            disabled={actionKey === `${orderId}:${groupId}:admin-create`}
            className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700 transition hover:border-indigo-300 disabled:opacity-60"
          >
            {actionKey === `${orderId}:${groupId}:admin-create`
              ? "Creating..."
              : "Create Admin Shipment"}
          </button>
        ) : (
          <button
            onClick={() => onSyncAdminShipment(orderId, groupId)}
            disabled={actionKey === `${orderId}:${groupId}:admin-sync`}
            className="rounded-full border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-semibold text-sky-700 transition hover:border-sky-300 disabled:opacity-60"
          >
            {actionKey === `${orderId}:${groupId}:admin-sync`
              ? "Syncing..."
              : "Sync Admin Tracking"}
          </button>
        )}
      </>
    );
  }

  if (group.status === "not_started") {
    return (
      <>
        <button
          onClick={() => onStartSupplierFulfillment(orderId, groupId, "manual")}
          disabled={actionKey === `${orderId}:${groupId}:manual`}
          className="rounded-full border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 transition hover:border-amber-300 disabled:opacity-60"
        >
          {actionKey === `${orderId}:${groupId}:manual` ? "Saving..." : "Manual Supplier"}
        </button>
        <button
          onClick={() => onStartSupplierFulfillment(orderId, groupId, "automated")}
          disabled={actionKey === `${orderId}:${groupId}:automated`}
          className="rounded-full border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-semibold text-sky-700 transition hover:border-sky-300 disabled:opacity-60"
        >
          {actionKey === `${orderId}:${groupId}:automated` ? "Calling API..." : "API to Supplier"}
        </button>
      </>
    );
  }

  if (group.status === "requested") {
    return (
      <button
        onClick={() => onUpdateSupplierGroup(orderId, groupId, "shipped")}
        disabled={actionKey === `${orderId}:${groupId}:shipped`}
        className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700 transition hover:border-indigo-300 disabled:opacity-60"
      >
        {actionKey === `${orderId}:${groupId}:shipped` ? "Updating..." : "Mark Supplier Shipped"}
      </button>
    );
  }

  if (group.status === "shipped") {
    return (
      <button
        onClick={() => onUpdateSupplierGroup(orderId, groupId, "delivered")}
        disabled={actionKey === `${orderId}:${groupId}:delivered`}
        className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:border-emerald-300 disabled:opacity-60"
      >
        {actionKey === `${orderId}:${groupId}:delivered` ? "Updating..." : "Mark Supplier Delivered"}
      </button>
    );
  }

  return null;
}

function getGroupItemNames(order, group) {
  const productIds = new Set((group.productIds || []).map((id) => String(id)));
  return (order.items || [])
    .filter((item) => productIds.has(String(item.product?._id || item.product)))
    .map((item) => `${item.product?.name || "Product"} x${item.quantity}`)
    .join(", ");
}

function StatCard({ icon, label, value }) {
  return (
    <div className="rounded-3xl border bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="rounded-2xl bg-slate-900 p-2 text-white">{icon}</div>
      </div>
      <p className="mt-4 text-xs uppercase tracking-[0.2em] text-slate-500">{label}</p>
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
    <span className={`inline-flex w-fit items-center rounded-full border px-3 py-1 text-xs font-semibold ${tone}`}>
      {safeStatus}
    </span>
  );
}
