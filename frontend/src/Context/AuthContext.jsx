import { createContext, useContext, useEffect, useState } from "react";
import { useToast } from "./ToastContext";
import { api } from "../services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const { showToast } = useToast();

    const API_URL = `${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"}/users`;

    const fetchUser = async () => {
        try {
            const res = await fetch(`${API_URL}/profile`, {
                credentials: "include",
            });

            if (!res.ok) throw new Error("Not authenticated");

            const data = await res.json();
            setUser(data.user);
        } catch {
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUser();
    }, []);

    const signup = async (name, email, password, phone = "") => {
        const res = await fetch(`${API_URL}/signup`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ name, email, password, phone }),
        });

        const data = await res.json();
        if (res.ok) {
            setUser(data.user);
            showToast("Signup successful", "success");
        } else {
            showToast(data?.message || "Signup failed", "error");
        }
        return data;
    };

    const login = async (email, password) => {
        const res = await fetch(`${API_URL}/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ email, password }),
        });

        const data = await res.json();
        if (res.ok) {
            setUser(data.user);
            showToast("Login successful", "success");
        } else {
            showToast(data?.message || "Login failed", "error");
        }
        return data;
    };

    const logout = async () => {
        await fetch(`${API_URL}/logout`, {
            method: "POST",
            credentials: "include",
        });
        setUser(null);
        showToast("Logged out", "info");
    };

    const setProfilePic = async (file) => {
        const formData = new FormData();
        formData.append("profilePic", file);

        const res = await fetch(`${API_URL}/set-profile-pic`, {
            method: "POST",
            credentials: "include",
            body: formData,
        });

        const data = await res.json();
        if (res.ok) {
            setUser(data.user);
            showToast("Profile picture updated", "success");
        } else {
            showToast(data?.message || "Profile update failed", "error");
        }
        return data;
    };

    const updateProfile = async (payload) => {
        try {
            const data = await api.updateUserProfile(payload);
            if (data?.user) {
                setUser(data.user);
                showToast(data?.message || "Profile updated", "success");
            }
            return data;
        } catch (error) {
            showToast(error.message || "Profile update failed", "error");
            throw error;
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                signup,
                login,
                logout,
                setProfilePic,
                updateProfile,
                refetchUser: fetchUser,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
