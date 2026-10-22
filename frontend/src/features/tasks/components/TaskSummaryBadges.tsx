import React from "react";
import { Task } from "@/features/tasks/types";

interface TaskSummaryBadgesProps {
  tasks: Task[];
}

export const TaskSummaryBadges: React.FC<TaskSummaryBadgesProps> = ({ tasks }) => {
  const openTasks = tasks.filter((t) => t.status !== "completed");
  const completedTasks = tasks.filter((t) => t.status === "completed");

  const remainingEffort = openTasks.reduce(
    (acc, t) => acc + (t.estimated_hours || 0),
    0
  );

  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="px-2.5 py-1 rounded-md bg-[#F7F7F4] text-xs font-medium text-[#747683]">
        {tasks.length} total
      </span>
      <span className="px-2.5 py-1 rounded-md bg-[#EFEEF9] text-xs font-medium text-[#5553B7]">
        {openTasks.length} open
      </span>
      <span className="px-2.5 py-1 rounded-md bg-[#EAF4EF] text-xs font-medium text-[#327864]">
        {completedTasks.length} completed
      </span>
      <span className="text-[13px] text-[#747683] ml-1">
        {remainingEffort} h estimated effort remaining
      </span>
    </div>
  );
};
