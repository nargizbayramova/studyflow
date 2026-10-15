import React, { useState } from "react";
import {
  useStudyBlocks,
  useCreateStudyBlock,
  useUpdateStudyBlock,
  useDeleteStudyBlock,
} from "@/api/studyBlocks";
import { useTasks } from "@/api/tasks";
import { useCourses } from "@/api/courses";
import { StudyBlock } from "@/types";
import { CalendarHeader } from "./components/CalendarHeader";
import { DayColumn } from "./components/DayColumn";
import { StudyBlockModal } from "./components/StudyBlockModal";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export const CalendarPage: React.FC = () => {
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const [selectedBlock, setSelectedBlock] = useState<StudyBlock | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: blocks = [] } = useStudyBlocks();
  const { data: tasks = [] } = useTasks();
  const { data: courses = [] } = useCourses();

  const createBlock = useCreateStudyBlock();
  const updateBlock = useUpdateStudyBlock();
  const deleteBlock = useDeleteStudyBlock();

  const getDayDate = (dayOffset: number) => {
    const d = new Date(currentWeekStart);
    d.setDate(d.getDate() + dayOffset);
    return d;
  };

  const handlePrevWeek = () => {
    const d = new Date(currentWeekStart);
    d.setDate(d.getDate() - 7);
    setCurrentWeekStart(d);
  };

  const handleNextWeek = () => {
    const d = new Date(currentWeekStart);
    d.setDate(d.getDate() + 7);
    setCurrentWeekStart(d);
  };

  const handleToday = () => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    setCurrentWeekStart(d);
  };

  const weekEnd = new Date(currentWeekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  const weekBlocks = blocks.filter((b: StudyBlock) => {
    const blockTime = new Date(b.start_at).getTime();
    return blockTime >= currentWeekStart.getTime() && blockTime <= weekEnd.getTime();
  });

  const totalWeekHours = Number(
    weekBlocks
      .reduce((acc: number, b: StudyBlock) => {
        const dur =
          (new Date(b.end_at).getTime() - new Date(b.start_at).getTime()) / (1000 * 3600);
        return acc + dur;
      }, 0)
      .toFixed(1)
  );

  const isToday = (target: Date) => {
    const now = new Date();
    return (
      target.getDate() === now.getDate() &&
      target.getMonth() === now.getMonth() &&
      target.getFullYear() === now.getFullYear()
    );
  };

  return (
    <div className="space-y-6">
      <CalendarHeader
        weekStart={currentWeekStart}
        onPrevWeek={handlePrevWeek}
        onNextWeek={handleNextWeek}
        onToday={handleToday}
        onOpenSchedule={() => {
          setSelectedBlock(null);
          setIsModalOpen(true);
        }}
        totalWeekHours={totalWeekHours}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3.5">
        {DAYS.map((dayName, index) => {
          const date = getDayDate(index);
          const dayBlocks = weekBlocks.filter((b: StudyBlock) => {
            const blockDate = new Date(b.start_at);
            return (
              blockDate.getDate() === date.getDate() &&
              blockDate.getMonth() === date.getMonth() &&
              blockDate.getFullYear() === date.getFullYear()
            );
          });

          return (
            <DayColumn
              key={dayName}
              dayName={dayName}
              date={date}
              today={isToday(date)}
              blocks={dayBlocks}
              tasks={tasks}
              courses={courses}
              onSelectBlock={(b) => {
                setSelectedBlock(b);
                setIsModalOpen(true);
              }}
            />
          );
        })}
      </div>

      <StudyBlockModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedBlock(null);
        }}
        block={selectedBlock}
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
