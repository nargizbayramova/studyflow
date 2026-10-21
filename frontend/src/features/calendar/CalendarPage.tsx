import React, { useState, useMemo } from "react";
import { AlertTriangle } from "lucide-react";
import { useSchedule } from "@/hooks/useSchedule";
import { useAvailabilitySlots } from "@/api/availability";
import { useTasks } from "@/api/tasks";
import { useCourses } from "@/api/courses";
import { useWorkspace } from "@/context/WorkspaceContext";
import { Course, StudyBlock } from "@/types";
import { CalendarHeader, CalendarViewMode } from "./components/CalendarHeader";
import { WeekView } from "./components/WeekView";
import { DayView } from "./components/DayView";
import { MonthView } from "./components/MonthView";
import { CalendarFooter } from "./components/CalendarFooter";
import { StudyBlockModal } from "./components/StudyBlockModal";
import { AIScheduleResultModal } from "./components/AIScheduleResultModal";
import {
  computeWeeklyAvailabilitySummary,
  getViewBlocks,
  getWeekDays,
  groupBlocksByDate,
  groupTasksByDueDate,
  shiftCalendarDate,
  sumBlocksHours,
  toDateKey,
} from "./calendarUtils";

export const CalendarPage: React.FC = () => {
  const { workspace } = useWorkspace();
  const {
    blocks,
    overloadWarning,
    lastGenerated,
    clearLastGenerated,
    isGenerating,
    isRebalancing,
    rebalancePrompt,
    dismissRebalancePrompt,
    error,
    generateSchedule,
    rebalanceSchedule,
    updateBlockStatus,
  } = useSchedule();
  const { data: availabilitySlots = [] } = useAvailabilitySlots();
  const { data: tasks = [] } = useTasks({ semester: workspace });
  const { data: courses = [] } = useCourses({ semester: workspace });

  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());
  const [viewMode, setViewMode] = useState<CalendarViewMode>("week");
  const [selectedTaskFilter, setSelectedTaskFilter] = useState<string>("all");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("all");
  const [selectedBlock, setSelectedBlock] = useState<StudyBlock | null>(null);
  const [initialSlot, setInitialSlot] = useState<Date | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const coursesById = useMemo(
    () => new Map<number, Course>(courses.map((c) => [c.id, c])),
    [courses]
  );
  const weekDays = useMemo(() => getWeekDays(currentDate), [currentDate]);

  const filteredBlocks = useMemo(
    () =>
      blocks.filter((b) => {
        if (selectedTaskFilter !== "all" && String(b.task_id) !== selectedTaskFilter) return false;
        if (selectedStatusFilter !== "all" && b.status !== selectedStatusFilter) return false;
        return true;
      }),
    [blocks, selectedTaskFilter, selectedStatusFilter]
  );

  const filteredTasks = useMemo(
    () =>
      selectedTaskFilter === "all"
        ? tasks
        : tasks.filter((t) => String(t.id) === selectedTaskFilter),
    [tasks, selectedTaskFilter]
  );

  const blocksByDate = useMemo(() => groupBlocksByDate(filteredBlocks), [filteredBlocks]);
  const tasksByDueDate = useMemo(() => groupTasksByDueDate(filteredTasks), [filteredTasks]);
  const viewBlocks = useMemo(
    () => getViewBlocks(filteredBlocks, currentDate, viewMode, weekDays),
    [filteredBlocks, currentDate, viewMode, weekDays]
  );
  const plannedHours = useMemo(
    () => sumBlocksHours(viewBlocks.filter((b) => b.status !== "missed")),
    [viewBlocks]
  );
  const completedHours = useMemo(
    () => sumBlocksHours(viewBlocks.filter((b) => b.status === "completed")),
    [viewBlocks]
  );
  const { availableHours, blockedHours } = useMemo(
    () => computeWeeklyAvailabilitySummary(availabilitySlots, weekDays),
    [availabilitySlots, weekDays]
  );

  const hasMissedBlocks = blocks.some((b) => b.status === "missed");
  const activeRebalanceReason =
    rebalancePrompt ||
    (hasMissedBlocks
      ? "You have missed study sessions. Rebalance your schedule to redistribute remaining effort."
      : null);

  return (
    <div className="flex flex-col gap-5 sm:gap-6 max-w-7xl mx-auto font-sans">
      <CalendarHeader
        currentDate={currentDate}
        weekDays={weekDays}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onPrev={() => setCurrentDate((d) => shiftCalendarDate(d, viewMode, -1))}
        onNext={() => setCurrentDate((d) => shiftCalendarDate(d, viewMode, 1))}
        onToday={() => setCurrentDate(new Date())}
        onAddBlock={() => {
          setSelectedBlock(null);
          setInitialSlot(null);
          setIsModalOpen(true);
        }}
        onGenerateSchedule={() => void generateSchedule()}
        onRebalanceSchedule={() => void rebalanceSchedule()}
        isGenerating={isGenerating}
        isRebalancing={isRebalancing}
        plannedHours={plannedHours}
        completedHours={completedHours}
        availableHours={availableHours}
        blockedHours={blockedHours}
        tasks={tasks}
        selectedTaskFilter={selectedTaskFilter}
        onTaskFilterChange={setSelectedTaskFilter}
        selectedStatusFilter={selectedStatusFilter}
        onStatusFilterChange={setSelectedStatusFilter}
      />

      {activeRebalanceReason && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-[#EFEEF9] border border-[#CAC7EA] text-[#252735] text-xs font-medium">
          <span>{activeRebalanceReason}</span>
          <div className="flex items-center gap-2 self-start sm:self-auto flex-shrink-0">
            <button
              type="button"
              onClick={() => void rebalanceSchedule()}
              disabled={isRebalancing || isGenerating}
              className="px-3 py-1.5 rounded-lg bg-[#5553B7] hover:bg-[#48469F] disabled:opacity-60 text-white text-xs font-semibold transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              {isRebalancing ? "Rebalancing..." : "🔄 Rebalance Now"}
            </button>
            {rebalancePrompt && (
              <button
                type="button"
                onClick={dismissRebalancePrompt}
                className="px-2 py-1 text-[#747683] hover:text-[#252735] text-xs cursor-pointer"
              >
                Dismiss
              </button>
            )}
          </div>
        </div>
      )}

      {overloadWarning && (
        <div className="flex items-center gap-3 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium">
          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <span>
            Overload warning: Your pending tasks require more study hours than your available weekly slots before their deadlines.
          </span>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
          {error}
        </div>
      )}

      {viewMode === "week" && (
        <WeekView
          weekDays={weekDays}
          blocksByDate={blocksByDate}
          tasksByDueDate={tasksByDueDate}
          coursesById={coursesById}
          availabilitySlots={availabilitySlots}
          onSelectBlock={(block) => {
            setSelectedBlock(block);
            setInitialSlot(null);
            setIsModalOpen(true);
          }}
          onSelectSlot={(slot) => {
            setSelectedBlock(null);
            setInitialSlot(slot);
            setIsModalOpen(true);
          }}
          onStatusChange={(b, status) => void updateBlockStatus(b, status)}
        />
      )}

      {viewMode === "day" && (
        <DayView
          currentDate={currentDate}
          dayBlocks={blocksByDate.get(toDateKey(currentDate)) ?? []}
          dayTasks={tasksByDueDate.get(toDateKey(currentDate)) ?? []}
          coursesById={coursesById}
          availabilitySlots={availabilitySlots}
          onSelectBlock={(block) => {
            setSelectedBlock(block);
            setInitialSlot(null);
            setIsModalOpen(true);
          }}
          onSelectSlot={(slot) => {
            setSelectedBlock(null);
            setInitialSlot(slot);
            setIsModalOpen(true);
          }}
          onStatusChange={(b, status) => void updateBlockStatus(b, status)}
        />
      )}

      {viewMode === "month" && (
        <MonthView
          currentDate={currentDate}
          blocksByDate={blocksByDate}
          onSelectBlock={(block) => {
            setSelectedBlock(block);
            setInitialSlot(null);
            setIsModalOpen(true);
          }}
          onSelectSlot={(slot) => {
            setSelectedBlock(null);
            setInitialSlot(slot);
            setIsModalOpen(true);
          }}
        />
      )}

      <CalendarFooter />

      <StudyBlockModal
        key={selectedBlock?.id ?? initialSlot?.getTime() ?? "new"}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedBlock(null);
          setInitialSlot(null);
        }}
        block={selectedBlock}
        initialSlot={initialSlot}
      />

      <AIScheduleResultModal result={lastGenerated} onClose={clearLastGenerated} />
    </div>
  );
};
