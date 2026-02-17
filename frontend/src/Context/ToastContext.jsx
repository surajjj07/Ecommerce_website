import { createContext, useCallback, useContext, useMemo, useState } from "react";

const ToastContext = createContext(null);

let toastId = 0;

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const removeToast = useCallback((id) => {
        setToasts((current) => current.filter((toast) => toast.id !== id));
    }, []);

    const showToast = useCallback((message, type = "info", duration = 2500) => {
        const id = ++toastId;
        setToasts((current) => [...current, { id, message, type }]);
        window.setTimeout(() => removeToast(id), duration);
    }, [removeToast]);

    const value = useMemo(
        () => ({
            showToast,
            removeToast,
        }),
        [showToast, removeToast]
    );

    return (
        <ToastContext.Provider value={value}>
            {children}
            <div className="pointer-events-none fixed right-4 top-4 z-[1000] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-3">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className={`pointer-events-auto rounded-2xl border px-4 py-3 text-sm shadow-xl backdrop-blur ${toast.type === "success"
                                ? "border-emerald-300/60 bg-emerald-50 text-emerald-800"
                                : toast.type === "error"
                                    ? "border-red-300/60 bg-red-50 text-red-700"
                                    : "border-slate-300/70 bg-white text-slate-700"
                            }`}
                    >
                        {toast.message}
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error("useToast must be used inside ToastProvider");
    }
    return context;
};
