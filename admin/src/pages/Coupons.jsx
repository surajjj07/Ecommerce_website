import { useEffect, useMemo, useState } from "react";
import { BadgePercent, Pencil, Plus, Power, Trash2 } from "lucide-react";
import { couponApi } from "../services/api";
import { useToast } from "../context/ToastContext";

const initialForm = {
  code: "",
  description: "",
  type: "percent",
  value: "",
  minOrderAmount: "",
  maxDiscount: "",
  usageLimit: "",
  startsAt: "",
  expiresAt: "",
  isActive: true,
};

const formatDateTimeInput = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
};

export default function Coupons() {
  const { showToast } = useToast();
  const [coupons, setCoupons] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadCoupons = async () => {
      try {
        const res = await couponApi.getAllCoupons();
        setCoupons(res?.coupons || []);
      } catch (error) {
        showToast(error.message || "Failed to load coupons", "error");
      } finally {
        setLoading(false);
      }
    };

    loadCoupons();
  }, [showToast]);

  const stats = useMemo(() => {
    const now = new Date();
    return {
      total: coupons.length,
      active: coupons.filter((coupon) => coupon.isActive).length,
      scheduled: coupons.filter(
        (coupon) => coupon.startsAt && new Date(coupon.startsAt) > now
      ).length,
      expired: coupons.filter(
        (coupon) => coupon.expiresAt && new Date(coupon.expiresAt) < now
      ).length,
    };
  }, [coupons]);

  const resetForm = () => {
    setForm(initialForm);
    setEditingId("");
  };

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);

    const payload = {
      ...form,
      code: form.code.trim().toUpperCase(),
      value: Number(form.value || 0),
      minOrderAmount: Number(form.minOrderAmount || 0),
      maxDiscount: Number(form.type === "percent" ? form.maxDiscount || 0 : 0),
      usageLimit: Number(form.usageLimit || 0),
      startsAt: form.startsAt || null,
      expiresAt: form.expiresAt || null,
    };

    try {
      const res = editingId
        ? await couponApi.updateCoupon(editingId, payload)
        : await couponApi.createCoupon(payload);
      const nextCoupon = res?.coupon;

      if (!nextCoupon) {
        throw new Error(res?.message || "Failed to save coupon");
      }

      setCoupons((prev) =>
        editingId
          ? prev.map((coupon) => (coupon._id === editingId ? nextCoupon : coupon))
          : [nextCoupon, ...prev]
      );
      showToast(res?.message || "Coupon saved", "success");
      resetForm();
    } catch (error) {
      showToast(error.message || "Failed to save coupon", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (coupon) => {
    setEditingId(coupon._id);
    setForm({
      code: coupon.code || "",
      description: coupon.description || "",
      type: coupon.type || "percent",
      value: String(coupon.value ?? ""),
      minOrderAmount: String(coupon.minOrderAmount ?? ""),
      maxDiscount: String(coupon.maxDiscount ?? ""),
      usageLimit: String(coupon.usageLimit ?? ""),
      startsAt: formatDateTimeInput(coupon.startsAt),
      expiresAt: formatDateTimeInput(coupon.expiresAt),
      isActive: Boolean(coupon.isActive),
    });
  };

  const handleToggle = async (coupon) => {
    try {
      const res = await couponApi.updateCoupon(coupon._id, {
        ...coupon,
        isActive: !coupon.isActive,
      });
      setCoupons((prev) =>
        prev.map((item) => (item._id === coupon._id ? res.coupon : item))
      );
      showToast(res?.message || "Coupon updated", "success");
      if (editingId === coupon._id) {
        handleEdit(res.coupon);
      }
    } catch (error) {
      showToast(error.message || "Failed to update coupon", "error");
    }
  };

  const handleDelete = async (couponId) => {
    try {
      const res = await couponApi.deleteCoupon(couponId);
      setCoupons((prev) => prev.filter((coupon) => coupon._id !== couponId));
      if (editingId === couponId) {
        resetForm();
      }
      showToast(res?.message || "Coupon deleted", "success");
    } catch (error) {
      showToast(error.message || "Failed to delete coupon", "error");
    }
  };

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <section className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-6 py-8 text-white shadow-sm">
        <div className="pointer-events-none absolute -left-10 -top-16 h-48 w-48 rounded-full bg-amber-500/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 right-0 h-56 w-56 rounded-full bg-emerald-500/25 blur-3xl" />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1 text-xs uppercase tracking-[0.2em] text-amber-100">
              <BadgePercent size={14} />
              Revenue Boosters
            </div>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Coupon Manager
            </h1>
            <p className="max-w-2xl text-sm text-slate-200/85 sm:text-base">
              Create store-specific discounts with expiry, minimum order rules,
              and usage limits. Checkout validation will use these exact rules.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 rounded-2xl bg-white/10 p-4 shadow-inner sm:p-5">
            <MiniStat label="Total" value={stats.total} />
            <MiniStat label="Active" value={stats.active} tone="ok" />
            <MiniStat label="Scheduled" value={stats.scheduled} />
            <MiniStat label="Expired" value={stats.expired} tone="warn" />
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_1.4fr]">
        <form onSubmit={handleSubmit} className="rounded-3xl border bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                {editingId ? "Edit Coupon" : "Create Coupon"}
              </h2>
              <p className="text-sm text-slate-500">
                Keep codes simple, memorable, and store-specific.
              </p>
            </div>
            {editingId ? (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300"
              >
                New Coupon
              </button>
            ) : null}
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input label="Coupon Code" name="code" value={form.code} onChange={handleChange} placeholder="SAVE10" required />
            <Input label="Description" name="description" value={form.description} onChange={handleChange} placeholder="10% off on all orders" />
            <Select label="Discount Type" name="type" value={form.type} onChange={handleChange}>
              <option value="percent">Percentage</option>
              <option value="flat">Flat Amount</option>
            </Select>
            <Input
              label={form.type === "percent" ? "Discount Value (%)" : "Discount Value (INR)"}
              name="value"
              type="number"
              min="0"
              step="0.01"
              value={form.value}
              onChange={handleChange}
              placeholder={form.type === "percent" ? "10" : "200"}
              required
            />
            <Input
              label="Minimum Order Amount (INR)"
              name="minOrderAmount"
              type="number"
              min="0"
              step="0.01"
              value={form.minOrderAmount}
              onChange={handleChange}
              placeholder="999"
            />
            <Input
              label="Usage Limit"
              name="usageLimit"
              type="number"
              min="0"
              step="1"
              value={form.usageLimit}
              onChange={handleChange}
              placeholder="0 for unlimited"
            />
            {form.type === "percent" ? (
              <Input
                label="Max Discount Cap (INR)"
                name="maxDiscount"
                type="number"
                min="0"
                step="0.01"
                value={form.maxDiscount}
                onChange={handleChange}
                placeholder="500"
              />
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                Flat coupons automatically cap at the order value.
              </div>
            )}
            <Input label="Starts At" name="startsAt" type="datetime-local" value={form.startsAt} onChange={handleChange} />
            <Input label="Expires At" name="expiresAt" type="datetime-local" value={form.expiresAt} onChange={handleChange} />
          </div>

          <label className="mt-4 flex cursor-pointer items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div>
              <p className="text-sm font-semibold text-slate-800">Coupon Active</p>
              <p className="text-xs text-slate-500">
                Inactive coupons stay saved but cannot be applied at checkout.
              </p>
            </div>
            <input
              type="checkbox"
              name="isActive"
              checked={form.isActive}
              onChange={handleChange}
              className="h-4 w-4 accent-slate-900"
            />
          </label>

          <button
            type="submit"
            disabled={saving}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
          >
            <Plus size={16} />
            {saving ? "Saving..." : editingId ? "Update Coupon" : "Create Coupon"}
          </button>
        </form>

        <section className="rounded-3xl border bg-white p-6 shadow-sm">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Live Coupons</h2>
            <p className="text-sm text-slate-500">
              Every code here is available for this admin store only.
            </p>
          </div>

          {loading ? (
            <p className="mt-6 text-sm text-slate-500">Loading coupons...</p>
          ) : coupons.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-10 text-center text-sm text-slate-500">
              No coupons created yet.
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {coupons.map((coupon) => (
                <article key={coupon._id} className="rounded-3xl border border-slate-200 bg-slate-50/60 p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold tracking-[0.18em] text-white">
                          {coupon.code}
                        </span>
                        <StatusBadge coupon={coupon} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {coupon.type === "percent"
                            ? `${coupon.value}% off`
                            : `INR ${Number(coupon.value || 0).toLocaleString("en-IN")} off`}
                        </p>
                        <p className="text-sm text-slate-500">
                          {coupon.description || "No description added"}
                        </p>
                      </div>
                      <div className="grid grid-cols-1 gap-2 text-xs text-slate-600 sm:grid-cols-2">
                        <InfoPill label="Min Order" value={`INR ${Number(coupon.minOrderAmount || 0).toLocaleString("en-IN")}`} />
                        <InfoPill
                          label="Usage"
                          value={coupon.usageLimit > 0 ? `${coupon.usedCount}/${coupon.usageLimit}` : `${coupon.usedCount} used`}
                        />
                        <InfoPill label="Starts" value={coupon.startsAt ? new Date(coupon.startsAt).toLocaleString() : "Immediate"} />
                        <InfoPill label="Expires" value={coupon.expiresAt ? new Date(coupon.expiresAt).toLocaleString() : "No expiry"} />
                        {coupon.type === "percent" ? (
                          <InfoPill
                            label="Max Cap"
                            value={coupon.maxDiscount > 0 ? `INR ${Number(coupon.maxDiscount).toLocaleString("en-IN")}` : "No cap"}
                          />
                        ) : null}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleEdit(coupon)}
                        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300"
                      >
                        <Pencil size={14} />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggle(coupon)}
                        className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-semibold text-amber-700 transition hover:border-amber-300"
                      >
                        <Power size={14} />
                        {coupon.isActive ? "Disable" : "Enable"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(coupon._id)}
                        className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-700 transition hover:border-rose-300"
                      >
                        <Trash2 size={14} />
                        Delete
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function MiniStat({ label, value, tone = "neutral" }) {
  const toneClass =
    tone === "ok"
      ? "text-emerald-100 bg-emerald-500/20"
      : tone === "warn"
      ? "text-amber-100 bg-amber-500/20"
      : "text-slate-100 bg-white/5";

  return (
    <div className={`rounded-xl px-3 py-3 ${toneClass}`}>
      <p className="text-[10px] uppercase tracking-[0.18em] opacity-80">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  );
}

function Input({ label, ...props }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </span>
      <input
        className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-[0_8px_20px_-12px_rgba(15,23,42,0.35)] outline-none transition focus:border-slate-900 focus:ring-4 focus:ring-slate-200/60"
        {...props}
      />
    </label>
  );
}

function Select({ label, children, ...props }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </span>
      <select
        className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-[0_8px_20px_-12px_rgba(15,23,42,0.35)] outline-none transition focus:border-slate-900 focus:ring-4 focus:ring-slate-200/60"
        {...props}
      >
        {children}
      </select>
    </label>
  );
}

function InfoPill({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2">
      <p className="text-[10px] uppercase tracking-[0.16em] text-slate-400">{label}</p>
      <p className="mt-1 text-xs font-semibold text-slate-700">{value}</p>
    </div>
  );
}

function StatusBadge({ coupon }) {
  const now = new Date();
  const startsAt = coupon.startsAt ? new Date(coupon.startsAt) : null;
  const expiresAt = coupon.expiresAt ? new Date(coupon.expiresAt) : null;

  let tone = "bg-emerald-50 text-emerald-700 border-emerald-100";
  let label = "Active";

  if (!coupon.isActive) {
    tone = "bg-slate-100 text-slate-600 border-slate-200";
    label = "Inactive";
  } else if (startsAt && startsAt > now) {
    tone = "bg-sky-50 text-sky-700 border-sky-100";
    label = "Scheduled";
  } else if (expiresAt && expiresAt < now) {
    tone = "bg-rose-50 text-rose-700 border-rose-100";
    label = "Expired";
  }

  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${tone}`}>
      {label}
    </span>
  );
}
