import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../services/api";

export default function AdminSignup() {
    const navigate = useNavigate();

    const [form, setForm] = useState({
        name: "",
        email: "",
        password: "",
    });

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const res = await api.post("/admin/signup", form);

            // axios does NOT have res.ok
            if (!res.data?.success) {
                throw new Error(res.data?.message || "Signup failed");
            }

            alert("Admin account created");
            navigate("/login");
        } catch (err) {
            alert(err.response?.data?.message || err.message);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-100">
            <form
                onSubmit={handleSubmit}
                className="bg-white p-8 rounded-2xl shadow w-full max-w-md space-y-5"
            >
                <h1 className="text-2xl font-semibold text-center">
                    Admin Signup
                </h1>

                <Input
                    label="Name"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                />

                <Input
                    label="Email"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                />

                <Input
                    label="Password"
                    name="password"
                    type="password"
                    value={form.password}
                    onChange={handleChange}
                />

                <button
                    type="submit"
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-xl font-medium"
                >
                    Create Admin
                </button>

                <p className="text-sm text-center text-slate-600">
                    Already have an account?{" "}
                    <Link
                        to="/login"
                        className="text-indigo-600 hover:underline font-medium"
                    >
                        Login
                    </Link>
                </p>
            </form>
        </div>
    );
}

function Input({ label, ...props }) {
    return (
        <div>
            <label className="text-sm font-medium">{label}</label>
            <input
                className="w-full mt-1 border rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500"
                {...props}
            />
        </div>
    );
}
