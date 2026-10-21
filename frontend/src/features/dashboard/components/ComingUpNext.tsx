import React from "react";
import { Link } from "react-router-dom";
import { Flag } from "lucide-react";
import { Task, Course } from "@/types";
import { usePrioritizeTasks } from "@/api/tasks";
import { useWorkspace } from "@/context/WorkspaceContext";
import { CourseTag } from "@/components/common/CourseTag";
import { PriorityBadge, UrgencyBadge } from "@/components/common/PriorityBadge";
import { buildGoogleCalendarUrl } from "@/utils/calendar";

interface ComingUpNextProps {
  tasks: Task[];
  courses: Course[];
}

export const ComingUpNext: React.FC<ComingUpNextProps> = ({ tasks, courses }) => {
  const { workspace } = useWorkspace();
  const { prioritizeTasks, isPrioritizing } = usePrioritizeTasks();

  const pendingTasks = tasks
    .filter((t) => t.status !== "completed")
    .sort((a, b) => {
      if (a.priority_rank != null && b.priority_rank != null) {
        return a.priority_rank - b.priority_rank;
      }
      if (a.priority_rank != null) return -1;
      if (b.priority_rank != null) return 1;
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    })
    .slice(0, 5);

  const formatDueDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const monthDay = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    return { monthDay, time };
  };

  return (
    <div className="flex-1 min-w-0 p-4 sm:p-6 bg-white border border-[#E5E6EB] rounded-xl flex flex-col gap-4 sm:gap-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-base sm:text-lg font-semibold text-[#252735]">Coming up next</h3>
        <div className="flex items-center gap-2.5 sm:gap-3">
          <button
            type="button"
            onClick={() => void prioritizeTasks(workspace)}
            disabled={isPrioritizing || pendingTasks.length === 0}
            className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-[#EFEEF9] hover:bg-[#E3E1F4] text-[#5553B7] disabled:opacity-60 text-xs font-semibold transition-colors cursor-pointer disabled:cursor-not-allowed"
          >
            <span>{isPrioritizing ? "Prioritizing..." : "⚡ Prioritize with AI"}</span>
          </button>
          <Link
            to="/tasks"
            className="text-xs text-[#5553B7] hover:text-[#48469F] font-medium transition-colors whitespace-nowrap"
          >
            View all →
          </Link>
        </div>
      </div>

      <p className="text-[13px] text-[#747683] -mt-2">
        Prioritized task checklist & upcoming deadlines
      </p>

      <div className="flex flex-col">
        {pendingTasks.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#747683]">
            No upcoming deadlines. Great job!
          </div>
        ) : (
          pendingTasks.map((task, idx) => {
            const course = courses.find((c) => c.id === task.course_id);
            const { monthDay, time } = formatDueDate(task.due_date);

            return (
              <React.Fragment key={task.id}>
                <div className="py-3.5 flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 overflow-hidden">
                    <Flag className="w-4 h-4 text-[#747683] flex-shrink-0 mt-0.5" />
                    <div className="flex flex-col gap-1 overflow-hidden">
                      <span className="text-[13px] text-[#252735] font-medium truncate">
                        {task.title}
                      </span>
                      {task.ai_recommendation && (
                        <p className="text-xs text-[#747683] leading-snug">
                          {task.ai_recommendation}
                        </p>
                      )}
                      <div className="flex items-center gap-2 pt-0.5">
                        <CourseTag
                          code={course?.code || "GENERAL"}
                          color={course?.color || "#5553B7"}
                        />
                        <UrgencyBadge urgency={task.urgency_level} rank={task.priority_rank} />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="flex flex-col items-end gap-0.5 text-right">
                      <span className="text-xs font-semibold text-[#252735]">{monthDay}</span>
                      <span className="text-[11px] text-[#747683]">{time}</span>
                      <a
                        href={buildGoogleCalendarUrl({
                          title: `[${course?.code || "TASK"}] Deadline: ${task.title}`,
                          details: task.ai_recommendation || task.description,
                          date: task.due_date,
                        })}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-1.5 py-0.5 rounded bg-[#EFEEF9] hover:bg-[#E2E0F5] text-[#5553B7] text-[10px] font-semibold transition-colors whitespace-nowrap"
                      >
                        ➕ Google Cal
                      </a>
                    </div>
                    {!task.urgency_level && <PriorityBadge priority={task.priority} />}
                  </div>
                </div>
                {idx < pendingTasks.length - 1 && (
                  <div className="h-[1px] bg-[#E5E6EB] w-full" />
                )}
              </React.Fragment>
            );
          })
        )}
      </div>
    </div>
  );
};
