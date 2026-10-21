import React from "react";
import { Plus, ChevronLeft, ChevronRight, Calendar, LayoutList, Grid3X3, Sparkles } from "lucide-react";
import { downloadScheduleIcs } from "@/utils/calendar";
import { CalendarViewMode, formatCalendarTitle } from "../calendarUtils";

export type { CalendarViewMode };

const VIEW_OPTIONS: { id: CalendarViewMode; label: string; Icon: React.FC<{ className?: string }> }[] = [
  { id: "day", label: "Day", Icon: LayoutList },
  { id: "week", label: "Week", Icon: Calendar },
  { id: "month", label: "Month", Icon: Grid3X3 },
];

const PERIOD_LABELS: Record<CalendarViewMode, string> = {
  day: "today",
  week: "this week",
  month: "this month",
};

interface CalendarHeaderProps {
  currentDate: Date;
  weekDays: Date[];
  viewMode: CalendarViewMode;
  onViewModeChange: (mode: CalendarViewMode) => void;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onAddBlock: () => void;
  onGenerateSchedule: () => void;
  onRebalanceSchedule: () => void;
  isGenerating: boolean;
  isRebalancing: boolean;
  totalScheduledHours: number;
}

export const CalendarHeader: React.FC<CalendarHeaderProps> = ({
  currentDate,
  weekDays,
  viewMode,
  onViewModeChange,
  onPrev,
  onNext,
  onToday,
  onAddBlock,
  onGenerateSchedule,
  onRebalanceSchedule,
  isGenerating,
  isRebalancing,
  totalScheduledHours,
}) => {
  const busy = isGenerating || isRebalancing;

  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      {/* Top Header: Title + Primary Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl sm:text-[30px] font-normal text-[#252735] tracking-tight">
            Study calendar
          </h1>
          <p className="text-xs sm:text-sm text-[#747683]">
            Dedicated time for deep work. Build a routine that respects your energy.
          </p>
        </div>

        <button
          onClick={onAddBlock}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-[#5553B7] hover:bg-[#48469F] text-white text-xs sm:text-sm font-semibold transition-colors shadow-sm cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 flex-shrink-0" />
          <span>Schedule session</span>
        </button>
      </div>

      {/* Dedicated AI & Export Sub-bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-2.5 sm:px-4 sm:py-2.5 bg-[#F7F7F4] border border-[#E5E6EB] rounded-xl text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onGenerateSchedule}
            disabled={busy}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#5553B7] bg-[#EFEEF9] hover:bg-[#E2E0F5] disabled:opacity-60 text-[#5553B7] font-semibold transition-colors cursor-pointer disabled:cursor-not-allowed"
          >
            <Sparkles className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{isGenerating ? "Generating..." : "Generate AI Schedule"}</span>
          </button>

          <button
            onClick={onRebalanceSchedule}
            disabled={busy}
            className="inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg border border-[#E5E6EB] bg-white hover:bg-slate-50 disabled:opacity-60 text-[#252735] font-semibold transition-colors shadow-2xs cursor-pointer disabled:cursor-not-allowed"
          >
            <span>{isRebalancing ? "Rebalancing..." : "🔄 Rebalance Schedule"}</span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => void downloadScheduleIcs()}
          title="Import into Google Calendar -> Settings -> Import & Export"
          className="inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg border border-[#E5E6EB] bg-white hover:bg-slate-50 text-[#252735] font-semibold transition-colors shadow-2xs cursor-pointer self-start sm:self-auto"
        >
          <span>📅 Export .ics</span>
        </button>
      </div>

      {/* Calendar Controls Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-3 sm:p-3.5 sm:px-5 border border-[#E5E6EB] rounded-xl shadow-sm">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
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

          <span className="text-xs sm:text-sm font-bold text-[#252735] ml-0.5 truncate">
            {formatCalendarTitle(currentDate, viewMode, weekDays)}
          </span>
        </div>

        <div className="flex flex-wrap items-center justify-between sm:justify-start gap-2.5 sm:gap-3">
          <div className="flex items-center p-1 bg-[#F7F7F4] border border-[#E5E6EB] rounded-lg text-xs font-semibold">
            {VIEW_OPTIONS.map(({ id, label, Icon }) => (
              <button
                key={id}
                onClick={() => onViewModeChange(id)}
                className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                  viewMode === id
                    ? "bg-white text-[#5553B7] shadow-sm font-bold"
                    : "text-[#747683] hover:text-[#252735]"
                }`}
              >
                <Icon className="w-3.5 h-3.5" /> {label}
              </button>
            ))}
          </div>

          <span className="text-[11px] sm:text-xs font-semibold bg-[#EFEEF9] px-2.5 sm:px-3 py-1.5 rounded-lg text-[#5553B7] whitespace-nowrap">
            {totalScheduledHours} h scheduled {PERIOD_LABELS[viewMode]}
          </span>
        </div>
      </div>
    </div>
  );
};
