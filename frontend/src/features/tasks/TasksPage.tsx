import React, { useState } from "react";
import { Plus } from "lucide-react";
import {
  useTasks,
  useCreateTask,
  useUpdateTask,
  useDeleteTask,
  usePrioritizeTasks,
} from "@/features/tasks/api/tasks";
import { useCourses } from "@/features/courses/api/courses";
import { useWorkspace } from "@/features/workspace/context/WorkspaceContext";
import { Task, TaskStatus } from "@/features/tasks/types";
import { Header } from "@/app/layout/Header";
import { Button } from "@/shared/ui/Button";
import { useTaskFilters } from "./hooks/useTaskFilters";
import { TaskSummaryBadges } from "./components/TaskSummaryBadges";
import { TaskFiltersBar } from "./components/TaskFiltersBar";
import { TaskTable } from "./components/TaskTable";
import { TaskModal } from "./components/TaskModal";

export const TasksPage: React.FC = () => {
  const { workspace } = useWorkspace();
  const { data: tasks = [] } = useTasks({ semester: workspace });
  const { data: courses = [] } = useCourses({ semester: workspace });
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const { prioritizeTasks, isPrioritizing } = usePrioritizeTasks();
  const { filteredTasks, openCount, completedCount, tab, setTab, barProps } = useTaskFilters(tasks);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const openModal = (task: Task | null) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

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
          <div className="flex items-center gap-2.5">
            <Button
              size="sm"
              variant="secondary"
              disabled={isPrioritizing || openCount === 0}
              onClick={() => void prioritizeTasks(workspace)}
            >
              {isPrioritizing ? "Prioritizing..." : "⚡ Prioritize with AI"}
            </Button>
            <Button size="sm" onClick={() => openModal(null)} className="bg-[#5553B7] hover:bg-[#48469F] text-white">
              <Plus className="w-4 h-4" /> Add task
            </Button>
          </div>
        }
      />

      <TaskSummaryBadges tasks={tasks} />
      <TaskFiltersBar courses={courses} {...barProps} />

      <TaskTable
        tasks={filteredTasks}
        courses={courses}
        tab={tab}
        setTab={setTab}
        totalCount={tasks.length}
        openCount={openCount}
        completedCount={completedCount}
        onToggle={handleToggle}
        onEdit={openModal}
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
          if (editingTask) await updateTask.mutateAsync({ id: editingTask.id, data });
          else await createTask.mutateAsync(data);
        }}
        onDelete={async (id) => {
          await deleteTask.mutateAsync(id);
        }}
      />
    </div>
  );
};
