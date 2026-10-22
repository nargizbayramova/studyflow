import React from "react";
import { CalendarViewMode } from "../calendarUtils";
import { CalendarTitleBar } from "./CalendarTitleBar";
import { CalendarNav } from "./CalendarNav";
import { CalendarStatsFilters } from "./CalendarStatsFilters";

export type { CalendarViewMode };

type Props = React.ComponentProps<typeof CalendarTitleBar> &
  React.ComponentProps<typeof CalendarNav> &
  React.ComponentProps<typeof CalendarStatsFilters>;

export const CalendarHeader: React.FC<Props> = (p) => (
  <div className="flex flex-col gap-5">
    <CalendarTitleBar
      onAddBlock={p.onAddBlock}
      onGenerateSchedule={p.onGenerateSchedule}
      onRebalanceSchedule={p.onRebalanceSchedule}
      isGenerating={p.isGenerating}
      isRebalancing={p.isRebalancing}
    />
    <CalendarNav
      currentDate={p.currentDate}
      weekDays={p.weekDays}
      viewMode={p.viewMode}
      onViewModeChange={p.onViewModeChange}
      onPrev={p.onPrev}
      onNext={p.onNext}
      onToday={p.onToday}
    />
    <CalendarStatsFilters
      plannedHours={p.plannedHours}
      completedHours={p.completedHours}
      availableHours={p.availableHours}
      blockedHours={p.blockedHours}
      tasks={p.tasks}
      selectedTaskFilter={p.selectedTaskFilter}
      onTaskFilterChange={p.onTaskFilterChange}
      selectedStatusFilter={p.selectedStatusFilter}
      onStatusFilterChange={p.onStatusFilterChange}
    />
  </div>
);
