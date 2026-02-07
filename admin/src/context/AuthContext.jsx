import { useState, useEffect, useCallback } from "react";
import AuthContext from "./CreateAuthContext";
import { api } from "../services/api";

export const AuthProvider = ({ children }) => {
    const [admin, setAdmin] = useState(undefined);
    const [loading, setLoading] = useState(true);

    const checkAuth = useCallback(async () => {
        try {
            const response = await api.get("/admin/profile")
            setAdmin(response?.admin || null);
        } catch {
            setAdmin(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    return (
        <AuthContext.Provider
            value={{
                admin,
                setAdmin,
                loading
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

