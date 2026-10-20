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
    isRebalancing,
    rebalancePrompt,
    dismissRebalancePrompt,
    error,
    generateSchedule,
    rebalanceSchedule,
    updateBlockStatus,
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
  const hasMissedBlocks = useMemo(() => blocks.some((b) => b.status === "missed"), [blocks]);
  const activeRebalanceReason =
    rebalancePrompt ||
    (hasMissedBlocks
      ? "You have missed study sessions. Rebalance your schedule to redistribute remaining effort."
      : null);

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
        onRebalanceSchedule={() => void rebalanceSchedule()}
        isGenerating={isGenerating}
        isRebalancing={isRebalancing}
        totalScheduledHours={totalScheduledHours}
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
          onStatusChange={(b, status) => void updateBlockStatus(b, status)}
        />
      )}

      {viewMode === "day" && (
        <DayView
          currentDate={currentDate}
          dayBlocks={blocksByDate.get(toDateKey(currentDate)) ?? []}
          onSelectBlock={openEditModal}
          onSelectSlot={openCreateModal}
          onStatusChange={(b, status) => void updateBlockStatus(b, status)}
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
