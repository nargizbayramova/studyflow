import React, { useState, useMemo } from "react";
import {
  useStudyBlocks,
  useCreateStudyBlock,
  useUpdateStudyBlock,
  useDeleteStudyBlock,
} from "@/api/studyBlocks";
import { useTasks } from "@/api/tasks";
import { useCourses } from "@/api/courses";
import { useWorkspace } from "@/context/WorkspaceContext";
import { StudyBlock } from "@/types";
import { CalendarHeader, CalendarViewMode } from "./components/CalendarHeader";
import { WeekView } from "./components/WeekView";
import { DayView } from "./components/DayView";
import { MonthView } from "./components/MonthView";
import { StudyBlockModal } from "./components/StudyBlockModal";

export const CalendarPage: React.FC = () => {
  const { workspace } = useWorkspace();
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());
  const [viewMode, setViewMode] = useState<CalendarViewMode>("week");
  const [selectedBlock, setSelectedBlock] = useState<StudyBlock | null>(null);
  const [initialSlot, setInitialSlot] = useState<Date | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: blocks = [] } = useStudyBlocks({ semester: workspace });
  const { data: tasks = [] } = useTasks({ semester: workspace });
  const { data: courses = [] } = useCourses({ semester: workspace });

  const createBlock = useCreateStudyBlock();
  const updateBlock = useUpdateStudyBlock();
  const deleteBlock = useDeleteStudyBlock();

  const handlePrev = () => {
    setCurrentDate((prev) => {
      const d = new Date(prev);
      if (viewMode === "day") d.setDate(d.getDate() - 1);
      else if (viewMode === "week") d.setDate(d.getDate() - 7);
      else d.setMonth(d.getMonth() - 1);
      return d;
    });
  };

  const handleNext = () => {
    setCurrentDate((prev) => {
      const d = new Date(prev);
      if (viewMode === "day") d.setDate(d.getDate() + 1);
      else if (viewMode === "week") d.setDate(d.getDate() + 7);
      else d.setMonth(d.getMonth() + 1);
      return d;
    });
  };

  const weekDays = useMemo(() => {
    const d = new Date(currentDate);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));
    monday.setHours(0, 0, 0, 0);

    return Array.from({ length: 7 }, (_, i) => {
      const next = new Date(monday);
      next.setDate(monday.getDate() + i);
      return next;
    });
  }, [currentDate]);

  const totalScheduledHours = useMemo(() => {
    let relevantBlocks = blocks;
    if (viewMode === "day") {
      relevantBlocks = blocks.filter((b) => {
        const bd = new Date(b.start_at);
        return (
          bd.getDate() === currentDate.getDate() &&
          bd.getMonth() === currentDate.getMonth() &&
          bd.getFullYear() === currentDate.getFullYear()
        );
      });
    } else if (viewMode === "week") {
      const start = weekDays[0].getTime();
      const end = new Date(weekDays[6]).setHours(23, 59, 59, 999);
      relevantBlocks = blocks.filter((b) => {
        const t = new Date(b.start_at).getTime();
        return t >= start && t <= end;
      });
    } else {
      relevantBlocks = blocks.filter((b) => {
        const bd = new Date(b.start_at);
        return (
          bd.getMonth() === currentDate.getMonth() &&
          bd.getFullYear() === currentDate.getFullYear()
        );
      });
    }

    const hours = relevantBlocks.reduce((acc, b) => {
      return acc + (new Date(b.end_at).getTime() - new Date(b.start_at).getTime()) / 3600000;
    }, 0);
    return Math.round(hours * 10) / 10;
  }, [blocks, viewMode, currentDate, weekDays]);

  const handleOpenAddModal = (slot?: Date) => {
    setSelectedBlock(null);
    setInitialSlot(slot || null);
    setIsModalOpen(true);
  };

  const handleSelectBlock = (block: StudyBlock) => {
    setSelectedBlock(block);
    setInitialSlot(null);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <CalendarHeader
        currentDate={currentDate}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onPrev={handlePrev}
        onNext={handleNext}
        onToday={() => setCurrentDate(new Date())}
        onAddBlock={() => handleOpenAddModal()}
        totalScheduledHours={totalScheduledHours}
      />

      {viewMode === "week" && (
        <WeekView
          weekDays={weekDays}
          blocks={blocks}
          tasks={tasks}
          courses={courses}
          onSelectBlock={handleSelectBlock}
          onSelectSlot={(slot) => handleOpenAddModal(slot)}
        />
      )}

      {viewMode === "day" && (
        <DayView
          currentDate={currentDate}
          blocks={blocks}
          tasks={tasks}
          courses={courses}
          onSelectBlock={handleSelectBlock}
          onSelectSlot={(slot) => handleOpenAddModal(slot)}
        />
      )}

      {viewMode === "month" && (
        <MonthView
          currentDate={currentDate}
          blocks={blocks}
          tasks={tasks}
          courses={courses}
          onSelectBlock={handleSelectBlock}
          onSelectSlot={(slot) => handleOpenAddModal(slot)}
        />
      )}

      <StudyBlockModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedBlock(null);
          setInitialSlot(null);
        }}
        block={selectedBlock}
        initialSlot={initialSlot}
        tasks={tasks}
        courses={courses}
        onCreate={async (data) => {
          await createBlock.mutateAsync(data);
        }}
        onUpdate={async (id, data) => {
          await updateBlock.mutateAsync({ id, data });
        }}
        onDelete={async (id) => {
          await deleteBlock.mutateAsync(id);
        }}
      />
    </div>
  );
};
