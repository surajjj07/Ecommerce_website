import { createContext, useContext, useMemo, useState } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

const ToastContext = createContext(null);

const TOAST_DURATION = 2600;

const toneMap = {
  success: {
    icon: CheckCircle2,
    shell: "border-emerald-200/70 bg-emerald-50/95 text-emerald-900",
    iconBg: "bg-emerald-600 text-white",
    bar: "bg-emerald-500",
  },
  error: {
    icon: AlertCircle,
    shell: "border-rose-200/70 bg-rose-50/95 text-rose-900",
    iconBg: "bg-rose-600 text-white",
    bar: "bg-rose-500",
  },
  info: {
    icon: Info,
    shell: "border-sky-200/70 bg-sky-50/95 text-sky-900",
    iconBg: "bg-sky-600 text-white",
    bar: "bg-sky-500",
  },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismissToast = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const showToast = (message, type = "info") => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const safeType = toneMap[type] ? type : "info";

    setToasts((prev) => [...prev.slice(-3), { id, message, type: safeType }]);
    window.setTimeout(() => dismissToast(id), TOAST_DURATION);
  };

  const value = useMemo(() => ({ showToast }), []);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-[100] flex w-[min(360px,calc(100vw-2rem))] flex-col gap-3">
        {toasts.map((toast) => {
          const tone = toneMap[toast.type] || toneMap.info;
          const Icon = tone.icon;

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto toast-enter relative overflow-hidden rounded-2xl border px-3 py-3 shadow-[0_16px_45px_-25px_rgba(15,23,42,0.65)] backdrop-blur ${tone.shell}`}
            >
              <div className="flex items-start gap-3">
                <span className={`mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-full ${tone.iconBg}`}>
                  <Icon size={16} />
                </span>
                <p className="flex-1 text-sm font-medium leading-5">{toast.message}</p>
                <button
                  onClick={() => dismissToast(toast.id)}
                  className="rounded-full p-1 text-slate-500 transition hover:bg-black/5 hover:text-slate-700"
                  aria-label="Dismiss notification"
                >
                  <X size={14} />
                </button>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-black/10">
                <span
                  className={`toast-bar block h-full rounded-full ${tone.bar}`}
                  style={{ animationDuration: `${TOAST_DURATION}ms` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used inside ToastProvider");
  }
  return context;
}
