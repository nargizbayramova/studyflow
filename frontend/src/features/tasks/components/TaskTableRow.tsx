import React from "react";
import { Circle, CheckCircle2, MoreHorizontal } from "lucide-react";
import { Task, Course } from "@/types";
import { CourseTag } from "@/components/common/CourseTag";
import { PriorityBadge, UrgencyBadge } from "@/components/common/PriorityBadge";
import { buildGoogleCalendarUrl } from "@/utils/calendar";

interface TaskTableRowProps {
  task: Task;
  course?: Course;
  onToggle: (task: Task) => void;
  onEdit: (task: Task) => void;
}

export const TaskTableRow: React.FC<TaskTableRowProps> = ({
  task,
  course,
  onToggle,
  onEdit,
}) => {
  const isCompleted = task.status === "completed";

  const formatDeadline = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const isTomorrow =
      d.getDate() === now.getDate() + 1 &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear();

    const dateText = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const timeText = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    return {
      day: isTomorrow ? `${dateText} · Tomorrow` : dateText,
      time: timeText,
    };
  };

  const { day, time } = formatDeadline(task.due_date);

  const formatType = (type: string) => {
    return type
      .split("_")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  };

  const getStatusBadge = (status: string) => {
    if (status === "completed") {
      return (
        <span className="px-2.5 py-1 rounded-md bg-[#EAF4EF] text-[#327864] text-xs font-medium">
          Completed
        </span>
      );
    }
    if (status === "in_progress") {
      return (
        <span className="px-2.5 py-1 rounded-md bg-[#EFEEF9] text-[#5553B7] text-xs font-medium">
          In progress
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 rounded-md bg-[#F7F7F4] text-[#747683] text-xs font-medium">
        Pending
      </span>
    );
  };

  return (
    <div className="py-3.5 px-2 sm:px-4 border-b border-[#E5E6EB] hover:bg-slate-50/60 transition-colors flex flex-col md:flex-row md:items-center gap-2.5 md:gap-4 text-xs">
      <div className="flex items-start md:items-center gap-3 md:gap-4 flex-1 min-w-0">
        <button
          onClick={() => onToggle(task)}
          className="mt-0.5 md:mt-0 text-[#747683] hover:text-[#5553B7] transition-colors cursor-pointer flex-shrink-0"
        >
          {isCompleted ? (
            <CheckCircle2 className="w-[18px] h-[18px] text-emerald-600" />
          ) : (
            <Circle className="w-[18px] h-[18px]" />
          )}
        </button>

        {/* Task / Course */}
        <div className="flex-1 min-w-0 flex flex-col gap-1 pr-2">
          <span
            className={`text-[13px] font-medium truncate ${
              isCompleted ? "line-through text-[#747683]" : "text-[#252735]"
            }`}
          >
            {task.title}
          </span>
          {task.ai_recommendation && !isCompleted && (
            <p className="text-xs text-[#747683] leading-snug">{task.ai_recommendation}</p>
          )}
          <div className="flex flex-wrap items-center gap-2">
            <CourseTag code={course?.code || "GENERAL"} color={course?.color || "#5553B7"} />
            <span className="text-[11px] text-[#747683]">· {formatType(task.type)}</span>
          </div>
        </div>

        {/* Mobile action button */}
        <button
          onClick={() => onEdit(task)}
          className="md:hidden p-1 text-[#747683] hover:text-[#252735] transition-colors cursor-pointer flex-shrink-0"
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>

      {/* Metadata columns: inline flex-wrap on mobile, fixed columns on md+ */}
      <div className="flex flex-wrap md:flex-nowrap items-center gap-2.5 md:gap-4 pl-7 md:pl-0">
        {/* Deadline */}
        <div className="md:w-[155px] flex-shrink-0 flex items-center gap-1.5 md:flex-col md:items-start md:gap-0.5">
          <span className="text-xs font-medium text-[#252735]">{day}</span>
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-[#747683]">{time}</span>
            <a
              href={buildGoogleCalendarUrl({
                title: `[${course?.code || "TASK"}] Deadline: ${task.title}`,
                details: task.ai_recommendation || task.description || `Estimated: ${task.estimated_hours}h`,
                date: task.due_date,
              })}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="px-1.5 py-0.5 rounded bg-[#EFEEF9] hover:bg-[#E2E0F5] text-[#5553B7] text-[10px] font-semibold transition-colors whitespace-nowrap"
              title="Add deadline to Google Calendar"
            >
              ➕ Google Cal
            </a>
          </div>
        </div>

        {/* Status */}
        <div className="md:w-[105px] flex-shrink-0">{getStatusBadge(task.status)}</div>

        {/* Priority */}
        <div className="md:w-[80px] flex-shrink-0">
          {task.urgency_level && !isCompleted ? (
            <UrgencyBadge urgency={task.urgency_level} rank={task.priority_rank} />
          ) : (
            <PriorityBadge priority={task.priority} />
          )}
        </div>

        {/* Effort */}
        <div className="md:w-[56px] flex-shrink-0 text-[#252735] font-medium">
          {task.estimated_hours || 0} h
        </div>

        {/* Desktop Action */}
        <button
          onClick={() => onEdit(task)}
          className="hidden md:inline-flex w-[18px] text-[#747683] hover:text-[#252735] transition-colors cursor-pointer flex-shrink-0"
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
