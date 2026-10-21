import React from "react";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { formatHoursCompact, formatWeekRange } from "../utils/availabilityUtils";

interface AvailabilityHeaderProps {
  availableHours: number;
  blockedHours: number;
  plannedHoursThisWeek: number;
  scopeMode: "recurring" | "week";
  weekDates: Date[];
  onScopeModeChange: (mode: "recurring" | "week") => void;
  onShiftWeek: (step: -1 | 1) => void;
  onResetCurrentWeek: () => void;
  onAddSlot: () => void;
}

export const AvailabilityHeader: React.FC<AvailabilityHeaderProps> = ({
  availableHours,
  blockedHours,
  plannedHoursThisWeek,
  scopeMode,
  weekDates,
  onScopeModeChange,
  onShiftWeek,
  onResetCurrentWeek,
  onAddSlot,
}) => {
  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-2xl sm:text-[30px] font-normal leading-[1.45] text-[#252735] tracking-tight">
            Weekly availability
          </h1>
          <p className="text-xs sm:text-[14px] font-normal leading-[1.45] text-[#747683]">
            Tell your planner when study fits — and when life comes first.
          </p>
        </div>

        <button
          type="button"
          onClick={onAddSlot}
          className="inline-flex items-center justify-center gap-2 px-4 py-[11px] rounded-[8px] bg-[#5553B7] hover:bg-[#48469F] text-white text-[14px] font-semibold leading-[1.45] transition-colors self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{scopeMode === "week" ? "Add slot for week" : "Add recurring slot"}</span>
        </button>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3.5">
          <span className="px-[9px] py-1 rounded-[6px] bg-[#EAF4EF] text-[#327864] text-[12px] font-medium leading-[1.45]">
            {formatHoursCompact(availableHours)} h available to study
          </span>
          <span className="px-[9px] py-1 rounded-[6px] bg-white sm:bg-[#F7F7F4] border border-[#E5E6EB] text-[#747683] text-[12px] font-medium leading-[1.45]">
            {formatHoursCompact(blockedHours)} h blocked
          </span>

          <div className="inline-flex items-center p-0.5 bg-white border border-[#E5E6EB] rounded-[8px]">
            <button
              type="button"
              onClick={() => onScopeModeChange("recurring")}
              className={`px-2.5 py-1 rounded-[6px] text-[12px] font-medium transition-colors cursor-pointer ${
                scopeMode === "recurring"
                  ? "bg-[#EFEEF9] text-[#5553B7]"
                  : "text-[#747683] hover:text-[#252735]"
              }`}
            >
              Repeats every week
            </button>
            <button
              type="button"
              onClick={() => onScopeModeChange("week")}
              className={`px-2.5 py-1 rounded-[6px] text-[12px] font-medium transition-colors cursor-pointer ${
                scopeMode === "week"
                  ? "bg-[#EFEEF9] text-[#5553B7]"
                  : "text-[#747683] hover:text-[#252735]"
              }`}
            >
              Specific week
            </button>
          </div>

          {scopeMode === "week" && (
            <div className="inline-flex items-center gap-1.5 bg-white border border-[#E5E6EB] rounded-[8px] px-2 py-1">
              <button
                type="button"
                onClick={() => onShiftWeek(-1)}
                className="p-0.5 text-[#747683] hover:text-[#252735] cursor-pointer"
                aria-label="Previous week"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="text-[12px] font-semibold text-[#252735]">
                {formatWeekRange(weekDates)}
              </span>
              <button
                type="button"
                onClick={() => onShiftWeek(1)}
                className="p-0.5 text-[#747683] hover:text-[#252735] cursor-pointer"
                aria-label="Next week"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={onResetCurrentWeek}
                className="ml-1 pl-1.5 border-l border-[#E5E6EB] text-[11px] font-medium text-[#5553B7] hover:underline cursor-pointer"
              >
                This week
              </button>
            </div>
          )}
        </div>

        <span className="text-[12px] font-normal leading-[1.45] text-[#747683]">
          {formatHoursCompact(plannedHoursThisWeek)} of your {formatHoursCompact(availableHours)} available hours are planned this week
        </span>
      </div>
    </>
  );
};
