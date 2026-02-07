import { useEffect, useState } from "react";
import {
  TrendingUp,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Sparkles,
} from "lucide-react";
import { api } from "../services/api";

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [profitData, setProfitData] = useState(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.get("/admin/dashboard");
        console.log(res)
        if (!res?.success) {
          throw new Error(res.data?.message || "Failed to load dashboard");
        }

        const { totalRevenue, totalExpenses } = res.data;

        const netProfit = totalRevenue - totalExpenses;
        const profitMargin =
          totalRevenue > 0
            ? ((netProfit / totalRevenue) * 100).toFixed(1)
            : "0.0";

        setProfitData({
          totalRevenue,
          totalExpenses,
          netProfit,
          profitMargin,
          monthlyChange: res.data.monthlyChange || "+0%",
        });
      } catch (err) {
        setError(err.response?.data?.message || err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) {
    return <p className="text-center text-slate-500">Loading dashboard...</p>;
  }

  if (error) {
    return <p className="text-center text-red-600">{error}</p>;
  }

  const profitBreakdown = [
    {
      category: "Revenue",
      amount: profitData.totalRevenue,
      color: "bg-emerald-500",
    },
    {
      category: "Expenses",
      amount: profitData.totalExpenses,
      color: "bg-rose-500",
    },
    {
      category: "Net Profit",
      amount: profitData.netProfit,
      color: "bg-sky-500",
    },
  ];

  const formatMoney = (value) => `INR ${value.toLocaleString("en-IN")}`;
  const revenueSafe = profitData.totalRevenue || 1;

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-6 py-8 text-white shadow-sm">
        <div className="pointer-events-none absolute -left-10 -top-16 h-48 w-48 rounded-full bg-emerald-500/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 right-0 h-56 w-56 rounded-full bg-sky-500/30 blur-3xl" />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1 text-xs uppercase tracking-[0.2em] text-emerald-100">
              <Sparkles size={14} />
              Live Profit Snapshot
            </div>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Profit Dashboard
            </h1>
            <p className="max-w-xl text-sm text-slate-200/80 sm:text-base">
              A clear view of revenue health, cost pressure, and profitability
              momentum across the month.
            </p>
          </div>

          <div className="rounded-2xl bg-white/10 p-4 text-center shadow-inner sm:p-6">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-200/80">
              Net Profit
            </p>
            <p className="mt-2 text-2xl font-semibold sm:text-3xl">
              {formatMoney(profitData.netProfit)}
            </p>
            <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-3 py-1 text-xs text-emerald-100">
              <ArrowUpRight size={14} />
              {profitData.monthlyChange} vs last month
            </p>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <MetricCard
          accent="from-emerald-500/20 via-emerald-500/5 to-transparent"
          icon={<Wallet size={26} />}
          title="Total Revenue"
          value={formatMoney(profitData.totalRevenue)}
          subtitle="Gross revenue captured"
          trend="up"
        />
        <MetricCard
          accent="from-sky-500/20 via-sky-500/5 to-transparent"
          icon={<TrendingUp size={26} />}
          title="Profit Margin"
          value={`${profitData.profitMargin}%`}
          subtitle="Revenue retained as profit"
          trend="neutral"
        />
        <MetricCard
          accent="from-rose-500/20 via-rose-500/5 to-transparent"
          icon={<DollarSign size={26} />}
          title="Total Expenses"
          value={formatMoney(profitData.totalExpenses)}
          subtitle="Costs and overhead"
          trend="down"
        />
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="rounded-3xl border bg-white p-6 shadow-sm lg:col-span-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-800">
                Profit Breakdown
              </h3>
              <p className="text-sm text-slate-500">
                Revenue split into expenses and net profit.
              </p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
              Month to date
            </span>
          </div>

          <div className="mt-6 space-y-5">
            {profitBreakdown.map((item) => {
              const percentage = Math.min(
                100,
                Math.max(0, (item.amount / revenueSafe) * 100)
              ).toFixed(0);

              return (
                <div key={item.category} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-3">
                      <div className={`h-3 w-3 rounded-full ${item.color}`} />
                      <span className="font-medium text-slate-700">
                        {item.category}
                      </span>
                    </div>
                    <span className="font-semibold text-slate-800">
                      {formatMoney(item.amount)}
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100">
                    <div
                      className={`h-2 rounded-full ${item.color}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-3xl border bg-white p-6 shadow-sm lg:col-span-2">
          <h3 className="text-lg font-semibold text-slate-800">
            Net Profit Pulse
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Keep an eye on the cash engine driving growth.
          </p>

          <div className="mt-6 space-y-4">
            <PulseCard
              label="Net Profit"
              value={formatMoney(profitData.netProfit)}
              tone="emerald"
              icon={<ArrowUpRight size={18} />}
            />
            <PulseCard
              label="Expenses Pressure"
              value={formatMoney(profitData.totalExpenses)}
              tone="rose"
              icon={<ArrowDownRight size={18} />}
            />
            <PulseCard
              label="Revenue Strength"
              value={formatMoney(profitData.totalRevenue)}
              tone="sky"
              icon={<TrendingUp size={18} />}
            />
          </div>
        </div>
      </section>
    </div>
  );
}

/* ---------- Small Component ---------- */

function MetricCard({ accent, icon, title, value, subtitle, trend }) {
  const trendStyles =
    trend === "up"
      ? "text-emerald-600 bg-emerald-50"
      : trend === "down"
      ? "text-rose-600 bg-rose-50"
      : "text-slate-500 bg-slate-100";

  return (
    <div className="relative overflow-hidden rounded-3xl border bg-white p-6 shadow-sm">
      <div className={`absolute inset-0 bg-gradient-to-br ${accent}`} />
      <div className="relative flex items-start justify-between gap-4">
        <div className="rounded-2xl bg-slate-900 p-2 text-white">
          {icon}
        </div>
        <span className={`rounded-full px-3 py-1 text-xs ${trendStyles}`}>
          {trend === "up" ? "Growing" : trend === "down" ? "Rising" : "Stable"}
        </span>
      </div>
      <div className="relative mt-6 space-y-2">
        <p className="text-sm uppercase tracking-[0.2em] text-slate-500">
          {title}
        </p>
        <p className="text-2xl font-semibold text-slate-900">{value}</p>
        <p className="text-sm text-slate-500">{subtitle}</p>
      </div>
    </div>
  );
}

function PulseCard({ label, value, tone, icon }) {
  const tones = {
    emerald: "bg-emerald-50 text-emerald-700",
    rose: "bg-rose-50 text-rose-700",
    sky: "bg-sky-50 text-sky-700",
  };

  return (
    <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-3">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
          {label}
        </p>
        <p className="mt-1 text-lg font-semibold text-slate-800">
          {value}
        </p>
      </div>
      <div className={`rounded-full px-3 py-2 text-xs ${tones[tone]}`}>
        <span className="flex items-center gap-2 font-semibold">
          {icon}
          Live
        </span>
      </div>
    </div>
  );
}
