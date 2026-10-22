import { useMemo, useState } from "react";
import { Task, TaskPriority, TaskStatus, TaskType } from "@/features/tasks/types";

export type TaskTab = "all" | "open" | "completed";

/** Filter/sort state for the tasks list plus the derived, filtered rows and counts. */
export function useTaskFilters(tasks: Task[]) {
  const [search, setSearch] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState<number | undefined>();
  const [selectedType, setSelectedType] = useState<TaskType | undefined>();
  const [selectedStatus, setSelectedStatus] = useState<TaskStatus | undefined>();
  const [selectedPriority, setSelectedPriority] = useState<TaskPriority | undefined>();
  const [sortByEarliest, setSortByEarliest] = useState(true);
  const [tab, setTab] = useState<TaskTab>("all");

  const completedCount = useMemo(() => tasks.filter((t) => t.status === "completed").length, [tasks]);
  const openCount = tasks.length - completedCount;

  const filteredTasks = useMemo(() => {
    const q = search.toLowerCase();
    return tasks
      .filter((task) => {
        if (q && !task.title.toLowerCase().includes(q)) return false;
        if (selectedCourseId !== undefined && task.course_id !== selectedCourseId) return false;
        if (selectedType && task.type !== selectedType) return false;
        if (selectedStatus && task.status !== selectedStatus) return false;
        if (selectedPriority && task.priority !== selectedPriority) return false;
        if (tab === "open" && task.status === "completed") return false;
        if (tab === "completed" && task.status !== "completed") return false;
        return true;
      })
      .sort((a, b) => {
        if (a.status === "completed" && b.status !== "completed") return 1;
        if (a.status !== "completed" && b.status === "completed") return -1;
        if (a.status !== "completed" && b.status !== "completed") {
          if (a.priority_rank != null && b.priority_rank != null) return a.priority_rank - b.priority_rank;
          if (a.priority_rank != null) return -1;
          if (b.priority_rank != null) return 1;
        }
        const diff = new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
        return sortByEarliest ? diff : -diff;
      });
  }, [tasks, search, selectedCourseId, selectedType, selectedStatus, selectedPriority, sortByEarliest, tab]);

  return {
    filteredTasks,
    openCount,
    completedCount,
    tab,
    setTab,
    barProps: {
      search,
      onSearchChange: setSearch,
      selectedCourseId,
      onCourseChange: setSelectedCourseId,
      selectedType,
      onTypeChange: setSelectedType,
      selectedStatus,
      onStatusChange: setSelectedStatus,
      selectedPriority,
      onPriorityChange: setSelectedPriority,
      sortByEarliest,
      onToggleSort: () => setSortByEarliest((prev) => !prev),
    },
  };
}
