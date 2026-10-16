import React, { useState, useMemo } from "react";
import { AlertTriangle } from "lucide-react";
import { useSchedule } from "@/hooks/useSchedule";
import { StudyBlock } from "@/types";
import { CalendarHeader, CalendarViewMode } from "./components/CalendarHeader";
import { WeekView } from "./components/WeekView";
import { DayView } from "./components/DayView";
import { MonthView } from "./components/MonthView";
import { StudyBlockModal } from "./components/StudyBlockModal";
import { AIScheduleResultModal } from "./components/AIScheduleResultModal";
import {
  getViewScheduledHours,
  getWeekDays,
  groupBlocksByDate,
  shiftCalendarDate,
  toDateKey,
} from "./calendarUtils";

export const CalendarPage: React.FC = () => {
  const {
    blocks,
    overloadWarning,
    lastGenerated,
    clearLastGenerated,
    isGenerating,
    error,
    generateSchedule,
  } = useSchedule();
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());
  const [viewMode, setViewMode] = useState<CalendarViewMode>("week");
  const [selectedBlock, setSelectedBlock] = useState<StudyBlock | null>(null);
  const [initialSlot, setInitialSlot] = useState<Date | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const weekDays = useMemo(() => getWeekDays(currentDate), [currentDate]);
  const blocksByDate = useMemo(() => groupBlocksByDate(blocks), [blocks]);
  const totalScheduledHours = useMemo(
    () => getViewScheduledHours(blocks, currentDate, viewMode, weekDays),
    [blocks, currentDate, viewMode, weekDays]
  );

  const openCreateModal = (slot?: Date) => {
    setSelectedBlock(null);
    setInitialSlot(slot || null);
    setIsModalOpen(true);
  };

  const openEditModal = (block: StudyBlock) => {
    setSelectedBlock(block);
    setInitialSlot(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedBlock(null);
    setInitialSlot(null);
  };

  return (
    <div className="space-y-6">
      <CalendarHeader
        currentDate={currentDate}
        weekDays={weekDays}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onPrev={() => setCurrentDate((d) => shiftCalendarDate(d, viewMode, -1))}
        onNext={() => setCurrentDate((d) => shiftCalendarDate(d, viewMode, 1))}
        onToday={() => setCurrentDate(new Date())}
        onAddBlock={() => openCreateModal()}
        onGenerateSchedule={() => void generateSchedule()}
        isGenerating={isGenerating}
        totalScheduledHours={totalScheduledHours}
      />

      {overloadWarning && (
        <div className="flex items-center gap-3 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium">
          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <span>
            Overload warning: Your pending tasks require more study hours than your available weekly slots before their deadlines. Consider extending your availability or adjusting task estimates.
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
          onSelectBlock={openEditModal}
          onSelectSlot={openCreateModal}
        />
      )}

      {viewMode === "day" && (
        <DayView
          currentDate={currentDate}
          dayBlocks={blocksByDate.get(toDateKey(currentDate)) ?? []}
          onSelectBlock={openEditModal}
          onSelectSlot={openCreateModal}
        />
      )}

      {viewMode === "month" && (
        <MonthView
          currentDate={currentDate}
          blocksByDate={blocksByDate}
          onSelectBlock={openEditModal}
          onSelectSlot={openCreateModal}
        />
      )}

      <StudyBlockModal
        isOpen={isModalOpen}
        onClose={closeModal}
        block={selectedBlock}
        initialSlot={initialSlot}
      />

      <AIScheduleResultModal result={lastGenerated} onClose={clearLastGenerated} />
    </div>
  );
};
