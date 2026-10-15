import React from "react";
import { Circle, CheckCircle2, MoreHorizontal } from "lucide-react";
import { Task, Course } from "@/types";
import { CourseTag } from "@/components/common/CourseTag";
import { PriorityBadge } from "@/components/common/PriorityBadge";

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
    <div className="py-3.5 px-4 border-b border-[#E5E6EB] hover:bg-slate-50/60 transition-colors flex items-center gap-4 text-xs">
      <button
        onClick={() => onToggle(task)}
        className="text-[#747683] hover:text-[#5553B7] transition-colors cursor-pointer flex-shrink-0"
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
        <div className="flex items-center gap-2">
          <CourseTag code={course?.code || "GENERAL"} color={course?.color || "#5553B7"} />
          <span className="text-[11px] text-[#747683]">· {formatType(task.type)}</span>
        </div>
      </div>

      {/* Deadline */}
      <div className="w-[155px] flex-shrink-0 flex flex-col">
        <span className="text-xs font-medium text-[#252735]">{day}</span>
        <span className="text-[11px] text-[#747683]">{time}</span>
      </div>

      {/* Status */}
      <div className="w-[105px] flex-shrink-0">{getStatusBadge(task.status)}</div>

      {/* Priority */}
      <div className="w-[80px] flex-shrink-0">
        <PriorityBadge priority={task.priority} />
      </div>

      {/* Effort */}
      <div className="w-[56px] flex-shrink-0 text-[#252735] font-medium">
        {task.estimated_hours || 0} h
      </div>

      {/* Action */}
      <button
        onClick={() => onEdit(task)}
        className="w-[18px] text-[#747683] hover:text-[#252735] transition-colors cursor-pointer flex-shrink-0"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>
    </div>
  );
};
