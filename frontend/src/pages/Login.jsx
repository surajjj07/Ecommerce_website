import { useAuth } from "../Context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { useState } from "react";
import { ArrowRight, KeyRound, Mail, ShieldCheck, ShoppingBag, Sparkles } from "lucide-react";

const initialResetState = {
    step: 1,
    email: "",
    otp: "",
    resetToken: "",
    newPassword: "",
    confirmPassword: "",
};

const Login = () => {
    const {
        login,
        requestPasswordResetOtp,
        verifyPasswordResetOtp,
        resetPasswordWithOtp,
    } = useAuth();
    const navigate = useNavigate();
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [resetLoading, setResetLoading] = useState(false);
    const [resetForm, setResetForm] = useState(initialResetState);

    const handleResetChange = (event) => {
        setResetForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
    };

    const closeReset = () => {
        setShowForgotPassword(false);
        setResetForm(initialResetState);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);
        setError("");

        const email = event.target.email.value;
        const password = event.target.password.value;

        const result = await login(email, password);
        if (result.message === "Login successful") {
            navigate("/");
        } else {
            setError(result.message);
        }
        setLoading(false);
    };

    const handleRequestOtp = async (event) => {
        event.preventDefault();
        setResetLoading(true);

        const result = await requestPasswordResetOtp(resetForm.email.trim().toLowerCase());
        if (result?.success) {
            setResetForm((prev) => ({ ...prev, step: 2 }));
        }

        setResetLoading(false);
    };

    const handleVerifyOtp = async (event) => {
        event.preventDefault();
        setResetLoading(true);

        const result = await verifyPasswordResetOtp(
            resetForm.email.trim().toLowerCase(),
            resetForm.otp.trim()
        );

        if (result?.success && result?.resetToken) {
            setResetForm((prev) => ({
                ...prev,
                step: 3,
                resetToken: result.resetToken,
            }));
        }

        setResetLoading(false);
    };

    const handleResetPassword = async (event) => {
        event.preventDefault();

        if (resetForm.newPassword.length < 6) {
            return;
        }

        if (resetForm.newPassword !== resetForm.confirmPassword) {
            return;
        }

        setResetLoading(true);
        const result = await resetPasswordWithOtp(
            resetForm.email.trim().toLowerCase(),
            resetForm.resetToken,
            resetForm.newPassword
        );
        if (result?.success) {
            closeReset();
        }
        setResetLoading(false);
    };

    return (
        <section className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_#fef3c7_0%,_#fff7ed_28%,_#ffffff_65%)] px-6 py-10 text-slate-900">
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute left-[-8%] top-12 h-64 w-64 rounded-full bg-amber-300/30 blur-3xl" />
                <div className="absolute bottom-[-5%] right-[-5%] h-80 w-80 rounded-full bg-orange-200/35 blur-3xl" />
            </div>

            <div className="relative mx-auto flex min-h-[calc(100vh-5rem)] max-w-7xl items-center">
                <div className="grid w-full gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
                    <div className="hidden rounded-[2rem] border border-amber-200/60 bg-white/70 p-8 shadow-[0_30px_80px_-40px_rgba(120,53,15,0.35)] backdrop-blur lg:block xl:p-10">
                        <div className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-white">
                            <Sparkles size={14} />
                            Customer Access
                        </div>

                        <h1 className="mt-6 max-w-xl text-4xl font-bold tracking-tight text-slate-950 xl:text-5xl">
                            Sign in to track orders, save addresses, and shop faster.
                        </h1>
                        <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600">
                            Access your account to manage orders, update your profile, and keep your checkout flow smooth across every visit.
                        </p>

                        <div className="mt-10 grid gap-4 sm:grid-cols-3">
                            <FeatureCard
                                icon={<ShoppingBag size={18} />}
                                title="Orders"
                                text="Track placed, shipped, and delivered purchases in one place."
                            />
                            <FeatureCard
                                icon={<ShieldCheck size={18} />}
                                title="Secure Access"
                                text="Protected login and account-level password recovery flow."
                            />
                            <FeatureCard
                                icon={<Mail size={18} />}
                                title="Quick Recovery"
                                text="Reset your password with OTP verification on your email."
                            />
                        </div>
                    </div>

                    <div className="mx-auto w-full max-w-md rounded-[2rem] border border-amber-100 bg-white p-7 shadow-[0_30px_80px_-35px_rgba(120,53,15,0.28)] xl:p-8">
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
                                    Login to continue shopping, track your orders, and manage your account.
                                </p>

                                {error ? (
                                    <div className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
                                        {error}
                                    </div>
                                ) : null}

                                <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                                    <Input name="email" type="email" label="Email Address" placeholder="you@example.com" required />
                                    <Input name="password" type="password" label="Password" placeholder="Enter your password" required />

                                    <button
                                        type="button"
                                        onClick={() => {
                                            const formElement = document.querySelector('input[name="email"]');
                                            setResetForm((prev) => ({
                                                ...prev,
                                                email: formElement?.value || prev.email,
                                            }));
                                            setShowForgotPassword(true);
                                        }}
                                        className="text-sm font-semibold text-orange-700 transition hover:text-orange-800"
                                    >
                                        Forgot password?
                                    </button>

                                    <button
                                        disabled={loading}
                                        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
                                    >
                                        {loading ? "Logging in..." : "Login"}
                                        {!loading ? <ArrowRight size={16} /> : null}
                                    </button>
                                </form>

                                <p className="mt-6 text-center text-sm text-slate-600">
                                    Do not have an account?{" "}
                                    <Link to="/signup" className="font-semibold text-slate-900 hover:text-orange-700">
                                        Sign up
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
                                    Recover your account
                                </h2>
                                <p className="mt-2 text-sm leading-6 text-slate-600">
                                    Request OTP on your email, verify it, and set a new password.
                                </p>

                                <StepIndicator step={resetForm.step} />

                                {resetForm.step === 1 ? (
                                    <form onSubmit={handleRequestOtp} className="mt-6 space-y-5">
                                        <Input
                                            name="email"
                                            type="email"
                                            label="Email Address"
                                            value={resetForm.email}
                                            onChange={handleResetChange}
                                            placeholder="you@example.com"
                                            required
                                        />
                                        <PrimaryButton loading={resetLoading} label="Send OTP" icon={<Mail size={16} />} />
                                    </form>
                                ) : null}

                                {resetForm.step === 2 ? (
                                    <form onSubmit={handleVerifyOtp} className="mt-6 space-y-5">
                                        <Input
                                            name="email"
                                            type="email"
                                            label="Email Address"
                                            value={resetForm.email}
                                            onChange={handleResetChange}
                                            placeholder="you@example.com"
                                            required
                                        />
                                        <Input
                                            name="otp"
                                            label="Email OTP"
                                            value={resetForm.otp}
                                            onChange={handleResetChange}
                                            placeholder="Enter 6-digit OTP"
                                            required
                                        />
                                        <ActionRow
                                            backLabel="Back"
                                            onBack={() => setResetForm((prev) => ({ ...prev, step: 1 }))}
                                            submitLabel={resetLoading ? "Verifying..." : "Verify OTP"}
                                        />
                                    </form>
                                ) : null}

                                {resetForm.step === 3 ? (
                                    <form onSubmit={handleResetPassword} className="mt-6 space-y-5">
                                        <Input
                                            name="newPassword"
                                            type="password"
                                            label="New Password"
                                            value={resetForm.newPassword}
                                            onChange={handleResetChange}
                                            placeholder="Enter new password"
                                            required
                                        />
                                        <Input
                                            name="confirmPassword"
                                            type="password"
                                            label="Confirm Password"
                                            value={resetForm.confirmPassword}
                                            onChange={handleResetChange}
                                            placeholder="Confirm new password"
                                            required
                                        />
                                        <ActionRow
                                            backLabel="Back"
                                            onBack={() => setResetForm((prev) => ({ ...prev, step: 2 }))}
                                            submitLabel={resetLoading ? "Updating..." : "Set New Password"}
                                        />
                                    </form>
                                ) : null}

                                <button
                                    type="button"
                                    onClick={closeReset}
                                    className="mt-6 w-full text-sm font-semibold text-slate-600 transition hover:text-slate-900"
                                >
                                    Back to login
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
};

function Input({ label, ...props }) {
    return (
        <label className="block">
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">
                {label}
            </span>
            <input
                className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-[15px] font-medium text-slate-950 shadow-[0_10px_24px_-18px_rgba(15,23,42,0.18)] outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:ring-4 focus:ring-orange-100"
                {...props}
            />
        </label>
    );
}

function FeatureCard({ icon, title, text }) {
    return (
        <div className="rounded-3xl border border-amber-100 bg-white/80 p-5">
            <div className="inline-flex rounded-2xl bg-amber-100 p-2 text-orange-700">{icon}</div>
            <h3 className="mt-4 text-lg font-semibold text-slate-950">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
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

function PrimaryButton({ loading, label, icon }) {
    return (
        <button
            type="submit"
            disabled={loading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
        >
            {icon}
            {loading ? `${label}...` : label}
        </button>
    );
}

function ActionRow({ backLabel, onBack, submitLabel }) {
    return (
        <div className="grid grid-cols-2 gap-3">
            <button
                type="button"
                onClick={onBack}
                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300"
            >
                {backLabel}
            </button>
            <button
                type="submit"
                className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
                {submitLabel}
            </button>
        </div>
    );
}

export default Login;
