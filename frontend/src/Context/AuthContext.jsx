import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useToast } from "./ToastContext";
import { api } from "../services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const { showToast } = useToast();

    const API_URL = `${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"}/users`;

    const fetchUser = useCallback(async () => {
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
    }, [API_URL]);

    useEffect(() => {
        fetchUser();
    }, [fetchUser]);

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

    const requestPasswordResetOtp = async (email) => {
        const res = await fetch(`${API_URL}/forgot-password/request-otp`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
        });

        const data = await res.json();
        if (res.ok) {
            showToast(data?.message || "OTP sent successfully", "success");
        } else {
            showToast(data?.message || "Failed to send OTP", "error");
        }
        return data;
    };

    const verifyPasswordResetOtp = async (email, otp) => {
        const res = await fetch(`${API_URL}/forgot-password/verify-otp`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, otp }),
        });

        const data = await res.json();
        if (res.ok) {
            showToast(data?.message || "OTP verified", "success");
        } else {
            showToast(data?.message || "OTP verification failed", "error");
        }
        return data;
    };

    const resetPasswordWithOtp = async (email, resetToken, newPassword) => {
        const res = await fetch(`${API_URL}/forgot-password/reset`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, resetToken, newPassword }),
        });

        const data = await res.json();
        if (res.ok) {
            showToast(data?.message || "Password reset successful", "success");
        } else {
            showToast(data?.message || "Password reset failed", "error");
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
                requestPasswordResetOtp,
                verifyPasswordResetOtp,
                resetPasswordWithOtp,
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

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
