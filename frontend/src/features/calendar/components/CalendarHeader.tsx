import React from "react";
import { Plus, ChevronLeft, ChevronRight, Download } from "lucide-react";
import { Task } from "@/types";
import { downloadScheduleIcs } from "@/utils/calendar";
import { Select } from "@/components/common/Select";
import { CalendarViewMode, formatCalendarTitle } from "../calendarUtils";
import { CalendarActionMenu } from "./CalendarActionMenu";

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
  return (
    <div className="flex flex-col gap-5">
      {/* Row 1: Title & Action Center */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl sm:text-[30px] font-normal leading-[1.45] text-[#252735] tracking-tight">
            Study calendar
          </h1>
          <p className="text-xs sm:text-[14px] text-[#747683]">
            Make a realistic plan. Schedule study blocks around your available time.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => void downloadScheduleIcs()}
            title="Import into Google Calendar -> Settings -> Import & Export"
            className="inline-flex items-center gap-1.5 px-3 py-[10px] rounded-[8px] border border-[#E5E6EB] bg-white hover:bg-[#F7F7F4] text-[#252735] text-xs sm:text-[13px] font-semibold transition-colors cursor-pointer shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-[#747683]" />
            <span>Export .ics</span>
          </button>

          <CalendarActionMenu
            onGenerateSchedule={onGenerateSchedule}
            onRebalanceSchedule={onRebalanceSchedule}
            isGenerating={isGenerating}
            isRebalancing={isRebalancing}
          />

          <button
            type="button"
            onClick={onAddBlock}
            className="inline-flex items-center justify-center gap-2 px-3.5 sm:px-4 py-[10px] rounded-[8px] bg-[#5553B7] hover:bg-[#48469F] text-white text-xs sm:text-[14px] font-semibold transition-colors cursor-pointer shadow-2xs"
          >
            <Plus className="w-4 h-4 flex-shrink-0" />
            <span>Schedule study block</span>
          </button>
        </div>
      </div>

      {/* Row 2: Date Navigation & View Mode */}
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

      {/* Row 3: Study Stats on Left & Filters on Right */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <span className="px-2.5 py-1 rounded-[6px] bg-[#EFEEF9] text-[#5553B7] text-[12px] font-medium">
            {plannedHours} h planned
          </span>
          <span className="px-2.5 py-1 rounded-[6px] bg-[#EAF4EF] text-[#327864] text-[12px] font-medium">
            {completedHours} h session time completed
          </span>
          <span className="text-[12px] text-[#747683]">
            {availableHours} h available · {blockedHours} h blocked each week
          </span>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Select
            value={selectedTaskFilter}
            onChange={onTaskFilterChange}
            options={[
              { value: "all", label: "All tasks" },
              ...tasks.map((t) => ({ value: String(t.id), label: t.title })),
            ]}
            className="flex-1 sm:flex-initial min-w-0"
            buttonClassName="h-[36px] text-xs sm:text-[13px] font-semibold"
          />

          <Select
            value={selectedStatusFilter}
            onChange={onStatusFilterChange}
            options={[
              { value: "all", label: "All statuses" },
              { value: "planned", label: "Planned" },
              { value: "completed", label: "Completed" },
              { value: "missed", label: "Missed" },
            ]}
            className="flex-1 sm:flex-initial min-w-0"
            buttonClassName="h-[36px] text-xs sm:text-[13px] font-semibold"
          />
        </div>
      </div>
    </div>
  );
};
