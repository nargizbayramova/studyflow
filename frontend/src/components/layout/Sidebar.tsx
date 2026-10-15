import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  BookOpen,
  CheckSquare,
  Calendar,
  Clock,
  User,
  GraduationCap,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const navItems = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Courses", href: "/courses", icon: BookOpen },
  { name: "Tasks", href: "/tasks", icon: CheckSquare },
  { name: "Calendar", href: "/calendar", icon: Calendar },
  { name: "Availability", href: "/availability", icon: Clock },
  { name: "Profile", href: "/profile", icon: User },
];

export const Sidebar: React.FC = () => {
  const { logout, user } = useAuth();

  return (
    <aside className="w-64 bg-white border-r border-slate-200/80 flex flex-col h-screen fixed left-0 top-0 z-30">
      {/* Brand header */}
      <div className="h-16 flex items-center px-6 gap-3 border-b border-slate-100">
        <div className="w-9 h-9 rounded-xl bg-primary-600 flex items-center justify-center text-white shadow-sm shadow-primary-500/30">
          <GraduationCap className="w-5 h-5" />
        </div>
        <div>
          <span className="font-bold text-slate-900 text-lg tracking-tight">StudyFlow</span>
          <span className="text-[10px] font-medium bg-primary-50 text-primary-700 px-1.5 py-0.5 rounded-full ml-1.5">
            AI Planner
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary-50 text-primary-700 font-semibold"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`
              }
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* User summary and logout */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 font-semibold flex items-center justify-center text-xs">
              {user?.full_name?.charAt(0).toUpperCase() || "U"}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-slate-900 truncate">
                {user?.full_name || "Student"}
              </p>
              <p className="text-xs text-slate-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            title="Log out"
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
