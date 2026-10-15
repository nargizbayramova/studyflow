import React from "react";
import { Task, Course } from "@/types";
import { TaskTableRow } from "./TaskTableRow";

interface TaskTableProps {
  tasks: Task[];
  courses: Course[];
  tab: "all" | "open" | "completed";
  setTab: (tab: "all" | "open" | "completed") => void;
  totalCount: number;
  openCount: number;
  completedCount: number;
  onToggle: (task: Task) => void;
  onEdit: (task: Task) => void;
}

export const TaskTable: React.FC<TaskTableProps> = ({
  tasks,
  courses,
  tab,
  setTab,
  totalCount,
  openCount,
  completedCount,
  onToggle,
  onEdit,
}) => {
  return (
    <div className="bg-white border border-[#E5E6EB] rounded-xl p-5 shadow-sm flex flex-col gap-4">
      {/* Table header bar */}
      <div className="flex items-center justify-between pb-3 border-b border-[#F0F1F5]">
        <div className="flex items-center gap-4 text-xs">
          <button
            onClick={() => setTab("all")}
            className={`font-medium transition-colors cursor-pointer ${
              tab === "all" ? "text-[#5553B7] font-semibold" : "text-[#747683] hover:text-[#252735]"
            }`}
          >
            All tasks ({totalCount})
          </button>
          <button
            onClick={() => setTab("open")}
            className={`font-medium transition-colors cursor-pointer ${
              tab === "open" ? "text-[#5553B7] font-semibold" : "text-[#747683] hover:text-[#252735]"
            }`}
          >
            Open ({openCount})
          </button>
          <button
            onClick={() => setTab("completed")}
            className={`font-medium transition-colors cursor-pointer ${
              tab === "completed"
                ? "text-[#5553B7] font-semibold"
                : "text-[#747683] hover:text-[#252735]"
            }`}
          >
            Completed ({completedCount})
          </button>
        </div>
        <span className="text-[11px] text-[#747683]">Completed tasks appear last</span>
      </div>

      {/* Headings */}
      <div className="flex items-center gap-4 px-4 py-2.5 bg-[#F7F7F4] rounded-md text-[11px] font-semibold text-[#747683] uppercase tracking-wider">
        <div className="w-[18px]" />
        <div className="flex-1">TASK / COURSE</div>
        <div className="w-[155px]">DEADLINE</div>
        <div className="w-[105px]">STATUS</div>
        <div className="w-[80px]">PRIORITY</div>
        <div className="w-[56px]">EFFORT</div>
        <div className="w-[18px]" />
      </div>

      {/* Task list */}
      <div className="flex flex-col">
        {tasks.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#747683]">
            No tasks found matching your filters.
          </div>
        ) : (
          tasks.map((task) => (
            <TaskTableRow
              key={task.id}
              task={task}
              course={courses.find((c) => c.id === task.course_id)}
              onToggle={onToggle}
              onEdit={onEdit}
            />
          ))
        )}
      </div>
    </div>
  );
};
