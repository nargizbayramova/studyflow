import React from "react";
import { Plus } from "lucide-react";
import { formatHoursCompact } from "../utils/availabilityUtils";

interface AvailabilityHeaderProps {
  availableHours: number;
  blockedHours: number;
  plannedHoursThisWeek: number;
  onAddSlot: () => void;
}

export const AvailabilityHeader: React.FC<AvailabilityHeaderProps> = ({
  availableHours,
  blockedHours,
  plannedHoursThisWeek,
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
          <span>Add recurring slot</span>
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2.5 sm:gap-4">
        <span className="px-[9px] py-1 rounded-[6px] bg-[#EAF4EF] text-[#327864] text-[12px] font-medium leading-[1.45]">
          {formatHoursCompact(availableHours)} h available to study
        </span>
        <span className="px-[9px] py-1 rounded-[6px] bg-white sm:bg-[#F7F7F4] border border-[#E5E6EB] text-[#747683] text-[12px] font-medium leading-[1.45]">
          {formatHoursCompact(blockedHours)} h blocked
        </span>
        <span className="px-[9px] py-1 rounded-[6px] bg-[#EFEEF9] text-[#5553B7] text-[12px] font-medium leading-[1.45]">
          Repeats every week
        </span>
        <span className="text-[12px] font-normal leading-[1.45] text-[#747683]">
          {formatHoursCompact(plannedHoursThisWeek)} of your {formatHoursCompact(availableHours)} available hours are planned this week
        </span>
      </div>
    </>
  );
};
