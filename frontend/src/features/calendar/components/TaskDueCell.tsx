import React from "react";
import { Flag } from "lucide-react";
import { Course, Task } from "@/types";
import { buildGoogleCalendarUrl } from "@/utils/calendar";

interface TaskDueCellProps {
  tasks: Task[];
  coursesById: Map<number, Course>;
}

export const TaskDueCell: React.FC<TaskDueCellProps> = ({ tasks, coursesById }) => {
  if (tasks.length === 0) {
    return <span className="text-[11px] text-[#747683]">—</span>;
  }

  return (
    <div className="flex flex-col gap-2 min-w-0 w-full">
      {tasks.map((task) => {
        if (task.status === "completed") {
          return (
            <div key={task.id} className="text-[11px] leading-snug text-[#747683] truncate">
              ✓ {task.title} · Done
            </div>
          );
        }

        const course = coursesById.get(task.course_id);
        const color = course?.color || "#5553B7";
        const code = course?.code || "TASK";
        const dueTime = new Date(task.due_date).toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
        });

        return (
          <div key={task.id} className="group flex flex-col gap-0.5 min-w-0 w-full">
            <div
              className="flex items-center gap-1 text-[11px] font-medium leading-tight min-w-0"
              style={{ color }}
              title={task.title}
            >
              <Flag className="w-2.5 h-2.5 flex-shrink-0 fill-current" />
              <span className="truncate min-w-0 flex-1">{task.title}</span>
            </div>
            <div className="flex items-center justify-between gap-1">
              <span className="text-[11px] leading-tight" style={{ color }}>
                {dueTime}
              </span>
              <a
                href={buildGoogleCalendarUrl({
                  title: `[${code}] Deadline: ${task.title}`,
                  details: task.ai_recommendation || task.description,
                  date: task.due_date,
                })}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="hidden group-hover:inline-block px-1 py-0.5 rounded bg-white border border-[#E5E6EB] text-[#5553B7] text-[9px] font-semibold leading-none whitespace-nowrap"
                title="Add deadline to Google Calendar"
              >
                ➕ Google Cal
              </a>
            </div>
          </div>
        );
      })}
    </div>
  );
};
