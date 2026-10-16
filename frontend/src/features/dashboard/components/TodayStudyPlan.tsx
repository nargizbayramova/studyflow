import React from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, Clock3, Sparkles } from "lucide-react";
import { StudyBlock, Course, Task } from "@/types";
import { useSchedule } from "@/hooks/useSchedule";
import { CourseTag } from "@/components/common/CourseTag";

interface TodayStudyPlanProps {
  studyBlocks: StudyBlock[];
  courses: Course[];
  tasks: Task[];
}

export const TodayStudyPlan: React.FC<TodayStudyPlanProps> = ({
  studyBlocks,
  courses,
  tasks,
}) => {
  const {
    blocks: scheduleBlocks,
    overloadWarning,
    isGenerating,
    error,
    generateSchedule,
    toggleBlockStatus,
  } = useSchedule();

  const activeBlocks = scheduleBlocks.length > 0 ? scheduleBlocks : studyBlocks;

  const todayStr = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date());

  const isToday = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    return (
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate()
    );
  };

  const todayBlocks = activeBlocks.filter((b) => isToday(b.start_at));

  const totalTodayHours = Math.round(
    todayBlocks.reduce((acc, b) => {
      const dur = (new Date(b.end_at).getTime() - new Date(b.start_at).getTime()) / 3600000;
      return acc + dur;
    }, 0) * 10
  ) / 10;

  const formatTimeRange = (start: string, end: string) => {
    const s = new Date(start).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    const e = new Date(end).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    return `${s}–${e}`;
  };

  return (
    <div className="w-full lg:w-[420px] p-6 bg-white border border-[#E5E6EB] rounded-xl flex flex-col gap-4 flex-shrink-0 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-lg font-semibold text-[#252735]">Today’s study plan</h3>
        <button
          onClick={() => void generateSchedule()}
          disabled={isGenerating}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#5553B7] hover:bg-[#48469F] disabled:opacity-60 text-white text-xs font-semibold transition-colors cursor-pointer disabled:cursor-not-allowed"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{isGenerating ? "Generating..." : "Generate AI Schedule"}</span>
        </button>
      </div>

      <div className="flex items-center justify-between text-[13px]">
        <span className="text-[#747683]">{todayStr}</span>
        <span className="px-2.5 py-1 bg-[#EFEEF9] text-[#5553B7] rounded-md text-xs font-medium">
          {totalTodayHours} h scheduled
        </span>
      </div>

      {overloadWarning && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs">
          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <span>
            Overload warning: Required study hours exceed available slots before deadlines.
          </span>
        </div>
      )}

      {error && (
        <div className="p-2.5 rounded-lg bg-rose-50 text-rose-700 text-xs font-medium">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-3">
        {todayBlocks.length === 0 ? (
          <div className="p-6 text-center text-xs text-[#747683] bg-[#F7F7F4] rounded-lg">
            No study blocks scheduled for today.
          </div>
        ) : (
          todayBlocks.slice(0, 5).map((block) => {
            const task = block.task_title ? undefined : tasks.find((t) => t.id === block.task_id);
            const course =
              block.course_code && block.course_color
                ? undefined
                : courses.find((c) => c.id === task?.course_id);
            const color = block.course_color || course?.color || "#5553B7";
            const code = block.course_code || course?.code || "GENERAL";
            const title = block.task_title || task?.title || "Focus Study Session";
            const isCompleted = block.status === "completed";

            return (
              <div
                key={block.id}
                className={`p-3.5 rounded-lg flex flex-col gap-2 transition-opacity ${
                  isCompleted ? "opacity-65" : ""
                }`}
                style={{
                  backgroundColor: `${color}15`,
                  borderLeft: `3px solid ${color}`,
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#252735]">
                    {formatTimeRange(block.start_at, block.end_at)}
                  </span>
                  <label className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#747683] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isCompleted}
                      onChange={() => void toggleBlockStatus(block)}
                      className="rounded border-slate-300 text-[#5553B7] focus:ring-[#5553B7] cursor-pointer"
                    />
                    <span>{isCompleted ? "Done" : "Complete"}</span>
                  </label>
                </div>
                <h4
                  className={`text-sm font-semibold text-[#252735] line-clamp-1 ${
                    isCompleted ? "line-through" : ""
                  }`}
                >
                  {title}
                </h4>
                {block.focus_goal && (
                  <p className="text-[11px] text-[#747683] line-clamp-1">{block.focus_goal}</p>
                )}
                <div className="flex items-center justify-between text-xs pt-0.5">
                  <CourseTag code={code} color={color} />
                  <Clock3 className="w-3.5 h-3.5 text-[#747683]" />
                </div>
              </div>
            );
          })
        )}
      </div>

      <Link
        to="/calendar"
        className="text-[13px] font-semibold text-[#5553B7] hover:text-[#48469F] transition-colors mt-auto pt-1"
      >
        Open study calendar →
      </Link>
    </div>
  );
};
