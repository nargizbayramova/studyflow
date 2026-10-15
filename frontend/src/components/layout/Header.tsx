import React from "react";
import { Bell } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export const Header: React.FC<{ title: string; subtitle?: string; actions?: React.ReactNode }> = ({
  title,
  subtitle,
  actions,
}) => {
  const { user } = useAuth();

  return (
    <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-8 flex items-center justify-between sticky top-0 z-20">
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">{title}</h1>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-4">
        {actions}

        <div className="h-6 w-px bg-slate-200" />

        <button
          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors relative"
          title="Notifications"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary-600 ring-2 ring-white" />
        </button>

        <div className="flex items-center gap-2.5 pl-2">
          <div className="w-8 h-8 rounded-full bg-primary-600 text-white font-semibold flex items-center justify-center text-xs shadow-sm">
            {user?.full_name?.charAt(0).toUpperCase() || "S"}
          </div>
          <span className="text-sm font-medium text-slate-700 hidden sm:inline-block">
            {user?.full_name?.split(" ")[0]}
          </span>
        </div>
      </div>
    </header>
  );
};
