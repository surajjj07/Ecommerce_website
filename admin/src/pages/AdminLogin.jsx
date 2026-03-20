import { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    ArrowRight,
    KeyRound,
    Mail,
    ShieldCheck,
    Sparkles,
    Store,
} from "lucide-react";
import AuthContext from "../context/CreateAuthContext";
import { adminApi, api } from "../services/api";
import { useToast } from "../context/ToastContext";

const initialResetState = {
    step: 1,
    email: "",
    otp: "",
    resetToken: "",
    newPassword: "",
    confirmPassword: "",
};

export default function AdminLogin() {
    const navigate = useNavigate();
    const { setAdmin } = useContext(AuthContext);
    const { showToast } = useToast();

    const [form, setForm] = useState({
        email: "",
        password: "",
    });
    const [loading, setLoading] = useState(false);
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [resetLoading, setResetLoading] = useState(false);
    const [resetForm, setResetForm] = useState(initialResetState);

    const handleChange = (event) => {
        setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
    };

    const handleResetChange = (event) => {
        setResetForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
    };

    const resetForgotPasswordFlow = () => {
        setResetForm(initialResetState);
        setShowForgotPassword(false);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);

        try {
            const response = await api.post("/admin/login", form);
            setAdmin(response?.admin || null);
            showToast("Login successful", "success");
            navigate("/");
        } catch (error) {
            showToast(error.message || "Login failed", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleRequestOtp = async (event) => {
        event.preventDefault();
        setResetLoading(true);

        try {
            const res = await adminApi.requestPasswordResetOtp({
                email: resetForm.email.trim().toLowerCase(),
            });
            showToast(res?.message || "OTP sent successfully", "success");
            setResetForm((prev) => ({ ...prev, step: 2 }));
        } catch (error) {
            showToast(error.message || "Failed to send OTP", "error");
        } finally {
            setResetLoading(false);
        }
    };

    const handleVerifyOtp = async (event) => {
        event.preventDefault();
        setResetLoading(true);

        try {
            const res = await adminApi.verifyPasswordResetOtp({
                email: resetForm.email.trim().toLowerCase(),
                otp: resetForm.otp.trim(),
            });
            if (!res?.resetToken) {
                throw new Error(res?.message || "Failed to verify OTP");
            }

            showToast(res?.message || "OTP verified", "success");
            setResetForm((prev) => ({
                ...prev,
                step: 3,
                resetToken: res.resetToken,
            }));
        } catch (error) {
            showToast(error.message || "OTP verification failed", "error");
        } finally {
            setResetLoading(false);
        }
    };

    const handleResetPassword = async (event) => {
        event.preventDefault();

        if (resetForm.newPassword.length < 6) {
            showToast("Password must be at least 6 characters", "error");
            return;
        }

        if (resetForm.newPassword !== resetForm.confirmPassword) {
            showToast("Passwords do not match", "error");
            return;
        }

        setResetLoading(true);

        try {
            const res = await adminApi.resetPasswordWithOtp({
                email: resetForm.email.trim().toLowerCase(),
                resetToken: resetForm.resetToken,
                newPassword: resetForm.newPassword,
            });

            showToast(res?.message || "Password reset successful", "success");
            resetForgotPasswordFlow();
        } catch (error) {
            showToast(error.message || "Password reset failed", "error");
        } finally {
            setResetLoading(false);
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
                            Admin Access
                        </div>

                        <h1 className="mt-6 max-w-xl text-4xl font-semibold tracking-tight text-white xl:text-5xl">
                            Run your store with sharper control and cleaner visibility.
                        </h1>
                        <p className="mt-5 max-w-2xl text-base leading-7 text-slate-200">
                            Manage orders, coupons, invoices, shipping, and customer activity from
                            one focused command center built for daily operations.
                        </p>

                        <div className="mt-10 grid gap-4 sm:grid-cols-3">
                            <FeatureCard
                                icon={<Store size={18} />}
                                title="Store Ops"
                                text="Products, categories, and settings tuned in one place."
                            />
                            <FeatureCard
                                icon={<ShieldCheck size={18} />}
                                title="Secure Flow"
                                text="Protected checkout, invoice, and order lifecycle controls."
                            />
                            <FeatureCard
                                icon={<Sparkles size={18} />}
                                title="Growth Ready"
                                text="Coupons, shipping sync, and reporting for scale."
                            />
                        </div>

                        <div className="mt-10 rounded-3xl border border-white/10 bg-slate-950/40 p-5">
                            <p className="text-xs uppercase tracking-[0.2em] text-slate-300">
                                Workspace
                            </p>
                            <div className="mt-4 flex items-end justify-between gap-4">
                                <div>
                                    <p className="text-3xl font-semibold text-white">Admin Dashboard</p>
                                    <p className="mt-2 text-sm text-slate-300">
                                        Login to review orders, monitor revenue, and keep fulfillment
                                        moving.
                                    </p>
                                </div>
                                <div className="rounded-2xl bg-white/10 px-4 py-3 text-right">
                                    <p className="text-xs uppercase tracking-[0.2em] text-slate-300">
                                        Status
                                    </p>
                                    <p className="mt-1 text-lg font-semibold text-emerald-300">
                                        Operational
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="mx-auto w-full max-w-md rounded-[2rem] border border-slate-200 bg-white p-7 text-slate-950 shadow-[0_30px_80px_-35px_rgba(15,23,42,0.75)] xl:p-8">
                        {!showForgotPassword ? (
                            <>
                                <div className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-white">
                                    <ShieldCheck size={14} />
                                    Sign In
                                </div>

                                <h2 className="mt-5 text-3xl font-bold tracking-tight text-slate-950">
                                    Welcome back
                                </h2>
                                <p className="mt-2 text-sm leading-6 text-slate-600">
                                    Access your admin panel to manage store activity, customer orders, and
                                    daily operations.
                                </p>

                                <form onSubmit={handleSubmit} className="mt-8 space-y-5">
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
                                        placeholder="Enter your password"
                                        required
                                    />

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setResetForm((prev) => ({
                                                ...prev,
                                                email: form.email || prev.email,
                                            }));
                                            setShowForgotPassword(true);
                                        }}
                                        className="text-sm font-semibold text-indigo-600 transition hover:text-indigo-700"
                                    >
                                        Forgot password?
                                    </button>

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {loading ? "Logging in..." : "Enter Dashboard"}
                                        {!loading ? <ArrowRight size={16} /> : null}
                                    </button>
                                </form>

                                <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700">
                                    Use your store admin credentials to continue. Only authorized admins
                                    can access order, invoice, and settings controls.
                                </div>

                                <p className="mt-6 text-center text-sm text-slate-600">
                                    Do not have an admin account?{" "}
                                    <Link to="/signup" className="font-semibold text-slate-900 hover:text-indigo-600">
                                        Create one
                                    </Link>
                                </p>
                            </>
                        ) : (
                            <>
                                <div className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-white">
                                    <KeyRound size={14} />
                                    Password Reset
                                </div>

                                <h2 className="mt-5 text-3xl font-bold tracking-tight text-slate-950">
                                    Reset admin password
                                </h2>
                                <p className="mt-2 text-sm leading-6 text-slate-600">
                                    Get an OTP on your registered admin email, verify it, and set a new password.
                                </p>

                                <StepIndicator step={resetForm.step} />

                                {resetForm.step === 1 ? (
                                    <form onSubmit={handleRequestOtp} className="mt-6 space-y-5">
                                        <Input
                                            label="Admin Email"
                                            name="email"
                                            type="email"
                                            value={resetForm.email}
                                            onChange={handleResetChange}
                                            placeholder="admin@store.com"
                                            required
                                        />

                                        <button
                                            type="submit"
                                            disabled={resetLoading}
                                            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                                        >
                                            <Mail size={16} />
                                            {resetLoading ? "Sending OTP..." : "Send OTP"}
                                        </button>
                                    </form>
                                ) : null}

                                {resetForm.step === 2 ? (
                                    <form onSubmit={handleVerifyOtp} className="mt-6 space-y-5">
                                        <Input
                                            label="Admin Email"
                                            name="email"
                                            type="email"
                                            value={resetForm.email}
                                            onChange={handleResetChange}
                                            placeholder="admin@store.com"
                                            required
                                        />
                                        <Input
                                            label="Email OTP"
                                            name="otp"
                                            value={resetForm.otp}
                                            onChange={handleResetChange}
                                            placeholder="Enter 6-digit OTP"
                                            required
                                        />

                                        <div className="grid grid-cols-2 gap-3">
                                            <button
                                                type="button"
                                                onClick={() => setResetForm((prev) => ({ ...prev, step: 1 }))}
                                                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300"
                                            >
                                                Back
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={resetLoading}
                                                className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
                                            >
                                                {resetLoading ? "Verifying..." : "Verify OTP"}
                                            </button>
                                        </div>
                                    </form>
                                ) : null}

                                {resetForm.step === 3 ? (
                                    <form onSubmit={handleResetPassword} className="mt-6 space-y-5">
                                        <Input
                                            label="New Password"
                                            name="newPassword"
                                            type="password"
                                            value={resetForm.newPassword}
                                            onChange={handleResetChange}
                                            placeholder="Enter new password"
                                            required
                                        />
                                        <Input
                                            label="Confirm Password"
                                            name="confirmPassword"
                                            type="password"
                                            value={resetForm.confirmPassword}
                                            onChange={handleResetChange}
                                            placeholder="Confirm new password"
                                            required
                                        />

                                        <div className="grid grid-cols-2 gap-3">
                                            <button
                                                type="button"
                                                onClick={() => setResetForm((prev) => ({ ...prev, step: 2 }))}
                                                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300"
                                            >
                                                Back
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={resetLoading}
                                                className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
                                            >
                                                {resetLoading ? "Updating..." : "Set New Password"}
                                            </button>
                                        </div>
                                    </form>
                                ) : null}

                                <button
                                    type="button"
                                    onClick={resetForgotPasswordFlow}
                                    className="mt-6 w-full text-sm font-semibold text-slate-600 transition hover:text-slate-900"
                                >
                                    Back to login
                                </button>
                            </>
                        )}
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

function StepIndicator({ step }) {
    const steps = [
        { id: 1, label: "Email" },
        { id: 2, label: "OTP" },
        { id: 3, label: "Password" },
    ];

    return (
        <div className="mt-6 flex items-center gap-3">
            {steps.map((item) => (
                <div key={item.id} className="flex items-center gap-3">
                    <div
                        className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold ${
                            step >= item.id
                                ? "bg-slate-950 text-white"
                                : "border border-slate-300 text-slate-500"
                        }`}
                    >
                        {item.id}
                    </div>
                    <span className="text-sm font-medium text-slate-600">{item.label}</span>
                </div>
            ))}
        </div>
    );
}
