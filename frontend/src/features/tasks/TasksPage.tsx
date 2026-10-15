import React, { useState } from "react";
import {
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Sparkles,
  Edit2,
  Trash2,
} from "lucide-react";
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask } from "@/api/tasks";
import { useCourses } from "@/api/courses";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/common/Card";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { Modal } from "@/components/common/Modal";
import { Badge } from "@/components/common/Badge";
import { Spinner } from "@/components/common/Spinner";
import { Task, TaskPriority, TaskStatus, TaskType } from "@/types";

export const TasksPage: React.FC = () => {
  const [courseId, setCourseId] = useState<number | undefined>(undefined);
  const [status, setStatus] = useState<TaskStatus | undefined>(undefined);
  const [type, setType] = useState<TaskType | undefined>(undefined);
  const [search, setSearch] = useState("");

  const { data: courses = [] } = useCourses();
  const { data: tasks = [], isLoading } = useTasks({
    course_id: courseId,
    status,
    type,
    q: search || undefined,
  });

  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Form inputs
  const [title, setTitle] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState<number>(0);
  const [dueDate, setDueDate] = useState("");
  const [estimatedHours, setEstimatedHours] = useState(1.0);
  const [weightPercent, setWeightPercent] = useState(0);
  const [taskType, setTaskType] = useState<TaskType>("assignment");
  const [taskStatus, setTaskStatus] = useState<TaskStatus>("pending");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [description, setDescription] = useState("");

  const resetForm = () => {
    setTitle("");
    setSelectedCourseId(courses[0]?.id || 0);
    setDueDate("");
    setEstimatedHours(1.0);
    setWeightPercent(0);
    setTaskType("assignment");
    setTaskStatus("pending");
    setPriority("medium");
    setDescription("");
    setEditingTask(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    if (courses.length > 0) {
      setSelectedCourseId(courses[0].id);
    }
    // Default due date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(23, 59, 0, 0);
    setDueDate(tomorrow.toISOString().slice(0, 16));
    setIsModalOpen(true);
  };

  const handleOpenEdit = (task: Task) => {
    setEditingTask(task);
    setTitle(task.title);
    setSelectedCourseId(task.course_id);
    setDueDate(new Date(task.due_date).toISOString().slice(0, 16));
    setEstimatedHours(task.estimated_hours);
    setWeightPercent(task.weight_percent);
    setTaskType(task.type);
    setTaskStatus(task.status);
    setPriority(task.priority);
    setDescription(task.description || "");
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      course_id: Number(selectedCourseId),
      title,
      description: description || null,
      due_date: new Date(dueDate).toISOString(),
      estimated_hours: Number(estimatedHours),
      weight_percent: Number(weightPercent),
      type: taskType,
      status: taskStatus,
      priority,
    };

    if (editingTask) {
      await updateTask.mutateAsync({ id: editingTask.id, data: payload });
    } else {
      await createTask.mutateAsync(payload);
    }
    setIsModalOpen(false);
    resetForm();
  };

  const handleToggleStatus = (task: Task) => {
    updateTask.mutate({
      id: task.id,
      data: {
        status: task.status === "completed" ? "pending" : "completed",
      },
    });
  };

  const handleDelete = (id: number) => {
    if (window.confirm("Are you sure you want to delete this task?")) {
      deleteTask.mutate(id);
    }
  };

  const getCourse = (cId: number) => courses.find((c) => c.id === cId);

  return (
    <div className="space-y-8">
      <Header
        title="Assignments & Deliverables"
        subtitle="Track deadlines, grade weights, and syllabus milestones."
        actions={
          <Button size="sm" onClick={handleOpenCreate} disabled={courses.length === 0}>
            <Plus className="w-4 h-4" /> Add Task
          </Button>
        }
      />

      {/* Filter and Search Bar */}
      <Card className="p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search deliverables..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
            />
          </div>

          <select
            value={courseId || ""}
            onChange={(e) => setCourseId(e.target.value ? Number(e.target.value) : undefined)}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-white"
          >
            <option value="">All Courses</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code} - {c.title}
              </option>
            ))}
          </select>

          <select
            value={status || ""}
            onChange={(e) => setStatus(e.target.value ? (e.target.value as TaskStatus) : undefined)}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-white"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>

          <select
            value={type || ""}
            onChange={(e) => setType(e.target.value ? (e.target.value as TaskType) : undefined)}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-white"
          >
            <option value="">All Types</option>
            <option value="assignment">Assignment</option>
            <option value="exam">Exam</option>
            <option value="quiz">Quiz</option>
            <option value="project_milestone">Project Milestone</option>
          </select>
        </div>
      </Card>

      {/* Tasks Table / List */}
      {isLoading ? (
        <Spinner className="py-16" />
      ) : tasks.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-200">
          <p className="text-base font-semibold text-slate-800">No tasks found</p>
          <p className="text-xs text-slate-500 mt-1">Try adjusting your filters or add a new deliverable.</p>
          <Button size="sm" className="mt-4" onClick={handleOpenCreate} disabled={courses.length === 0}>
            <Plus className="w-4 h-4" /> Add Task
          </Button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="divide-y divide-slate-100">
            {tasks.map((task) => {
              const course = getCourse(task.course_id);
              const dueDate = new Date(task.due_date);
              const isPast = dueDate.getTime() < Date.now() && task.status !== "completed";

              return (
                <div
                  key={task.id}
                  className="p-4 sm:px-6 flex items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <button
                      onClick={() => handleToggleStatus(task)}
                      className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                        task.status === "completed"
                          ? "bg-emerald-600 border-emerald-600 text-white"
                          : "border-slate-300 hover:border-primary-500"
                      }`}
                    >
                      {task.status === "completed" && <CheckCircle2 className="w-4 h-4" />}
                    </button>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-sm font-semibold truncate ${
                            task.status === "completed"
                              ? "line-through text-slate-400"
                              : "text-slate-900"
                          }`}
                        >
                          {task.title}
                        </span>
                        {task.ai_priority_score && (
                          <span
                            className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200/60"
                            title="AI Priority Score"
                          >
                            <Sparkles className="w-2.5 h-2.5" /> {task.ai_priority_score.toFixed(1)}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-500">
                        {course && (
                          <span
                            className="text-[11px] font-semibold px-2 py-0.5 rounded text-white"
                            style={{ backgroundColor: course.color }}
                          >
                            {course.code}
                          </span>
                        )}
                        <span className={isPast ? "text-rose-600 font-semibold" : ""}>
                          Due {dueDate.toLocaleDateString()} at{" "}
                          {dueDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {task.estimated_hours}h effort
                        </span>
                        <span>•</span>
                        <span>{task.weight_percent}% grade weight</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 flex-shrink-0">
                    <Badge
                      variant={
                        task.priority === "high"
                          ? "danger"
                          : task.priority === "medium"
                          ? "warning"
                          : "neutral"
                      }
                      size="sm"
                    >
                      {task.priority}
                    </Badge>

                    <button
                      onClick={() => handleOpenEdit(task)}
                      className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                      title="Edit Task"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(task.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Delete Task"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Task Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          resetForm();
        }}
        title={editingTask ? "Edit Task" : "Add Deliverable"}
        description="Fill in due date, weight percentage, and task details."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Deliverable Title"
            required
            placeholder="Homework 1: Architecture Plan"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Course</label>
              <select
                required
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-white"
              >
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} - {c.title}
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Due Date & Time"
              type="datetime-local"
              required
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Estimated Hours"
              type="number"
              step="0.5"
              min="0.5"
              max="100"
              required
              value={estimatedHours}
              onChange={(e) => setEstimatedHours(Number(e.target.value))}
            />
            <Input
              label="Grade Weight (%)"
              type="number"
              step="1"
              min="0"
              max="100"
              required
              value={weightPercent}
              onChange={(e) => setWeightPercent(Number(e.target.value))}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Type</label>
              <select
                value={taskType}
                onChange={(e) => setTaskType(e.target.value as TaskType)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-white"
              >
                <option value="assignment">Assignment</option>
                <option value="exam">Exam</option>
                <option value="quiz">Quiz</option>
                <option value="project_milestone">Milestone</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-white"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Status</label>
              <select
                value={taskStatus}
                onChange={(e) => setTaskStatus(e.target.value as TaskStatus)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-white"
              >
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Description (Optional)
            </label>
            <textarea
              rows={3}
              placeholder="Notes, submission links, instructions..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsModalOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={createTask.isPending || updateTask.isPending}>
              {editingTask ? "Save Changes" : "Create Task"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
