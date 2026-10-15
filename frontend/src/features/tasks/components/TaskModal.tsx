import React, { useState, useEffect } from "react";
import { Task, Course, TaskType, TaskStatus, TaskPriority } from "@/types";
import { Modal } from "@/components/common/Modal";
import { Input } from "@/components/common/Input";
import { Button } from "@/components/common/Button";

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    course_id: number;
    title: string;
    due_date: string;
    estimated_hours: number;
    weight_percent: number;
    type: TaskType;
    status: TaskStatus;
    priority: TaskPriority;
    description: string | null;
  }) => Promise<void>;
  onDelete?: (id: number) => Promise<void>;
  initialData?: Task | null;
  courses: Course[];
  defaultCourseId?: number;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  onDelete,
  initialData,
  courses,
  defaultCourseId,
}) => {
  const [title, setTitle] = useState("");
  const [courseId, setCourseId] = useState<number>(0);
  const [dueDate, setDueDate] = useState("");
  const [estimatedHours, setEstimatedHours] = useState(2);
  const [weightPercent, setWeightPercent] = useState(10);
  const [type, setType] = useState<TaskType>("assignment");
  const [status, setStatus] = useState<TaskStatus>("pending");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setCourseId(initialData.course_id);
      setDueDate(new Date(initialData.due_date).toISOString().slice(0, 16));
      setEstimatedHours(initialData.estimated_hours || 1);
      setWeightPercent(initialData.weight_percent || 0);
      setType(initialData.type);
      setStatus(initialData.status);
      setPriority(initialData.priority);
      setDescription(initialData.description || "");
    } else {
      setTitle("");
      setCourseId(defaultCourseId || courses[0]?.id || 0);
      const d = new Date();
      d.setDate(d.getDate() + 2);
      d.setHours(23, 59, 0, 0);
      setDueDate(d.toISOString().slice(0, 16));
      setEstimatedHours(2);
      setWeightPercent(10);
      setType("assignment");
      setStatus("pending");
      setPriority("medium");
      setDescription("");
    }
    setError(null);
  }, [initialData, isOpen, courses, defaultCourseId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseId) {
      setError("Please select a course");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await onSubmit({
        course_id: courseId,
        title,
        due_date: new Date(dueDate).toISOString(),
        estimated_hours: Number(estimatedHours),
        weight_percent: Number(weightPercent),
        type,
        status,
        priority,
        description: description || null,
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save task");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (initialData && onDelete && window.confirm("Are you sure you want to delete this task?")) {
      setLoading(true);
      try {
        await onDelete(initialData.id);
        onClose();
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initialData ? "Edit task" : "Add task"}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
        {error && (
          <div className="p-2.5 rounded-lg bg-rose-50 text-rose-700 text-xs font-medium">
            {error}
          </div>
        )}

        <Input
          label="Task title"
          required
          placeholder="Problem set 4"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-[#252735]">Course</label>
            <select
              value={courseId}
              onChange={(e) => setCourseId(Number(e.target.value))}
              required
              className="h-[46px] px-3 rounded-lg border border-[#E5E6EB] text-sm text-[#252735] bg-white focus:outline-none focus:border-[#5553B7]"
            >
              <option value="">Select course</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} - {c.title}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-[#252735]">Task type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as TaskType)}
              className="h-[46px] px-3 rounded-lg border border-[#E5E6EB] text-sm text-[#252735] bg-white focus:outline-none focus:border-[#5553B7]"
            >
              <option value="assignment">Assignment</option>
              <option value="exam">Exam</option>
              <option value="quiz">Quiz</option>
              <option value="project_milestone">Project milestone</option>
            </select>
          </div>
        </div>

        <Input
          label="Due date & time"
          type="datetime-local"
          required
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Estimated effort (hours)"
            type="number"
            step="0.5"
            min="0.5"
            required
            value={estimatedHours}
            onChange={(e) => setEstimatedHours(Number(e.target.value))}
          />
          <Input
            label="Weight (% of final grade)"
            type="number"
            min="0"
            max="100"
            value={weightPercent}
            onChange={(e) => setWeightPercent(Number(e.target.value))}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-[#252735]">Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority)}
              className="h-10 px-3 rounded-lg border border-[#E5E6EB] text-xs font-medium text-[#252735] bg-white focus:outline-none focus:border-[#5553B7]"
            >
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-[#252735]">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as TaskStatus)}
              className="h-10 px-3 rounded-lg border border-[#E5E6EB] text-xs font-medium text-[#252735] bg-white focus:outline-none focus:border-[#5553B7]"
            >
              <option value="pending">Pending</option>
              <option value="in_progress">In progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-[#E5E6EB]">
          {initialData && onDelete ? (
            <button
              type="button"
              onClick={handleDelete}
              className="text-xs text-rose-600 hover:underline cursor-pointer"
            >
              Delete task
            </button>
          ) : (
            <div />
          )}
          <div className="flex items-center gap-2.5">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" isLoading={loading} className="bg-[#5553B7] hover:bg-[#48469F]">
              {initialData ? "Save changes" : "Create task"}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
