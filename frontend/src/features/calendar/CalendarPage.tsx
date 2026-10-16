import React, { useState, useMemo } from "react";
import { useStudyBlocks } from "@/api/studyBlocks";
import { useWorkspace } from "@/context/WorkspaceContext";
import { StudyBlock } from "@/types";
import { CalendarHeader, CalendarViewMode } from "./components/CalendarHeader";
import { WeekView } from "./components/WeekView";
import { DayView } from "./components/DayView";
import { MonthView } from "./components/MonthView";
import { StudyBlockModal } from "./components/StudyBlockModal";
import {
  getViewScheduledHours,
  getWeekDays,
  groupBlocksByDate,
  shiftCalendarDate,
  toDateKey,
} from "./calendarUtils";

export const CalendarPage: React.FC = () => {
  const { workspace } = useWorkspace();
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());
  const [viewMode, setViewMode] = useState<CalendarViewMode>("week");
  const [selectedBlock, setSelectedBlock] = useState<StudyBlock | null>(null);
  const [initialSlot, setInitialSlot] = useState<Date | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: blocks = [] } = useStudyBlocks({ semester: workspace });

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
        totalScheduledHours={totalScheduledHours}
      />

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
    </div>
  );
};
