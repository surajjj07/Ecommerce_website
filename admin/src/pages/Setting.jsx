import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  CreditCard,
  Shield,
  Store,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { api } from "../services/api";

const initialSettings = {
  storeName: "",
  storeEmail: "",
  phone: "",
  codEnabled: true,
  onlinePaymentEnabled: true,
  orderEmailNotify: true,
  orderSmsNotify: false,
};

export default function Settings() {
  const [settings, setSettings] = useState(initialSettings);
  const [snapshot, setSnapshot] = useState(initialSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get("/admin/settings");
        if (!res?.success) {
          throw new Error(res?.message || "Failed to load settings");
        }

        const next = { ...initialSettings, ...(res.settings || {}) };
        setSettings(next);
        setSnapshot(next);
      } catch (err) {
        setError(err.message || "Failed to load settings");
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const hasChanges = useMemo(
    () => JSON.stringify(settings) !== JSON.stringify(snapshot),
    [settings, snapshot]
  );

  const enabledCount = useMemo(() => {
    const flags = [
      settings.codEnabled,
      settings.onlinePaymentEnabled,
      settings.orderEmailNotify,
      settings.orderSmsNotify,
    ];
    return flags.filter(Boolean).length;
  }, [settings]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await api.put("/admin/settings", settings);
      if (!res?.success) {
        throw new Error(res?.message || "Failed to save settings");
      }

      setSnapshot(settings);
      alert("Settings saved successfully");
    } catch (err) {
      alert(err.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="text-center text-slate-500">Loading settings...</p>;
  }

  if (error) {
    return <p className="text-center text-rose-600">{error}</p>;
  }

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <section className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-6 py-8 text-white shadow-sm">
        <div className="pointer-events-none absolute -left-10 -top-16 h-48 w-48 rounded-full bg-cyan-500/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 right-0 h-56 w-56 rounded-full bg-emerald-500/30 blur-3xl" />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1 text-xs uppercase tracking-[0.2em] text-cyan-100">
              <Sparkles size={14} />
              Control Center
            </div>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Store Settings
            </h1>
            <p className="max-w-2xl text-sm text-slate-200/85 sm:text-base">
              Refine payment preferences, notification flows, and brand profile
              from one premium command panel.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 rounded-2xl bg-white/10 p-4 shadow-inner sm:p-5">
            <MiniStat label="Switches On" value={`${enabledCount}/4`} />
            <MiniStat
              label="State"
              value={hasChanges ? "Unsaved" : "Synced"}
              tone={hasChanges ? "warn" : "ok"}
            />
          </div>
        </div>
      </section>

      <form onSubmit={handleSave} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card
            icon={<Store size={18} />}
            title="Store Identity"
            subtitle="Core details shown across invoices, emails, and customer communication."
          >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Input
                label="Store Name"
                name="storeName"
                value={settings.storeName}
                onChange={handleChange}
                placeholder="Urban Avenue"
              />
              <Input
                label="Store Email"
                name="storeEmail"
                type="email"
                value={settings.storeEmail}
                onChange={handleChange}
                placeholder="hello@urbanavenue.com"
              />
            </div>
            <Input
              label="Contact Number"
              name="phone"
              value={settings.phone}
              onChange={handleChange}
              placeholder="+91 98765 43210"
            />
          </Card>

          <Card
            icon={<CreditCard size={18} />}
            title="Payments"
            subtitle="Control which payment rails are available at checkout."
          >
            <div className="space-y-3">
              <SwitchRow
                label="Cash on Delivery"
                hint="Allow customers to pay when order arrives."
                name="codEnabled"
                checked={settings.codEnabled}
                onChange={handleChange}
              />
              <SwitchRow
                label="Online Payments"
                hint="Enable card, UPI, wallet, and gateways."
                name="onlinePaymentEnabled"
                checked={settings.onlinePaymentEnabled}
                onChange={handleChange}
              />
            </div>
          </Card>

          <Card
            icon={<Bell size={18} />}
            title="Notifications"
            subtitle="Choose where your order alerts are delivered."
          >
            <div className="space-y-3">
              <SwitchRow
                label="Order Email Alerts"
                hint="Send email updates for newly placed orders."
                name="orderEmailNotify"
                checked={settings.orderEmailNotify}
                onChange={handleChange}
              />
              <SwitchRow
                label="Order SMS Alerts"
                hint="Send SMS updates for newly placed orders."
                name="orderSmsNotify"
                checked={settings.orderSmsNotify}
                onChange={handleChange}
              />
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card
            icon={<Shield size={18} />}
            title="Security"
            subtitle="Password controls are reserved for the next backend release."
          >
            <div className="space-y-3">
              <Input label="Current Password" type="password" disabled />
              <Input label="New Password" type="password" disabled />
              <Input label="Confirm New Password" type="password" disabled />
            </div>
            <p className="text-xs text-slate-500">
              Security update API is not wired yet. These fields are display-only.
            </p>
          </Card>

          <div className="rounded-3xl border bg-white p-5 shadow-sm">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
              Save Status
            </p>
            <div className="mt-3 flex items-center gap-2 text-sm text-slate-700">
              <CheckCircle2
                size={16}
                className={hasChanges ? "text-amber-500" : "text-emerald-600"}
              />
              <span>{hasChanges ? "You have unsaved changes" : "All changes saved"}</span>
            </div>
            <button
              type="submit"
              disabled={saving}
              className="mt-4 w-full rounded-2xl bg-slate-900 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save Settings"}
            </button>
          </div>
        </div>
      </form>
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

function Card({ icon, title, subtitle, children }) {
  return (
    <div className="rounded-3xl border bg-white p-6 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="rounded-2xl bg-slate-900 p-2 text-white">{icon}</div>
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <p className="text-sm text-slate-500">{subtitle}</p>
        </div>
      </div>
      <div className="mt-5 space-y-4">{children}</div>
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
        className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-[0_8px_20px_-12px_rgba(15,23,42,0.35)] outline-none transition focus:border-slate-900 focus:ring-4 focus:ring-slate-200/60 disabled:cursor-not-allowed disabled:bg-slate-100"
        {...props}
      />
    </label>
  );
}

function SwitchRow({ label, hint, name, checked, onChange }) {
  return (
    <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
      <div>
        <p className="text-sm font-semibold text-slate-800">{label}</p>
        <p className="text-xs text-slate-500">{hint}</p>
      </div>

      <span className="relative inline-flex items-center">
        <input
          type="checkbox"
          name={name}
          checked={checked}
          onChange={onChange}
          className="peer sr-only"
        />
        <span className="h-7 w-12 rounded-full bg-slate-300 transition peer-checked:bg-emerald-500" />
        <span className="absolute left-1 h-5 w-5 rounded-full bg-white shadow transition peer-checked:translate-x-5" />
      </span>
    </label>
  );
}
