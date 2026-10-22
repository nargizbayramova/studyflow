import React from "react";
import { NavLink } from "react-router-dom";
import {
  BookOpen,
  LayoutDashboard,
  ListChecks,
  CalendarDays,
  Clock3,
  Settings2,
  LogOut,
  X,
} from "lucide-react";
import { useAuth } from "@/features/auth/context/AuthContext";
import { WorkspaceSelector } from "@/features/workspace/components/WorkspaceSelector";

const navItems = [
  { name: "Overview", href: "/", icon: LayoutDashboard },
  { name: "Courses", href: "/courses", icon: BookOpen },
  { name: "All tasks", href: "/tasks", icon: ListChecks },
  { name: "Study calendar", href: "/calendar", icon: CalendarDays },
  { name: "Availability", href: "/availability", icon: Clock3 },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen = false, onClose }) => {
  const { logout, user } = useAuth();

  const initials =
    user?.full_name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "AM";

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`w-[240px] lg:w-[224px] bg-white border-r border-[#E5E6EB] flex flex-col h-screen fixed left-0 top-0 z-40 font-sans transition-transform duration-200 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Brand & Workspace */}
        <div className="p-5 pb-3 flex flex-col gap-5">
          <div className="flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-[9px] bg-[#5553B7] flex items-center justify-center text-white shadow-sm flex-shrink-0">
                <BookOpen className="w-[19px] h-[19px]" />
              </div>
              <span className="font-bold text-xl text-[#252735] tracking-tight">StudyFlow</span>
            </div>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-[#747683] hover:text-[#252735] hover:bg-[#F7F7F4] lg:hidden cursor-pointer"
                aria-label="Close navigation menu"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          <WorkspaceSelector />
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.href}
                end={item.href === "/"}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                    isActive
                      ? "bg-[#EFEEF9] text-[#5553B7] font-semibold"
                      : "text-[#747683] hover:bg-[#F7F7F4] hover:text-[#252735] font-medium"
                  }`
                }
              >
                <Icon className="w-[18px] h-[18px] flex-shrink-0" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Guidance box */}
        <div className="p-3">
          <div className="p-3.5 bg-[#EFEEF9] rounded-lg flex flex-col gap-1">
            <p className="text-[13px] font-semibold text-[#5553B7]">A little planning, less pressure.</p>
            <p className="text-xs text-[#747683] leading-relaxed">Leave room in your week for rest, too.</p>
          </div>
        </div>

        {/* Profile & User Footer */}
        <div className="p-3 pt-0 flex flex-col gap-3">
          <NavLink
            to="/profile"
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? "bg-[#EFEEF9] text-[#5553B7] font-semibold"
                  : "text-[#747683] hover:bg-[#F7F7F4] hover:text-[#252735]"
              }`
            }
          >
            <Settings2 className="w-[18px] h-[18px] flex-shrink-0" />
            <span>Profile & settings</span>
          </NavLink>

        <div className="h-[1px] bg-[#E5E6EB] w-full" />

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-[34px] h-[34px] rounded-full bg-[#EFEEF9] text-[#5553B7] font-semibold text-xs flex items-center justify-center flex-shrink-0">
              {initials}
            </div>
            <div className="overflow-hidden">
              <p className="text-[13px] font-semibold text-[#252735] truncate">
                {user?.full_name || "Alex Morgan"}
              </p>
              <p className="text-[11px] text-[#747683] truncate">University student</p>
            </div>
          </div>
          <button
            onClick={logout}
            title="Log out"
            className="p-1.5 text-[#747683] hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors flex-shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
    </>
  );
};
