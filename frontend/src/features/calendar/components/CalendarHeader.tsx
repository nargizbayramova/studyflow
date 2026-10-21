import React from "react";
import { Plus, ChevronLeft, ChevronRight, ChevronDown, Sparkles } from "lucide-react";
import { Task } from "@/types";
import { downloadScheduleIcs } from "@/utils/calendar";
import { CalendarViewMode, formatCalendarTitle } from "../calendarUtils";

export type { CalendarViewMode };

const VIEW_MODES: { id: CalendarViewMode; label: string }[] = [
  { id: "day", label: "Day" },
  { id: "week", label: "Week" },
  { id: "month", label: "Month" },
];

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
  plannedHours: number;
  completedHours: number;
  availableHours: number;
  blockedHours: number;
  tasks: Task[];
  selectedTaskFilter: string;
  onTaskFilterChange: (val: string) => void;
  selectedStatusFilter: string;
  onStatusFilterChange: (val: string) => void;
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
  plannedHours,
  completedHours,
  availableHours,
  blockedHours,
  tasks,
  selectedTaskFilter,
  onTaskFilterChange,
  selectedStatusFilter,
  onStatusFilterChange,
}) => {
  const busy = isGenerating || isRebalancing;

  return (
    <div className="flex flex-col gap-5">
      {/* Row 1: Title & Primary Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl sm:text-[30px] font-normal leading-[1.45] text-[#252735] tracking-tight">
            Study calendar
          </h1>
          <p className="text-xs sm:text-[14px] text-[#747683]">
            Make a realistic plan. Schedule study blocks around your available time.
          </p>
        </div>

        <button
          type="button"
          onClick={onAddBlock}
          className="inline-flex items-center justify-center gap-2 px-4 py-[11px] rounded-[8px] bg-[#5553B7] hover:bg-[#48469F] text-white text-[14px] font-semibold transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 flex-shrink-0" />
          <span>Schedule study block</span>
        </button>
      </div>

      {/* Row 2: Today, Arrows, Date Range & View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToday}
            className="px-3.5 py-2 rounded-[8px] bg-white border border-[#E5E6EB] hover:bg-[#F7F7F4] text-[13px] font-semibold text-[#252735] transition-colors cursor-pointer"
          >
            Today
          </button>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onPrev}
              className="p-1.5 rounded-md text-[#747683] hover:text-[#252735] hover:bg-black/5 transition-colors cursor-pointer"
              aria-label="Previous"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onNext}
              className="p-1.5 rounded-md text-[#747683] hover:text-[#252735] hover:bg-black/5 transition-colors cursor-pointer"
              aria-label="Next"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <span className="text-base sm:text-[18px] font-semibold text-[#252735]">
            {formatCalendarTitle(currentDate, viewMode, weekDays)}
          </span>
        </div>

        <div className="inline-flex items-center p-1 bg-white border border-[#E5E6EB] rounded-[10px] self-start sm:self-auto">
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

      {/* Row 3: Status Badges, Availability Summary, Filters & AI/Export Utilities */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          <span className="px-2.5 py-1 rounded-[6px] bg-[#EFEEF9] text-[#5553B7] text-[12px] font-medium">
            {plannedHours} h planned
          </span>
          <span className="px-2.5 py-1 rounded-[6px] bg-[#EAF4EF] text-[#327864] text-[12px] font-medium">
            {completedHours} h session time completed
          </span>
          <span className="text-[12px] text-[#747683]">
            {availableHours} h available · {blockedHours} h blocked each week
          </span>

          <div className="relative">
            <ChevronDown className="w-3.5 h-3.5 text-[#252735] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={selectedTaskFilter}
              onChange={(e) => onTaskFilterChange(e.target.value)}
              className="h-[38px] pl-8 pr-3.5 bg-white border border-[#E5E6EB] rounded-[8px] text-[13px] font-semibold text-[#252735] appearance-none focus:outline-none focus:border-[#5553B7] cursor-pointer"
            >
              <option value="all">All tasks</option>
              {tasks.map((t) => (
                <option key={t.id} value={String(t.id)}>
                  {t.title}
                </option>
              ))}
            </select>
          </div>

          <div className="relative">
            <ChevronDown className="w-3.5 h-3.5 text-[#252735] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={selectedStatusFilter}
              onChange={(e) => onStatusFilterChange(e.target.value)}
              className="h-[38px] pl-8 pr-3.5 bg-white border border-[#E5E6EB] rounded-[8px] text-[13px] font-semibold text-[#252735] appearance-none focus:outline-none focus:border-[#5553B7] cursor-pointer"
            >
              <option value="all">All session statuses</option>
              <option value="planned">Planned</option>
              <option value="completed">Completed</option>
              <option value="missed">Missed</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onGenerateSchedule}
            disabled={busy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] border border-[#5553B7] bg-[#EFEEF9] hover:bg-[#E2E0F5] disabled:opacity-60 text-[#5553B7] text-xs font-semibold transition-colors cursor-pointer disabled:cursor-not-allowed"
          >
            <Sparkles className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{isGenerating ? "Generating..." : "Generate AI Schedule"}</span>
          </button>

          <button
            type="button"
            onClick={onRebalanceSchedule}
            disabled={busy}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-[8px] border border-[#E5E6EB] bg-white hover:bg-[#F7F7F4] disabled:opacity-60 text-[#252735] text-xs font-semibold transition-colors cursor-pointer disabled:cursor-not-allowed"
          >
            <span>{isRebalancing ? "Rebalancing..." : "🔄 Rebalance"}</span>
          </button>

          <button
            type="button"
            onClick={() => void downloadScheduleIcs()}
            title="Import into Google Calendar -> Settings -> Import & Export"
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-[8px] border border-[#E5E6EB] bg-white hover:bg-[#F7F7F4] text-[#252735] text-xs font-semibold transition-colors cursor-pointer"
          >
            <span>📅 Export .ics</span>
          </button>
        </div>
      </div>
    </div>
  );
};
