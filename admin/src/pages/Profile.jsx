import { useContext, useMemo, useState } from "react";
import { Camera, ShieldCheck, UserCircle2 } from "lucide-react";
import AuthContext from "../context/CreateAuthContext";
import { adminApi } from "../services/api";

export default function Profile() {
  const { admin, setAdmin } = useContext(AuthContext);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState({
    name: admin?.name || "",
    email: admin?.email || "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const initials = useMemo(() => {
    const source = String(form.name || admin?.name || "A").trim();
    return source.slice(0, 1).toUpperCase();
  }, [form.name, admin?.name]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (form.newPassword && form.newPassword !== form.confirmPassword) {
        throw new Error("New password and confirm password do not match");
      }

      const payload = {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
      };

      if (form.newPassword) {
        payload.currentPassword = form.currentPassword;
        payload.newPassword = form.newPassword;
      }

      const res = await adminApi.updateProfile(payload);
      if (!res?.success) {
        throw new Error(res?.message || "Failed to update profile");
      }

      setAdmin(res.admin);
      setForm((prev) => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }));
      alert("Profile updated successfully");
    } catch (err) {
      alert(err.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handlePicChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("profilePic", file);

      const res = await adminApi.updateProfilePic(formData);
      if (!res?.admin) {
        throw new Error(res?.message || "Failed to upload profile picture");
      }

      setAdmin(res.admin);
      alert("Profile picture updated");
    } catch (err) {
      alert(err.message || "Failed to upload profile picture");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <section className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-6 py-8 text-white shadow-sm">
        <div className="pointer-events-none absolute -left-10 -top-16 h-48 w-48 rounded-full bg-cyan-500/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 right-0 h-56 w-56 rounded-full bg-emerald-500/30 blur-3xl" />

        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.2em] text-cyan-100">
              Admin Identity
            </p>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Profile Settings
            </h1>
            <p className="max-w-2xl text-sm text-slate-200/85 sm:text-base">
              Update your account details, profile picture, and password.
            </p>
          </div>
          <div className="rounded-2xl bg-white/10 px-5 py-4 text-sm shadow-inner">
            <p className="text-slate-200/80">Current Admin</p>
            <p className="mt-1 font-semibold text-white">{admin?.name || "Admin"}</p>
            <p className="text-slate-300">{admin?.email || "-"}</p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-3xl border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Avatar</h2>
          <p className="mt-1 text-sm text-slate-500">
            Upload a clear photo for your admin identity.
          </p>

          <div className="mt-5 flex justify-center">
            {admin?.profilePic ? (
              <img
                src={admin.profilePic}
                alt="Admin profile"
                className="h-28 w-28 rounded-full border object-cover"
              />
            ) : (
              <div className="flex h-28 w-28 items-center justify-center rounded-full bg-slate-900 text-3xl font-semibold text-white">
                {initials}
              </div>
            )}
          </div>

          <label className="mt-5 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border border-slate-900 px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-900 hover:text-white">
            <Camera size={16} />
            {uploading ? "Uploading..." : "Upload Profile Picture"}
            <input
              type="file"
              accept="image/*"
              onChange={handlePicChange}
              disabled={uploading}
              className="hidden"
            />
          </label>
        </div>

        <form
          onSubmit={handleProfileUpdate}
          className="space-y-5 rounded-3xl border bg-white p-6 shadow-sm lg:col-span-2"
        >
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-slate-900 p-2 text-white">
              <UserCircle2 size={18} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Account Details
              </h2>
              <p className="text-sm text-slate-500">
                Edit your public admin details and credentials.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input
              label="Full Name"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
            />
            <Input
              label="Email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
              <ShieldCheck size={16} />
              Password Change (Optional)
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <Input
                label="Current Password"
                name="currentPassword"
                type="password"
                value={form.currentPassword}
                onChange={handleChange}
              />
              <Input
                label="New Password"
                name="newPassword"
                type="password"
                value={form.newPassword}
                onChange={handleChange}
              />
              <Input
                label="Confirm Password"
                name="confirmPassword"
                type="password"
                value={form.confirmPassword}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="rounded-2xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save Profile"}
            </button>
          </div>
        </form>
      </div>
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
