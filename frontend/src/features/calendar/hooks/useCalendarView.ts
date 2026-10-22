import { useMemo, useState } from "react";
import { Course } from "@/features/courses/types";
import { Task } from "@/features/tasks/types";
import { AvailabilitySlot } from "@/features/availability/types";
import { StudyBlock } from "@/features/calendar/types";
import {
  CalendarViewMode,
  computeWeeklyAvailabilitySummary,
  getViewBlocks,
  getWeekDays,
  groupBlocksByDate,
  groupTasksByDueDate,
  shiftCalendarDate,
  sumBlocksHours,
} from "../calendarUtils";

/** Calendar navigation + filters, and every value derived from them (grouping, hour totals). */
export function useCalendarView(
  blocks: StudyBlock[],
  tasks: Task[],
  courses: Course[],
  availabilitySlots: AvailabilitySlot[]
) {
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());
  const [viewMode, setViewMode] = useState<CalendarViewMode>("week");
  const [selectedTaskFilter, setSelectedTaskFilter] = useState("all");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("all");

  const coursesById = useMemo(() => new Map<number, Course>(courses.map((c) => [c.id, c])), [courses]);
  const weekDays = useMemo(() => getWeekDays(currentDate), [currentDate]);

  const filteredBlocks = useMemo(
    () =>
      blocks.filter(
        (b) =>
          (selectedTaskFilter === "all" || String(b.task_id) === selectedTaskFilter) &&
          (selectedStatusFilter === "all" || b.status === selectedStatusFilter)
      ),
    [blocks, selectedTaskFilter, selectedStatusFilter]
  );
  const filteredTasks = useMemo(
    () => (selectedTaskFilter === "all" ? tasks : tasks.filter((t) => String(t.id) === selectedTaskFilter)),
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

  return {
    currentDate,
    viewMode,
    weekDays,
    coursesById,
    blocksByDate,
    tasksByDueDate,
    plannedHours,
    completedHours,
    availableHours,
    blockedHours,
    selectedTaskFilter,
    selectedStatusFilter,
    setViewMode,
    setSelectedTaskFilter,
    setSelectedStatusFilter,
    goPrev: () => setCurrentDate((d) => shiftCalendarDate(d, viewMode, -1)),
    goNext: () => setCurrentDate((d) => shiftCalendarDate(d, viewMode, 1)),
    goToday: () => setCurrentDate(new Date()),
  };
}
