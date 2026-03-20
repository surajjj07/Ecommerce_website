import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, ShieldCheck, Sparkles, Store, UserPlus } from "lucide-react";
import { api } from "../services/api";
import { useToast } from "../context/ToastContext";

export default function AdminSignup() {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        name: "",
        email: "",
        password: "",
    });

    const handleChange = (event) => {
        setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);

        try {
            const res = await api.post("/admin/signup", form);

            if (!res?.admin?.id) {
                throw new Error(res?.message || "Signup failed");
            }

            showToast("Admin account created", "success");
            navigate("/login");
        } catch (error) {
            showToast(error.message || "Signup failed", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_#1e293b_0%,_#0f172a_42%,_#020617_100%)] text-white antialiased">
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute left-[-10%] top-16 h-72 w-72 rounded-full bg-cyan-400/15 blur-3xl" />
                <div className="absolute bottom-[-5%] right-[-5%] h-96 w-96 rounded-full bg-amber-400/10 blur-3xl" />
                <div className="absolute left-1/2 top-1/3 h-56 w-56 -translate-x-1/2 rounded-full bg-indigo-500/10 blur-3xl" />
            </div>

            <div className="relative mx-auto flex min-h-screen max-w-7xl items-center px-6 py-10 lg:px-10">
                <div className="grid w-full gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
                    <section className="hidden rounded-[2rem] border border-white/10 bg-white/[0.05] p-8 shadow-[0_30px_80px_-40px_rgba(0,0,0,0.8)] lg:block xl:p-10">
                        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-cyan-100">
                            <Sparkles size={14} />
                            Admin Onboarding
                        </div>

                        <h1 className="mt-6 max-w-xl text-4xl font-semibold tracking-tight text-white xl:text-5xl">
                            Launch a clean admin workspace for store operations.
                        </h1>
                        <p className="mt-5 max-w-2xl text-base leading-7 text-slate-200">
                            Create your admin identity and step into a focused dashboard for products,
                            orders, invoices, customers, and daily business controls.
                        </p>

                        <div className="mt-10 grid gap-4 sm:grid-cols-3">
                            <FeatureCard
                                icon={<Store size={18} />}
                                title="Catalog Ready"
                                text="Start managing products, categories, and pricing instantly."
                            />
                            <FeatureCard
                                icon={<ShieldCheck size={18} />}
                                title="Protected Access"
                                text="Admin-only access to operational controls and store settings."
                            />
                            <FeatureCard
                                icon={<UserPlus size={18} />}
                                title="Quick Setup"
                                text="Create your account and move directly into dashboard workflows."
                            />
                        </div>
                    </section>

                    <section className="mx-auto w-full max-w-md rounded-[2rem] border border-slate-200 bg-white p-7 text-slate-950 shadow-[0_30px_80px_-35px_rgba(15,23,42,0.75)] xl:p-8">
                        <div className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-white">
                            <UserPlus size={14} />
                            Create Admin
                        </div>

                        <h2 className="mt-5 text-3xl font-bold tracking-tight text-slate-950">
                            Set up your admin account
                        </h2>
                        <p className="mt-2 text-sm leading-6 text-slate-600">
                            Create a secure admin identity to access orders, products, shipping, and store settings.
                        </p>

                        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                            <Input
                                label="Full Name"
                                name="name"
                                value={form.name}
                                onChange={handleChange}
                                placeholder="Store admin name"
                                required
                            />
                            <Input
                                label="Email Address"
                                name="email"
                                type="email"
                                value={form.email}
                                onChange={handleChange}
                                placeholder="admin@store.com"
                                required
                            />
                            <Input
                                label="Password"
                                name="password"
                                type="password"
                                value={form.password}
                                onChange={handleChange}
                                placeholder="Create a secure password"
                                required
                            />

                            <button
                                type="submit"
                                disabled={loading}
                                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {loading ? "Creating..." : "Create Admin Account"}
                                {!loading ? <ArrowRight size={16} /> : null}
                            </button>
                        </form>

                        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700">
                            This account will be used to manage store operations, customer orders, and admin-level controls.
                        </div>

                        <p className="mt-6 text-center text-sm text-slate-600">
                            Already have an account?{" "}
                            <Link to="/login" className="font-semibold text-slate-900 hover:text-indigo-600">
                                Login
                            </Link>
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}

function Input({ label, ...props }) {
    return (
        <label className="block">
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">
                {label}
            </span>
            <input
                className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-[15px] font-medium text-slate-950 shadow-[0_10px_24px_-18px_rgba(15,23,42,0.3)] outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:ring-4 focus:ring-slate-200/70"
                {...props}
            />
        </label>
    );
}

function FeatureCard({ icon, title, text }) {
    return (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <div className="inline-flex rounded-2xl bg-white/10 p-2 text-cyan-100">{icon}</div>
            <h3 className="mt-4 text-lg font-semibold text-white">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-200">{text}</p>
        </div>
    );
}
