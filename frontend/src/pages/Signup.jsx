import { useAuth } from "../Context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { useState } from "react";

const Signup = () => {
    const { signup } = useAuth();
    const navigate = useNavigate();
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        const name = e.target.name.value;
        const email = e.target.email.value;
        const password = e.target.password.value;

        const result = await signup(name, email, password);
        if (result.message === "User created successfully") {
            navigate("/");
        } else {
            setError(result.message);
        }
    };

    return (
        <section className="min-h-screen flex items-center justify-center bg-white px-6">
            <div className="max-w-md w-full bg-gray-50 rounded-3xl p-10">
                <h2 className="text-3xl font-extrabold text-gray-900 text-center">
                    Create Account
                </h2>

                {error && (
                    <div className="mt-4 rounded-2xl bg-red-50 text-red-700 px-4 py-3 text-sm text-center notify-card">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                    <input
                        name="name"
                        type="text"
                        placeholder="Full Name"
                        required
                        className="w-full px-4 py-3 rounded-xl border"
                    />
                    <input
                        name="email"
                        type="email"
                        placeholder="Email"
                        required
                        className="w-full px-4 py-3 rounded-xl border"
                    />
                    <input
                        name="password"
                        type="password"
                        placeholder="Password"
                        required
                        className="w-full px-4 py-3 rounded-xl border"
                    />

                    <button className="w-full py-3 rounded-full bg-indigo-600 text-white font-semibold hover:bg-indigo-700">
                        Sign Up
                    </button>
                </form>

                <p className="mt-6 text-center text-sm text-gray-600">
                    Already have an account?{" "}
                    <Link to="/login" className="text-indigo-600 font-semibold">
                        Login
                    </Link>
                </p>
            </div>
        </section>
    );
};

export default Signup;
