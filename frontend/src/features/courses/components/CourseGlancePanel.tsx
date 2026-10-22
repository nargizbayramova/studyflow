import React from "react";
import { Course } from "@/features/courses/types";
import { Task } from "@/features/tasks/types";

interface CourseGlancePanelProps {
  course: Course;
  tasks: Task[];
}

export const CourseGlancePanel: React.FC<CourseGlancePanelProps> = ({ course, tasks }) => {
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === "completed").length;
  const openEffort = tasks
    .filter((t) => t.status !== "completed")
    .reduce((acc, t) => acc + (t.estimated_hours || 0), 0);

  const pct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const color = course.color || "#5553B7";

  return (
    <div className="p-4 sm:p-6 bg-white border border-[#E5E6EB] rounded-xl flex flex-col gap-4 sm:gap-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-base sm:text-lg font-semibold text-[#252735]">Course at a glance</h3>
        <span
          className="px-2.5 py-1 rounded-md text-xs font-medium"
          style={{
            backgroundColor: course.is_archived ? "#F7F7F4" : "#EFEEF9",
            color: course.is_archived ? "#747683" : "#5553B7",
          }}
        >
          {course.is_archived ? "Archived" : "Active"}
        </span>
      </div>

      <div className="grid grid-cols-3 sm:flex items-center gap-4 sm:gap-10">
        <div className="flex flex-col gap-1">
          <span className="text-xl sm:text-[26px] font-semibold text-[#252735] leading-none">
            {totalTasks}
          </span>
          <span className="text-[11px] sm:text-xs text-[#747683]">Total tasks</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xl sm:text-[26px] font-semibold text-[#252735] leading-none">
            {completedTasks} / {totalTasks}
          </span>
          <span className="text-[11px] sm:text-xs text-[#747683]">Completed</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xl sm:text-[26px] font-semibold text-[#252735] leading-none">
            {openEffort} h
          </span>
          <span className="text-[11px] sm:text-xs text-[#747683]">Open task effort</span>
        </div>
      </div>

      <div className="w-full h-[6px] rounded-md bg-[#EFEEF9] overflow-hidden">
        <div
          className="h-full rounded-md transition-all duration-300"
          style={{ width: `${Math.max(4, pct)}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
};
