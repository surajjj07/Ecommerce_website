import { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthContext from "../context/CreateAuthContext";
import { api } from "../services/api";

export default function AdminLogin() {
    const navigate = useNavigate();
    const { setAdmin } = useContext(AuthContext);

    const [form, setForm] = useState({
        email: "",
        password: "",
    });

    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await api.post("/admin/login", form);
            console.log(response.admin)
            setAdmin(response?.admin || null); // optional chaining not needed here
            navigate("/"); // redirect to admin dashboard
        } catch (err) {
            alert(err.response?.data?.message || err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-100">
            <form
                onSubmit={handleSubmit}
                className="bg-white p-8 rounded-2xl shadow w-full max-w-md space-y-5"
            >
                <h1 className="text-2xl font-semibold text-center">
                    Admin Login
                </h1>

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
                    disabled={loading}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white py-2 rounded-xl font-medium"
                >
                    {loading ? "Logging in..." : "Login"}
                </button>

                <p className="text-sm text-center text-slate-600">
                    Don’t have an admin account?{" "}
                    <Link
                        to="/signup"
                        className="text-indigo-600 hover:underline font-medium"
                    >
                        Create one
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
