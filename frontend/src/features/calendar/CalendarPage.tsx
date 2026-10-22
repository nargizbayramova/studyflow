import React from "react";
import { useSchedule } from "@/features/calendar/hooks/useSchedule";
import { useAvailabilitySlots } from "@/features/availability/api/availability";
import { useTasks } from "@/features/tasks/api/tasks";
import { useCourses } from "@/features/courses/api/courses";
import { useWorkspace } from "@/features/workspace/context/WorkspaceContext";
import { BlockStatus, StudyBlock } from "@/features/calendar/types";
import { useCalendarView } from "./hooks/useCalendarView";
import { useBlockModal } from "./hooks/useBlockModal";
import { CalendarHeader } from "./components/CalendarHeader";
import { CalendarAlerts } from "./components/CalendarAlerts";
import { WeekView } from "./components/WeekView";
import { DayView } from "./components/DayView";
import { MonthView } from "./components/MonthView";
import { CalendarFooter } from "./components/CalendarFooter";
import { StudyBlockModal } from "./components/StudyBlockModal";
import { AIScheduleResultModal } from "./components/AIScheduleResultModal";
import { toDateKey } from "./calendarUtils";

export const CalendarPage: React.FC = () => {
  const { workspace } = useWorkspace();
  const schedule = useSchedule();
  const { blocks, rebalancePrompt, isGenerating, isRebalancing } = schedule;
  const { data: availabilitySlots = [] } = useAvailabilitySlots();
  const { data: tasks = [] } = useTasks({ semester: workspace });
  const { data: courses = [] } = useCourses({ semester: workspace });

  const view = useCalendarView(blocks, tasks, courses, availabilitySlots);
  const modal = useBlockModal();

  const rebalanceReason =
    rebalancePrompt ||
    (blocks.some((b) => b.status === "missed")
      ? "You have missed study sessions. Rebalance your schedule to redistribute remaining effort."
      : null);

  // Props shared by the week/day views and (partly) the month view.
  const interactions = { onSelectBlock: modal.openBlock, onSelectSlot: modal.openSlot };
  const shared = {
    coursesById: view.coursesById,
    availabilitySlots,
    onStatusChange: (b: StudyBlock, status: BlockStatus) => void schedule.updateBlockStatus(b, status),
    ...interactions,
  };
  const dateKey = toDateKey(view.currentDate);

  return (
    <div className="flex flex-col gap-5 sm:gap-6 max-w-7xl mx-auto font-sans">
      <CalendarHeader
        currentDate={view.currentDate}
        weekDays={view.weekDays}
        viewMode={view.viewMode}
        onViewModeChange={view.setViewMode}
        onPrev={view.goPrev}
        onNext={view.goNext}
        onToday={view.goToday}
        onAddBlock={modal.openNew}
        onGenerateSchedule={() => void schedule.generateSchedule()}
        onRebalanceSchedule={() => void schedule.rebalanceSchedule()}
        isGenerating={isGenerating}
        isRebalancing={isRebalancing}
        plannedHours={view.plannedHours}
        completedHours={view.completedHours}
        availableHours={view.availableHours}
        blockedHours={view.blockedHours}
        tasks={tasks}
        selectedTaskFilter={view.selectedTaskFilter}
        onTaskFilterChange={view.setSelectedTaskFilter}
        selectedStatusFilter={view.selectedStatusFilter}
        onStatusFilterChange={view.setSelectedStatusFilter}
      />

      <CalendarAlerts
        rebalanceReason={rebalanceReason}
        canDismiss={!!rebalancePrompt}
        overloadWarning={schedule.overloadWarning}
        error={schedule.error}
        busy={isRebalancing || isGenerating}
        isRebalancing={isRebalancing}
        onRebalance={() => void schedule.rebalanceSchedule()}
        onDismiss={schedule.dismissRebalancePrompt}
      />

      {view.viewMode === "week" && (
        <WeekView
          weekDays={view.weekDays}
          blocksByDate={view.blocksByDate}
          tasksByDueDate={view.tasksByDueDate}
          {...shared}
        />
      )}
      {view.viewMode === "day" && (
        <DayView
          currentDate={view.currentDate}
          dayBlocks={view.blocksByDate.get(dateKey) ?? []}
          dayTasks={view.tasksByDueDate.get(dateKey) ?? []}
          {...shared}
        />
      )}
      {view.viewMode === "month" && (
        <MonthView currentDate={view.currentDate} blocksByDate={view.blocksByDate} {...interactions} />
      )}

      <CalendarFooter />

      <StudyBlockModal
        key={modal.selectedBlock?.id ?? modal.initialSlot?.getTime() ?? "new"}
        isOpen={modal.isOpen}
        onClose={modal.close}
        block={modal.selectedBlock}
        initialSlot={modal.initialSlot}
      />

      <AIScheduleResultModal result={schedule.lastGenerated} onClose={schedule.clearLastGenerated} />
    </div>
  );
};
