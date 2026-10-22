import React from "react";
import { Bell } from "lucide-react";
import { useAuth } from "@/features/auth/context/AuthContext";

export const Header: React.FC<{ title: string; subtitle?: string; actions?: React.ReactNode }> = ({
  title,
  subtitle,
  actions,
}) => {
  const { user } = useAuth();

  return (
    <header className="min-h-16 bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 py-3.5 rounded-xl sm:rounded-none flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">{title}</h1>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
      </div>

      <div className="flex flex-wrap items-center gap-2.5 sm:gap-4">
        {actions}

        <div className="hidden sm:block h-6 w-px bg-slate-200" />

        <div className="hidden sm:flex items-center gap-2.5">
          <button
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors relative"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary-600 ring-2 ring-white" />
          </button>

          <div className="flex items-center gap-2.5 pl-1">
            <div className="w-8 h-8 rounded-full bg-primary-600 text-white font-semibold flex items-center justify-center text-xs shadow-sm">
              {user?.full_name?.charAt(0).toUpperCase() || "S"}
            </div>
            <span className="text-sm font-medium text-slate-700 hidden md:inline-block">
              {user?.full_name?.split(" ")[0]}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
