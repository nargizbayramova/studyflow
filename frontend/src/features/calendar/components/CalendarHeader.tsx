import React from "react";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";

interface CalendarHeaderProps {
  weekStart: Date;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onToday: () => void;
  onOpenSchedule: () => void;
  totalWeekHours: number;
}

export const CalendarHeader: React.FC<CalendarHeaderProps> = ({
  weekStart,
  onPrevWeek,
  onNextWeek,
  onToday,
  onOpenSchedule,
  totalWeekHours,
}) => {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  const formatRange = () => {
    const sMonth = weekStart.toLocaleDateString("en-US", { month: "short" });
    const sDay = weekStart.getDate();
    const eDay = weekEnd.getDate();
    const year = weekEnd.getFullYear();
    return `Week of ${sMonth} ${sDay}–${eDay}, ${year}`;
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-[30px] font-normal text-[#252735] tracking-tight">
            Study calendar
          </h1>
          <p className="text-sm text-[#747683]">
            Dedicated time for deep work. Build a routine that respects your energy.
          </p>
        </div>

        <button
          onClick={onOpenSchedule}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#5553B7] hover:bg-[#48469F] text-white text-sm font-semibold transition-colors shadow-sm self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Schedule session</span>
        </button>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-3.5 px-5 border border-[#E5E6EB] rounded-xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 border border-[#E5E6EB] rounded-lg p-0.5">
            <button
              onClick={onPrevWeek}
              className="p-1.5 hover:bg-slate-100 rounded text-[#747683] transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={onNextWeek}
              className="p-1.5 hover:bg-slate-100 rounded text-[#747683] transition-colors cursor-pointer"
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

          <span className="text-sm font-semibold text-[#252735] ml-1">
            {formatRange()}
          </span>
        </div>

        <span className="text-xs font-medium text-[#747683] bg-[#EFEEF9] px-3 py-1.5 rounded-lg text-[#5553B7]">
          {totalWeekHours} h scheduled this week
        </span>
      </div>
    </div>
  );
};
