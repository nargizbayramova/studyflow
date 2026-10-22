import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { AlertCircle, CheckCircle2, AlertTriangle, Info, X, LucideIcon } from "lucide-react";

export type ToastType = "error" | "success" | "warning" | "info";

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

interface ToastContextType {
  showToast: (toast: Omit<ToastItem, "id">) => void;
  error: (message: string, title?: string) => void;
  success: (message: string, title?: string) => void;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const CONFIG: Record<ToastType, { icon: LucideIcon; border: string; iconBg: string; title: string }> = {
  error: { icon: AlertCircle, border: "border-rose-200", iconBg: "bg-rose-50 text-rose-600", title: "Action Failed" },
  success: { icon: CheckCircle2, border: "border-emerald-200", iconBg: "bg-emerald-50 text-emerald-600", title: "Success" },
  warning: { icon: AlertTriangle, border: "border-amber-200", iconBg: "bg-amber-50 text-amber-600", title: "Warning" },
  info: { icon: Info, border: "border-[#E5E6EB]", iconBg: "bg-[#EFEEF9] text-[#5553B7]", title: "Notice" },
};

const ToastCard: React.FC<{ toast: ToastItem; onDismiss: () => void }> = ({ toast, onDismiss }) => {
  const cfg = CONFIG[toast.type] || CONFIG.error;
  const Icon = cfg.icon;

  return (
    <div
      role="alert"
      className={`pointer-events-auto bg-white border ${cfg.border} shadow-lg shadow-slate-900/5 rounded-xl p-3.5 flex items-start gap-3 transition-all animate-in fade-in slide-in-from-top-2 duration-200`}
    >
      <div className={`w-8 h-8 rounded-lg ${cfg.iconBg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0 pr-1">
        <h4 className="text-[13px] font-bold text-[#252735] leading-tight truncate">
          {toast.title || cfg.title}
        </h4>
        <p className="text-xs text-[#747683] mt-1 leading-relaxed break-words whitespace-pre-wrap">
          {toast.message}
        </p>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="text-[#747683] hover:text-[#252735] p-1 rounded-md hover:bg-slate-100 transition-colors flex-shrink-0 cursor-pointer"
        aria-label="Dismiss alert"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (item: Omit<ToastItem, "id">) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [...prev, { ...item, id }]);
      const duration = item.duration ?? 5000;
      if (duration > 0) setTimeout(() => dismissToast(id), duration);
    },
    [dismissToast]
  );

  const error = useCallback((message: string, title?: string) => showToast({ type: "error", title, message }), [showToast]);
  const success = useCallback((message: string, title?: string) => showToast({ type: "success", title, message }), [showToast]);

  useEffect(() => {
    const handleAppAlert = (e: Event) => {
      const custom = e as CustomEvent<Omit<ToastItem, "id">>;
      if (custom.detail) showToast(custom.detail);
    };
    window.addEventListener("app:alert", handleAppAlert);
    return () => window.removeEventListener("app:alert", handleAppAlert);
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, error, success, dismissToast }}>
      {children}
      <aside aria-label="Notifications" className="fixed top-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => (
          <ToastCard key={t.id} toast={t} onDismiss={() => dismissToast(t.id)} />
        ))}
      </aside>
    </ToastContext.Provider>
  );
};

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
