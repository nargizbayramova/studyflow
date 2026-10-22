import React from "react";
import { Clock3 } from "lucide-react";
import { BlockStatus, StudyBlock } from "@/features/calendar/types";
import { Course } from "@/features/courses/types";
import { Task } from "@/features/tasks/types";
import { CourseTag } from "@/shared/ui/CourseTag";
import { formatTimeRange, toSolidPastel } from "@/features/calendar/calendarUtils";
import { buildGoogleCalendarUrl } from "@/shared/lib/calendar";

interface Props {
  block: StudyBlock;
  courses: Course[];
  tasks: Task[];
  onStatusChange: (block: StudyBlock, status: BlockStatus) => void;
}

const statusButton = (active: boolean, on: string, off: string) =>
  `px-2 py-0.5 rounded text-[11px] font-semibold transition-colors cursor-pointer ${active ? on : off}`;

/** One study block in the dashboard's "Today" list, with done/missed actions. */
export const TodayBlockCard: React.FC<Props> = ({ block, courses, tasks, onStatusChange }) => {
  // Prefer the denormalised fields on the block; fall back to task/course lookups only when absent.
  const task = block.task_title ? undefined : tasks.find((t) => t.id === block.task_id);
  const course =
    block.course_code && block.course_color ? undefined : courses.find((c) => c.id === task?.course_id);
  const color = block.course_color || course?.color || "#5553B7";
  const code = block.course_code || course?.code || "GENERAL";
  const title = block.task_title || task?.title || "Focus Study Session";
  const isCompleted = block.status === "completed";
  const isMissed = block.status === "missed";
  const canMarkMissed = new Date(block.end_at).getTime() <= Date.now() || isMissed;

  return (
    <div
      className="p-3.5 rounded-lg flex flex-col gap-2"
      style={{ backgroundColor: toSolidPastel(color), borderLeft: `3px solid ${color}` }}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-[#252735]">{formatTimeRange(block.start_at, block.end_at)}</span>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onStatusChange(block, "completed")}
            className={statusButton(
              isCompleted,
              "bg-emerald-600 text-white",
              "bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-200"
            )}
          >
            ✓ Done
          </button>
          {canMarkMissed && (
            <button
              type="button"
              onClick={() => onStatusChange(block, "missed")}
              className={statusButton(
                isMissed,
                "bg-rose-600 text-white",
                "bg-white hover:bg-rose-50 text-rose-700 border border-rose-200"
              )}
            >
              ✕ Missed
            </button>
          )}
        </div>
      </div>
      <h4 className={`text-sm font-semibold text-[#252735] line-clamp-1 ${isCompleted ? "line-through" : ""}`}>
        {title}
      </h4>
      {block.focus_goal && <p className="text-[11px] text-[#747683] line-clamp-1">{block.focus_goal}</p>}
      <div className="flex items-center justify-between text-xs pt-0.5">
        <CourseTag code={code} color={color} />
        <div className="flex items-center gap-2">
          <a
            href={buildGoogleCalendarUrl({
              title: `[${code}] Study: ${title}`,
              details: block.focus_goal || `StudyFlow session (${block.status})`,
              date: block.date || block.start_at,
              startTime: block.start_time || block.start_at,
              endTime: block.end_time || block.end_at,
            })}
            target="_blank"
            rel="noopener noreferrer"
            className="px-1.5 py-0.5 rounded bg-white/90 hover:bg-[#EFEEF9] text-[#5553B7] border border-[#E5E6EB] text-[10px] font-semibold transition-colors"
          >
            ➕ Google Cal
          </a>
          <Clock3 className="w-3.5 h-3.5 text-[#747683]" />
        </div>
      </div>
    </div>
  );
};
