import React from "react";
import { Task } from "@/features/tasks/types";
import { Select } from "@/shared/ui/Select";

const FILTER_BUTTON = "h-[36px] text-xs sm:text-[13px] font-semibold";

interface Props {
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

/** Row 3 of the calendar header: hour stats on the left, task/status filters on the right. */
export const CalendarStatsFilters: React.FC<Props> = (p) => (
  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
      <span className="px-2.5 py-1 rounded-[6px] bg-[#EFEEF9] text-[#5553B7] text-[12px] font-medium">
        {p.plannedHours} h planned
      </span>
      <span className="px-2.5 py-1 rounded-[6px] bg-[#EAF4EF] text-[#327864] text-[12px] font-medium">
        {p.completedHours} h session time completed
      </span>
      <span className="text-[12px] text-[#747683]">
        {p.availableHours} h available · {p.blockedHours} h blocked each week
      </span>
    </div>

    <div className="flex items-center gap-2 w-full sm:w-auto">
      <Select
        value={p.selectedTaskFilter}
        onChange={p.onTaskFilterChange}
        options={[{ value: "all", label: "All tasks" }, ...p.tasks.map((t) => ({ value: String(t.id), label: t.title }))]}
        className="flex-1 sm:flex-initial min-w-0"
        buttonClassName={FILTER_BUTTON}
      />
      <Select
        value={p.selectedStatusFilter}
        onChange={p.onStatusFilterChange}
        options={[
          { value: "all", label: "All statuses" },
          { value: "planned", label: "Planned" },
          { value: "completed", label: "Completed" },
          { value: "missed", label: "Missed" },
        ]}
        className="flex-1 sm:flex-initial min-w-0"
        buttonClassName={FILTER_BUTTON}
      />
    </div>
  </div>
);
