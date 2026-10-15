import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Circle, CheckCircle2, Pencil } from "lucide-react";
import { Task } from "@/types";
import { useUpdateTask } from "@/api/tasks";

interface CourseTasksPanelProps {
  tasks: Task[];
}

export const CourseTasksPanel: React.FC<CourseTasksPanelProps> = ({ tasks }) => {
  const [filter, setFilter] = useState<"all" | "open" | "completed">("all");
  const updateTask = useUpdateTask();

  const openCount = tasks.filter((t) => t.status !== "completed").length;
  const completedCount = tasks.filter((t) => t.status === "completed").length;

  const filteredTasks = tasks.filter((t) => {
    if (filter === "open") return t.status !== "completed";
    if (filter === "completed") return t.status === "completed";
    return true;
  });

  const handleToggle = (task: Task) => {
    updateTask.mutate({
      id: task.id,
      data: {
        status: task.status === "completed" ? "pending" : "completed",
      },
    });
  };

  const formatDueDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `Due ${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}, ${d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;
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
    <div className="p-6 bg-white border border-[#E5E6EB] rounded-xl flex flex-col gap-5 shadow-sm">
      <h3 className="text-lg font-semibold text-[#252735]">Course tasks</h3>

      {/* Tabs */}
      <div className="flex items-center gap-4 text-xs border-b border-[#E5E6EB] pb-3">
        <button
          onClick={() => setFilter("all")}
          className={`font-medium transition-colors cursor-pointer ${
            filter === "all" ? "text-[#5553B7] font-semibold" : "text-[#747683] hover:text-[#252735]"
          }`}
        >
          All tasks ({tasks.length})
        </button>
        <button
          onClick={() => setFilter("open")}
          className={`font-medium transition-colors cursor-pointer ${
            filter === "open" ? "text-[#5553B7] font-semibold" : "text-[#747683] hover:text-[#252735]"
          }`}
        >
          Open ({openCount})
        </button>
        <button
          onClick={() => setFilter("completed")}
          className={`font-medium transition-colors cursor-pointer ${
            filter === "completed" ? "text-[#5553B7] font-semibold" : "text-[#747683] hover:text-[#252735]"
          }`}
        >
          Completed ({completedCount})
        </button>
      </div>

      {/* Tasks list */}
      <div className="flex flex-col gap-3">
        {filteredTasks.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#747683]">
            No tasks in this category.
          </div>
        ) : (
          filteredTasks.map((task) => (
            <div
              key={task.id}
              className="p-4 border border-[#E5E6EB] rounded-lg flex flex-col gap-3 hover:border-slate-300 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 overflow-hidden">
                  <button
                    onClick={() => handleToggle(task)}
                    className="mt-0.5 text-[#747683] hover:text-[#5553B7] transition-colors cursor-pointer flex-shrink-0"
                  >
                    {task.status === "completed" ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Circle className="w-4 h-4" />
                    )}
                  </button>
                  <div className="flex flex-col gap-0.5">
                    <span
                      className={`text-sm font-semibold ${
                        task.status === "completed" ? "line-through text-[#747683]" : "text-[#252735]"
                      }`}
                    >
                      {task.title}
                    </span>
                    <span className="text-xs text-[#747683]">
                      {task.type || "Assignment"} · {task.estimated_hours || 0} h estimated
                      {task.weight_percent ? ` · ${task.weight_percent}% of final grade` : ""}
                    </span>
                  </div>
                </div>

                <Link
                  to={`/tasks?edit=${task.id}`}
                  className="p-1 text-[#747683] hover:text-[#5553B7] rounded hover:bg-slate-50 transition-colors flex-shrink-0"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-[#747683]">{formatDueDate(task.due_date)}</span>
                {getStatusBadge(task.status)}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Guidance box */}
      <div className="p-4 bg-[#EFEEF9] rounded-lg flex flex-col gap-1 mt-2">
        <h4 className="text-[13px] font-semibold text-[#5553B7]">Your course, organized</h4>
        <p className="text-[13px] text-[#747683] leading-relaxed">
          Tasks hold your deadlines. Add focused study sessions from each task or your study calendar.
        </p>
      </div>
    </div>
  );
};
