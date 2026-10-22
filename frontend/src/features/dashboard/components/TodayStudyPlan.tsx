import React from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, Sparkles } from "lucide-react";
import { StudyBlock } from "@/features/calendar/types";
import { Course } from "@/features/courses/types";
import { Task } from "@/features/tasks/types";
import { useSchedule } from "@/features/calendar/hooks/useSchedule";
import { AIScheduleResultModal } from "@/features/calendar/components/AIScheduleResultModal";
import { isToday, sumBlocksHours } from "@/features/calendar/calendarUtils";
import { TodayBlockCard } from "./TodayBlockCard";

interface TodayStudyPlanProps {
  studyBlocks: StudyBlock[];
  courses: Course[];
  tasks: Task[];
}

const TODAY_FORMAT = new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric" });
const MAX_VISIBLE_BLOCKS = 5;

export const TodayStudyPlan: React.FC<TodayStudyPlanProps> = ({ studyBlocks, courses, tasks }) => {
  const schedule = useSchedule();
  const { isGenerating, isRebalancing, rebalancePrompt } = schedule;

  const activeBlocks = schedule.blocks.length > 0 ? schedule.blocks : studyBlocks;
  const todayBlocks = activeBlocks.filter((b) => isToday(new Date(b.start_at)));
  const showRebalanceBanner = Boolean(rebalancePrompt || activeBlocks.some((b) => b.status === "missed"));
  const busy = isGenerating || isRebalancing;

  return (
    <div className="w-full lg:w-[420px] p-4 sm:p-6 bg-white border border-[#E5E6EB] rounded-xl flex flex-col gap-4 flex-shrink-0 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-base sm:text-lg font-semibold text-[#252735]">Today’s study plan</h3>
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => void schedule.generateSchedule()}
            disabled={busy}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#5553B7] hover:bg-[#48469F] disabled:opacity-60 text-white text-xs font-semibold transition-colors cursor-pointer disabled:cursor-not-allowed"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isGenerating ? "Generating..." : "Generate AI"}</span>
          </button>
          <button
            onClick={() => void schedule.rebalanceSchedule()}
            disabled={busy}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#E5E6EB] bg-white hover:bg-slate-50 disabled:opacity-60 text-[#252735] text-xs font-semibold transition-colors cursor-pointer disabled:cursor-not-allowed"
          >
            <span>{isRebalancing ? "Rebalancing..." : "🔄 Rebalance Schedule"}</span>
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-[13px]">
        <span className="text-[#747683] text-xs sm:text-[13px]">{TODAY_FORMAT.format(new Date())}</span>
        <span className="px-2.5 py-1 bg-[#EFEEF9] text-[#5553B7] rounded-md text-xs font-medium">
          {sumBlocksHours(todayBlocks)} h scheduled
        </span>
      </div>

      {showRebalanceBanner && (
        <div className="flex items-center justify-between gap-2 p-3 rounded-lg bg-[#EFEEF9] border border-[#CAC7EA] text-[#252735] text-xs">
          <span className="leading-snug">
            {rebalancePrompt || "Missed study sessions detected. Rebalance your remaining hours."}
          </span>
          <button
            type="button"
            onClick={() => void schedule.rebalanceSchedule()}
            disabled={busy}
            className="px-2.5 py-1.5 rounded-md bg-[#5553B7] hover:bg-[#48469F] disabled:opacity-60 text-white text-[11px] font-semibold flex-shrink-0 cursor-pointer disabled:cursor-not-allowed"
          >
            {isRebalancing ? "..." : "🔄 Rebalance Now"}
          </button>
        </div>
      )}

      {schedule.overloadWarning && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs">
          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <span>Overload warning: Required study hours exceed available slots before deadlines.</span>
        </div>
      )}

      {schedule.error && (
        <div className="p-2.5 rounded-lg bg-rose-50 text-rose-700 text-xs font-medium">{schedule.error}</div>
      )}

      <div className="flex flex-col gap-3">
        {todayBlocks.length === 0 ? (
          <div className="p-6 text-center text-xs text-[#747683] bg-[#F7F7F4] rounded-lg">
            No study blocks scheduled for today.
          </div>
        ) : (
          todayBlocks
            .slice(0, MAX_VISIBLE_BLOCKS)
            .map((block) => (
              <TodayBlockCard
                key={block.id}
                block={block}
                courses={courses}
                tasks={tasks}
                onStatusChange={(b, status) => void schedule.updateBlockStatus(b, status)}
              />
            ))
        )}
      </div>

      <Link
        to="/calendar"
        className="text-[13px] font-semibold text-[#5553B7] hover:text-[#48469F] transition-colors mt-auto pt-1"
      >
        Open study calendar →
      </Link>

      <AIScheduleResultModal result={schedule.lastGenerated} onClose={schedule.clearLastGenerated} />
    </div>
  );
};
