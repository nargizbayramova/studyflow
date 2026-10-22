import React from "react";
import { TaskStatus } from "@/features/tasks/types";

const STATUS_STYLES: Record<TaskStatus, { label: string; className: string }> = {
  completed: { label: "Completed", className: "bg-[#EAF4EF] text-[#327864]" },
  in_progress: { label: "In progress", className: "bg-[#EFEEF9] text-[#5553B7]" },
  pending: { label: "Pending", className: "bg-[#F7F7F4] text-[#747683]" },
};

export const TaskStatusBadge: React.FC<{ status: TaskStatus }> = ({ status }) => {
  const { label, className } = STATUS_STYLES[status] ?? STATUS_STYLES.pending;
  return <span className={`px-2.5 py-1 rounded-md text-xs font-medium ${className}`}>{label}</span>;
};
