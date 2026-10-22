import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { CalendarViewMode, formatCalendarTitle } from "../calendarUtils";

const VIEW_MODES: { id: CalendarViewMode; label: string }[] = [
  { id: "day", label: "Day" },
  { id: "week", label: "Week" },
  { id: "month", label: "Month" },
];

const ARROW = "p-1.5 rounded-md text-[#747683] hover:text-[#252735] hover:bg-black/5 transition-colors cursor-pointer";

interface Props {
  currentDate: Date;
  weekDays: Date[];
  viewMode: CalendarViewMode;
  onViewModeChange: (mode: CalendarViewMode) => void;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
}

/** Row 2 of the calendar header: date navigation and Day/Week/Month switch. */
export const CalendarNav: React.FC<Props> = ({
  currentDate,
  weekDays,
  viewMode,
  onViewModeChange,
  onPrev,
  onNext,
  onToday,
}) => (
  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={onToday}
        className="px-3.5 py-2 rounded-[8px] bg-white border border-[#E5E6EB] hover:bg-[#F7F7F4] text-[13px] font-semibold text-[#252735] transition-colors cursor-pointer shadow-2xs"
      >
        Today
      </button>
      <div className="flex items-center gap-1">
        <button type="button" onClick={onPrev} className={ARROW} aria-label="Previous">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button type="button" onClick={onNext} className={ARROW} aria-label="Next">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      <span className="text-base sm:text-[18px] font-semibold text-[#252735]">
        {formatCalendarTitle(currentDate, viewMode, weekDays)}
      </span>
    </div>

    <div className="inline-flex items-center p-1 bg-white border border-[#E5E6EB] rounded-[10px] self-start sm:self-auto shadow-2xs">
      {VIEW_MODES.map(({ id, label }) => (
        <button
          key={id}
          type="button"
          onClick={() => onViewModeChange(id)}
          className={`px-3.5 py-1.5 rounded-[7px] text-[13px] transition-colors cursor-pointer ${
            viewMode === id
              ? "bg-[#EFEEF9] text-[#5553B7] font-semibold"
              : "text-[#747683] hover:text-[#252735] font-normal"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  </div>
);
