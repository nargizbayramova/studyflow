import React from "react";
import { Outlet, useLocation } from "react-router-dom";
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
  const breadcrumb = BREADCRUMBS[location.pathname] || "Workspace";

  const formattedDate = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date());

  return (
    <div className="min-h-screen bg-[#F7F7F4] flex font-sans">
      <Sidebar />
      <div className="flex-1 ml-[224px] flex flex-col min-w-0">
        {/* Workspace bar */}
        <header className="h-[76px] bg-white border-b border-[#E5E6EB] px-8 lg:px-10 flex justify-between items-center sticky top-0 z-20">
          <span className="text-[13px] text-[#747683]">{breadcrumb}</span>
          <div className="flex items-center gap-3.5">
            <span className="text-[13px] text-[#747683]">{formattedDate}</span>
            <div className="w-[1px] h-5 bg-[#E5E6EB]" />
            <span className="text-[13px] font-medium text-[#252735]">{workspace}</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 lg:p-10 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
