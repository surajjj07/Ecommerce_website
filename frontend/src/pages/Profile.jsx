import { ShoppingBag, LogOut, Camera, Save } from "lucide-react";
import { useAuth } from "../Context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useRef, useState, useEffect } from "react";
import { api } from "../services/api";

const emptyAddress = {
    name: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    pincode: "",
    country: "India",
    email: "",
};

const Profile = () => {
    const { user, logout, setProfilePic, updateProfile } = useAuth();
    const navigate = useNavigate();
    const fileInputRef = useRef(null);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [passwordSaving, setPasswordSaving] = useState(false);
    const [form, setForm] = useState({
        name: "",
        phone: "",
        defaultAddress: emptyAddress,
    });
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });

    useEffect(() => {
        if (!user) {
            navigate("/login");
        }
    }, [navigate, user]);

    useEffect(() => {
        if (user) {
            setForm({
                name: user.name || "",
                phone: user.phone || "",
                defaultAddress: {
                    ...emptyAddress,
                    ...(user.defaultAddress || {}),
                    email: user.defaultAddress?.email || user.email || "",
                    name: user.defaultAddress?.name || user.name || "",
                    phone: user.defaultAddress?.phone || user.phone || "",
                },
            });
        }
    }, [user]);

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const result = await api.getUserOrders();
                if (result.orders) {
                    setOrders(result.orders);
                }
            } catch (error) {
                console.error("Failed to fetch orders:", error);
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchOrders();
        }
    }, [user]);

    if (!user) return null;

    const handleAvatarChange = () => {
        fileInputRef.current.click();
    };

    const handleFileChange = async (event) => {
        const file = event.target.files[0];
        if (file) {
            await setProfilePic(file);
        }
    };

    const handleProfileSave = async () => {
        setSaving(true);
        try {
            await updateProfile(form);
        } finally {
            setSaving(false);
        }
    };

    const handlePasswordSave = async () => {
        if (!passwordForm.currentPassword || !passwordForm.newPassword) return;
        if (passwordForm.newPassword !== passwordForm.confirmPassword) return;

        setPasswordSaving(true);
        try {
            await updateProfile({
                currentPassword: passwordForm.currentPassword,
                newPassword: passwordForm.newPassword,
            });
            setPasswordForm({
                currentPassword: "",
                newPassword: "",
                confirmPassword: "",
            });
        } finally {
            setPasswordSaving(false);
        }
    };

    return (
        <section className="min-h-screen bg-white pb-12 pt-16 md:pb-20 md:pt-24">
            <div className="mx-auto max-w-6xl px-6">
                <div className="mb-12 flex flex-col items-center gap-8 sm:flex-row">
                    <div className="relative">
                        <img
                            src={user.profilePic || "https://via.placeholder.com/150"}
                            alt={user.name}
                            className="h-28 w-28 rounded-full border object-cover"
                        />

                        <button
                            onClick={handleAvatarChange}
                            className="absolute bottom-1 right-1 rounded-full bg-indigo-600 p-2 text-white shadow transition hover:bg-indigo-700"
                        >
                            <Camera className="h-4 w-4" />
                        </button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept="image/*"
                            className="hidden"
                        />
                    </div>

                    <div className="text-center sm:text-left">
                        <h1 className="text-2xl font-extrabold text-gray-900">{user.name}</h1>
                        <p className="mt-1 text-gray-600">{user.email}</p>
                        <p className="mt-1 text-sm text-gray-500">
                            Manage your personal details, saved address, and order history.
                        </p>
                    </div>
                </div>

                <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
                    <div className="space-y-8">
                        <div className="rounded-3xl border bg-gray-50 p-6">
                            <div className="mb-5 flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">Profile Details</h2>
                                    <p className="text-sm text-gray-600">
                                        Keep your account and default delivery details up to date.
                                    </p>
                                </div>
                                <button
                                    onClick={handleProfileSave}
                                    disabled={saving}
                                    className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
                                >
                                    <Save className="h-4 w-4" />
                                    {saving ? "Saving..." : "Save"}
                                </button>
                            </div>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <Input
                                    label="Full Name"
                                    value={form.name}
                                    onChange={(value) => setForm((prev) => ({ ...prev, name: value }))}
                                />
                                <Input label="Email" value={user.email} disabled />
                                <Input
                                    label="Phone"
                                    value={form.phone}
                                    onChange={(value) => setForm((prev) => ({ ...prev, phone: value }))}
                                />
                                <Input
                                    label="Address Name"
                                    value={form.defaultAddress.name}
                                    onChange={(value) =>
                                        setForm((prev) => ({
                                            ...prev,
                                            defaultAddress: { ...prev.defaultAddress, name: value },
                                        }))
                                    }
                                />
                                <Input
                                    label="Address Phone"
                                    value={form.defaultAddress.phone}
                                    onChange={(value) =>
                                        setForm((prev) => ({
                                            ...prev,
                                            defaultAddress: { ...prev.defaultAddress, phone: value },
                                        }))
                                    }
                                />
                                <Input
                                    label="Address Email"
                                    value={form.defaultAddress.email}
                                    onChange={(value) =>
                                        setForm((prev) => ({
                                            ...prev,
                                            defaultAddress: { ...prev.defaultAddress, email: value },
                                        }))
                                    }
                                />
                                <Input
                                    label="Address Line 1"
                                    value={form.defaultAddress.addressLine1}
                                    onChange={(value) =>
                                        setForm((prev) => ({
                                            ...prev,
                                            defaultAddress: { ...prev.defaultAddress, addressLine1: value },
                                        }))
                                    }
                                    className="md:col-span-2"
                                />
                                <Input
                                    label="Address Line 2"
                                    value={form.defaultAddress.addressLine2}
                                    onChange={(value) =>
                                        setForm((prev) => ({
                                            ...prev,
                                            defaultAddress: { ...prev.defaultAddress, addressLine2: value },
                                        }))
                                    }
                                    className="md:col-span-2"
                                />
                                <Input
                                    label="City"
                                    value={form.defaultAddress.city}
                                    onChange={(value) =>
                                        setForm((prev) => ({
                                            ...prev,
                                            defaultAddress: { ...prev.defaultAddress, city: value },
                                        }))
                                    }
                                />
                                <Input
                                    label="State"
                                    value={form.defaultAddress.state}
                                    onChange={(value) =>
                                        setForm((prev) => ({
                                            ...prev,
                                            defaultAddress: { ...prev.defaultAddress, state: value },
                                        }))
                                    }
                                />
                                <Input
                                    label="Pincode"
                                    value={form.defaultAddress.pincode}
                                    onChange={(value) =>
                                        setForm((prev) => ({
                                            ...prev,
                                            defaultAddress: { ...prev.defaultAddress, pincode: value },
                                        }))
                                    }
                                />
                                <Input
                                    label="Country"
                                    value={form.defaultAddress.country}
                                    onChange={(value) =>
                                        setForm((prev) => ({
                                            ...prev,
                                            defaultAddress: { ...prev.defaultAddress, country: value },
                                        }))
                                    }
                                />
                            </div>
                        </div>

                        <div className="rounded-3xl border bg-gray-50 p-6">
                            <h2 className="text-xl font-bold text-gray-900">Recent Orders</h2>
                            <div className="mb-5 mt-1 flex items-center justify-between gap-4">
                                <p className="text-sm text-gray-600">
                                    Quick snapshot of your latest purchases.
                                </p>
                                <button
                                    onClick={() => navigate("/orders")}
                                    className="text-sm font-semibold text-indigo-600 hover:text-indigo-700"
                                >
                                    Open full tracking view
                                </button>
                            </div>
                            {loading ? (
                                <p>Loading orders...</p>
                            ) : orders.length === 0 ? (
                                <p className="text-gray-600">No orders found.</p>
                            ) : (
                                <div className="space-y-4">
                                    {orders.slice(0, 3).map((order) => (
                                        <div key={order._id} className="rounded-2xl bg-white p-5">
                                            <div className="mb-4 flex items-start justify-between">
                                                <div>
                                                    <p className="font-semibold text-gray-900">
                                                        Order #{order.orderId || order._id.slice(-8)}
                                                    </p>
                                                    <p className="text-sm text-gray-600">
                                                        {new Date(order.createdAt).toLocaleDateString("en-IN")}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-semibold text-gray-900">
                                                        INR {order.totalAmount.toLocaleString("en-IN")}
                                                    </p>
                                                    <p className="text-sm text-blue-600">
                                                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                {(order.items || []).map((item, index) => (
                                                    <div key={index} className="flex justify-between text-sm">
                                                        <span>
                                                            {item.product?.name || "Product"} x{item.quantity}
                                                        </span>
                                                        <span>
                                                            INR {(item.price * item.quantity).toLocaleString("en-IN")}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-8">
                        <button
                            onClick={() => navigate("/orders")}
                            className="flex w-full items-center gap-4 rounded-2xl border bg-gray-50 p-6 text-left transition hover:bg-indigo-50"
                        >
                            <ShoppingBag className="h-6 w-6 text-indigo-600" />
                            <div>
                                <p className="font-semibold text-gray-900">Track Orders</p>
                                <p className="text-sm text-gray-600">
                                    View shipment updates, payment status, and delivery progress
                                </p>
                            </div>
                        </button>

                        <div className="rounded-3xl border bg-gray-50 p-6">
                            <h2 className="text-xl font-bold text-gray-900">Security</h2>
                            <p className="mt-1 text-sm text-gray-600">
                                Update your password to keep your account secure.
                            </p>

                            <div className="mt-5 space-y-4">
                                <Input
                                    label="Current Password"
                                    type="password"
                                    value={passwordForm.currentPassword}
                                    onChange={(value) =>
                                        setPasswordForm((prev) => ({ ...prev, currentPassword: value }))
                                    }
                                />
                                <Input
                                    label="New Password"
                                    type="password"
                                    value={passwordForm.newPassword}
                                    onChange={(value) =>
                                        setPasswordForm((prev) => ({ ...prev, newPassword: value }))
                                    }
                                />
                                <Input
                                    label="Confirm Password"
                                    type="password"
                                    value={passwordForm.confirmPassword}
                                    onChange={(value) =>
                                        setPasswordForm((prev) => ({ ...prev, confirmPassword: value }))
                                    }
                                />
                            </div>

                            <button
                                onClick={handlePasswordSave}
                                disabled={
                                    passwordSaving ||
                                    !passwordForm.currentPassword ||
                                    !passwordForm.newPassword ||
                                    passwordForm.newPassword !== passwordForm.confirmPassword
                                }
                                className="mt-5 w-full rounded-full bg-slate-900 px-6 py-3 font-semibold text-white disabled:opacity-60"
                            >
                                {passwordSaving ? "Updating..." : "Update Password"}
                            </button>
                        </div>

                        <div className="rounded-3xl border bg-gray-50 p-6">
                            <button
                                onClick={logout}
                                className="w-full rounded-full border border-red-500 px-6 py-3 font-semibold text-red-600 transition hover:bg-red-50"
                            >
                                <LogOut className="mr-2 inline h-4 w-4" />
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

const Input = ({ label, value, onChange, className = "", disabled = false, type = "text" }) => (
    <label className={className}>
        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">
            {label}
        </span>
        <input
            type={type}
            value={value}
            disabled={disabled}
            onChange={(event) => onChange?.(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-slate-900 focus:ring-4 focus:ring-slate-200/60 disabled:bg-gray-100"
        />
    </label>
);

export default Profile;
