import React, { useState, useMemo } from "react";
import { Plus } from "lucide-react";
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask } from "@/api/tasks";
import { useCourses } from "@/api/courses";
import { Task, TaskPriority, TaskStatus, TaskType } from "@/types";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/common/Button";
import { TaskSummaryBadges } from "./components/TaskSummaryBadges";
import { TaskFiltersBar } from "./components/TaskFiltersBar";
import { TaskTable } from "./components/TaskTable";
import { TaskModal } from "./components/TaskModal";

export const TasksPage: React.FC = () => {
  const { data: tasks = [] } = useTasks();
  const { data: courses = [] } = useCourses();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  const [search, setSearch] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState<number | undefined>();
  const [selectedType, setSelectedType] = useState<TaskType | undefined>();
  const [selectedStatus, setSelectedStatus] = useState<TaskStatus | undefined>();
  const [selectedPriority, setSelectedPriority] = useState<TaskPriority | undefined>();
  const [sortByEarliest, setSortByEarliest] = useState(true);
  const [tab, setTab] = useState<"all" | "open" | "completed">("all");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const openCount = useMemo(() => tasks.filter((t) => t.status !== "completed").length, [tasks]);
  const completedCount = useMemo(
    () => tasks.filter((t) => t.status === "completed").length,
    [tasks]
  );

  const filteredTasks = useMemo(() => {
    return tasks
      .filter((task) => {
        if (search && !task.title.toLowerCase().includes(search.toLowerCase())) return false;
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
        const diff = new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
        return sortByEarliest ? diff : -diff;
      });
  }, [tasks, search, selectedCourseId, selectedType, selectedStatus, selectedPriority, sortByEarliest, tab]);

  const handleToggle = (task: Task) => {
    const nextStatus: TaskStatus = task.status === "completed" ? "pending" : "completed";
    updateTask.mutate({ id: task.id, data: { status: nextStatus } });
  };

  return (
    <div className="space-y-6">
      <Header
        title="All tasks & assignments"
        subtitle="Manage upcoming deadlines, readings, and assignment milestones"
        actions={
          <Button
            size="sm"
            onClick={() => {
              setEditingTask(null);
              setIsModalOpen(true);
            }}
            className="bg-[#5553B7] hover:bg-[#48469F] text-white"
          >
            <Plus className="w-4 h-4" /> Add task
          </Button>
        }
      />

      <TaskSummaryBadges tasks={tasks} />

      <TaskFiltersBar
        search={search}
        onSearchChange={setSearch}
        courses={courses}
        selectedCourseId={selectedCourseId}
        onCourseChange={setSelectedCourseId}
        selectedType={selectedType}
        onTypeChange={setSelectedType}
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
        selectedPriority={selectedPriority}
        onPriorityChange={setSelectedPriority}
        sortByEarliest={sortByEarliest}
        onToggleSort={() => setSortByEarliest((prev) => !prev)}
      />

      <TaskTable
        tasks={filteredTasks}
        courses={courses}
        tab={tab}
        setTab={setTab}
        totalCount={tasks.length}
        openCount={openCount}
        completedCount={completedCount}
        onToggle={handleToggle}
        onEdit={(task) => {
          setEditingTask(task);
          setIsModalOpen(true);
        }}
      />

      <TaskModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTask(null);
        }}
        initialData={editingTask}
        courses={courses}
        onSubmit={async (data) => {
          if (editingTask) {
            await updateTask.mutateAsync({ id: editingTask.id, data });
          } else {
            await createTask.mutateAsync(data);
          }
        }}
        onDelete={async (id) => {
          await deleteTask.mutateAsync(id);
        }}
      />
    </div>
  );
};
