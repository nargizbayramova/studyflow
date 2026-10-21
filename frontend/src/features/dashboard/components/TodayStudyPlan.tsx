import React from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, Clock3, Sparkles } from "lucide-react";
import { StudyBlock, Course, Task } from "@/types";
import { useSchedule } from "@/hooks/useSchedule";
import { CourseTag } from "@/components/common/CourseTag";
import { AIScheduleResultModal } from "@/features/calendar/components/AIScheduleResultModal";
import { formatTimeRange, isToday, sumBlocksHours } from "@/features/calendar/calendarUtils";
import { buildGoogleCalendarUrl } from "@/utils/calendar";

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
    lastGenerated,
    clearLastGenerated,
    isGenerating,
    isRebalancing,
    rebalancePrompt,
    error,
    generateSchedule,
    rebalanceSchedule,
    updateBlockStatus,
  } = useSchedule();

  const activeBlocks = scheduleBlocks.length > 0 ? scheduleBlocks : studyBlocks;
  const todayBlocks = activeBlocks.filter((b) => isToday(new Date(b.start_at)));
  const totalTodayHours = sumBlocksHours(todayBlocks);
  const hasMissedBlocks = activeBlocks.some((b) => b.status === "missed");
  const showRebalanceBanner = Boolean(rebalancePrompt || hasMissedBlocks);
  const busy = isGenerating || isRebalancing;
  const todayStr = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date());

  return (
    <div className="w-full lg:w-[420px] p-4 sm:p-6 bg-white border border-[#E5E6EB] rounded-xl flex flex-col gap-4 flex-shrink-0 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-base sm:text-lg font-semibold text-[#252735]">Today’s study plan</h3>
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => void generateSchedule()}
            disabled={busy}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#5553B7] hover:bg-[#48469F] disabled:opacity-60 text-white text-xs font-semibold transition-colors cursor-pointer disabled:cursor-not-allowed"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isGenerating ? "Generating..." : "Generate AI"}</span>
          </button>
          <button
            onClick={() => void rebalanceSchedule()}
            disabled={busy}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#E5E6EB] bg-white hover:bg-slate-50 disabled:opacity-60 text-[#252735] text-xs font-semibold transition-colors cursor-pointer disabled:cursor-not-allowed"
          >
            <span>{isRebalancing ? "Rebalancing..." : "🔄 Rebalance Schedule"}</span>
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-[13px]">
        <span className="text-[#747683] text-xs sm:text-[13px]">{todayStr}</span>
        <span className="px-2.5 py-1 bg-[#EFEEF9] text-[#5553B7] rounded-md text-xs font-medium">
          {totalTodayHours} h scheduled
        </span>
      </div>

      {showRebalanceBanner && (
        <div className="flex items-center justify-between gap-2 p-3 rounded-lg bg-[#EFEEF9] border border-[#CAC7EA] text-[#252735] text-xs">
          <span className="leading-snug">
            {rebalancePrompt || "Missed study sessions detected. Rebalance your remaining hours."}
          </span>
          <button
            type="button"
            onClick={() => void rebalanceSchedule()}
            disabled={busy}
            className="px-2.5 py-1.5 rounded-md bg-[#5553B7] hover:bg-[#48469F] disabled:opacity-60 text-white text-[11px] font-semibold flex-shrink-0 cursor-pointer disabled:cursor-not-allowed"
          >
            {isRebalancing ? "..." : "🔄 Rebalance Now"}
          </button>
        </div>
      )}

      {overloadWarning && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs">
          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <span>Overload warning: Required study hours exceed available slots before deadlines.</span>
        </div>
      )}

      {error && (
        <div className="p-2.5 rounded-lg bg-rose-50 text-rose-700 text-xs font-medium">{error}</div>
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
            const isMissed = block.status === "missed";
            const isPast = new Date(block.end_at).getTime() <= Date.now();
            const canMarkMissed = isPast || isMissed;

            return (
              <div
                key={block.id}
                className={`p-3.5 rounded-lg flex flex-col gap-2 transition-opacity ${
                  isCompleted || isMissed ? "opacity-65" : ""
                }`}
                style={{ backgroundColor: `${color}15`, borderLeft: `3px solid ${color}` }}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-[#252735]">
                    {formatTimeRange(block.start_at, block.end_at)}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => void updateBlockStatus(block, "completed")}
                      className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                        isCompleted
                          ? "bg-emerald-600 text-white"
                          : "bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-200"
                      }`}
                    >
                      ✓ Done
                    </button>
                    {canMarkMissed && (
                      <button
                        type="button"
                        onClick={() => void updateBlockStatus(block, "missed")}
                        className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                          isMissed
                            ? "bg-rose-600 text-white"
                            : "bg-white hover:bg-rose-50 text-rose-700 border border-rose-200"
                        }`}
                      >
                        ✕ Missed
                      </button>
                    )}
                  </div>
                </div>
                <h4 className={`text-sm font-semibold text-[#252735] line-clamp-1 ${isCompleted ? "line-through" : ""}`}>
                  {title}
                </h4>
                {block.focus_goal && (
                  <p className="text-[11px] text-[#747683] line-clamp-1">{block.focus_goal}</p>
                )}
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
          })
        )}
      </div>

      <Link
        to="/calendar"
        className="text-[13px] font-semibold text-[#5553B7] hover:text-[#48469F] transition-colors mt-auto pt-1"
      >
        Open study calendar →
      </Link>

      <AIScheduleResultModal result={lastGenerated} onClose={clearLastGenerated} />
    </div>
  );
};
