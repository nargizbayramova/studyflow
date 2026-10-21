import React, { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Menu } from "lucide-react";
import { Analytics } from "@vercel/analytics/react";
import { Sidebar } from "./Sidebar";

import { useWorkspace } from "@/context/WorkspaceContext";

const BREADCRUMBS: Record<string, string> = {
  "/": "Workspace / Overview",
  "/courses": "Workspace / Courses",
  "/tasks": "Workspace / All tasks",
  "/calendar": "Workspace / Study calendar",
  "/availability": "Workspace / Availability",
  "/profile": "Workspace / Profile & settings",
};

export const AppLayout: React.FC = () => {
  const location = useLocation();
  const { workspace } = useWorkspace();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const breadcrumb = BREADCRUMBS[location.pathname] || "Workspace";

  const formattedDate = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date());

  return (
    <div className="min-h-screen bg-[#F7F7F4] flex font-sans">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 ml-0 lg:ml-[224px] flex flex-col min-w-0">
        {/* Workspace bar */}
        <header className="h-14 sm:h-16 lg:h-[76px] bg-white border-b border-[#E5E6EB] px-4 sm:px-6 lg:px-10 flex justify-between items-center gap-3 sticky top-0 z-20">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="p-2 -ml-1.5 rounded-lg text-[#252735] hover:bg-[#F7F7F4] lg:hidden cursor-pointer flex-shrink-0"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="text-xs sm:text-[13px] text-[#747683] truncate">{breadcrumb}</span>
          </div>
          <div className="flex items-center gap-2.5 sm:gap-3.5 flex-shrink-0">
            <span className="hidden md:inline text-[13px] text-[#747683]">{formattedDate}</span>
            <div className="hidden md:block w-[1px] h-5 bg-[#E5E6EB]" />
            <span className="text-xs sm:text-[13px] font-medium text-[#252735] px-2.5 py-1 sm:p-0 bg-[#F7F7F4] sm:bg-transparent rounded-md">
              {workspace}
            </span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-10 overflow-x-hidden overflow-y-auto">
          <Outlet />
        </main>
      </div>
      {typeof window !== "undefined" &&
        !["localhost", "127.0.0.1", "0.0.0.0"].includes(window.location.hostname) && (
          <Analytics />
        )}
    </div>
  );
};
