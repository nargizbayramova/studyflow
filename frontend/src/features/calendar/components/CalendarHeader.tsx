import React from "react";
import { Plus, ChevronLeft, ChevronRight, Calendar, LayoutList, Grid3X3 } from "lucide-react";

export type CalendarViewMode = "day" | "week" | "month";

interface CalendarHeaderProps {
  currentDate: Date;
  viewMode: CalendarViewMode;
  onViewModeChange: (mode: CalendarViewMode) => void;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onAddBlock: () => void;
  totalScheduledHours: number;
}

export const CalendarHeader: React.FC<CalendarHeaderProps> = ({
  currentDate,
  viewMode,
  onViewModeChange,
  onPrev,
  onNext,
  onToday,
  onAddBlock,
  totalScheduledHours,
}) => {
  const formatTitle = () => {
    if (viewMode === "day") {
      return currentDate.toLocaleDateString("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }
    if (viewMode === "month") {
      return currentDate.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      });
    }
    // Week mode
    const d = new Date(currentDate);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const weekStart = new Date(d.setDate(diff));
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    const sMonth = weekStart.toLocaleDateString("en-US", { month: "short" });
    const sDay = weekStart.getDate();
    const eDay = weekEnd.getDate();
    const year = weekEnd.getFullYear();
    return `Week of ${sMonth} ${sDay}–${eDay}, ${year}`;
  };

  const badgeText =
    viewMode === "day"
      ? `${totalScheduledHours} h scheduled today`
      : viewMode === "month"
      ? `${totalScheduledHours} h scheduled this month`
      : `${totalScheduledHours} h scheduled this week`;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-[30px] font-normal text-[#252735] tracking-tight">Study calendar</h1>
          <p className="text-sm text-[#747683]">
            Dedicated time for deep work. Build a routine that respects your energy.
          </p>
        </div>

        <button
          onClick={onAddBlock}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#5553B7] hover:bg-[#48469F] text-white text-sm font-semibold transition-colors shadow-sm self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Schedule session</span>
        </button>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-3.5 px-5 border border-[#E5E6EB] rounded-xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 border border-[#E5E6EB] rounded-lg p-0.5">
            <button
              onClick={onPrev}
              className="p-1.5 hover:bg-slate-100 rounded text-[#747683] transition-colors cursor-pointer"
              title="Previous"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={onNext}
              className="p-1.5 hover:bg-slate-100 rounded text-[#747683] transition-colors cursor-pointer"
              title="Next"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={onToday}
            className="px-3 py-1.5 rounded-lg border border-[#E5E6EB] hover:bg-slate-50 text-xs font-semibold text-[#252735] transition-colors cursor-pointer"
          >
            Today
          </button>

          <span className="text-sm font-bold text-[#252735] ml-1">{formatTitle()}</span>
        </div>

        <div className="flex items-center gap-3">
          {/* View mode toggle */}
          <div className="flex items-center p-1 bg-[#F7F7F4] border border-[#E5E6EB] rounded-lg text-xs font-semibold">
            <button
              onClick={() => onViewModeChange("day")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                viewMode === "day"
                  ? "bg-white text-[#5553B7] shadow-sm font-bold"
                  : "text-[#747683] hover:text-[#252735]"
              }`}
            >
              <LayoutList className="w-3.5 h-3.5" /> Day
            </button>
            <button
              onClick={() => onViewModeChange("week")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                viewMode === "week"
                  ? "bg-white text-[#5553B7] shadow-sm font-bold"
                  : "text-[#747683] hover:text-[#252735]"
              }`}
            >
              <Calendar className="w-3.5 h-3.5" /> Week
            </button>
            <button
              onClick={() => onViewModeChange("month")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                viewMode === "month"
                  ? "bg-white text-[#5553B7] shadow-sm font-bold"
                  : "text-[#747683] hover:text-[#252735]"
              }`}
            >
              <Grid3X3 className="w-3.5 h-3.5" /> Month
            </button>
          </div>

          <span className="text-xs font-semibold bg-[#EFEEF9] px-3 py-1.5 rounded-lg text-[#5553B7]">
            {badgeText}
          </span>
        </div>
      </div>
    </div>
  );
};
