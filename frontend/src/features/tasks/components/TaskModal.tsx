import React, { useState, useEffect } from "react";
import { Task, Course, TaskType, TaskStatus, TaskPriority } from "@/types";
import { Modal } from "@/components/common/Modal";
import { Input } from "@/components/common/Input";
import { Button } from "@/components/common/Button";
import { Select } from "@/components/common/Select";

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

function toLocalDatetimeString(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
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
      setDueDate(toLocalDatetimeString(new Date(initialData.due_date)));
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
      setDueDate(toLocalDatetimeString(d));
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
            <Select
              value={courseId ? String(courseId) : ""}
              onChange={(val) => setCourseId(val ? Number(val) : 0)}
              options={[
                { value: "", label: "Select course" },
                ...courses.map((c) => ({ value: String(c.id), label: `${c.code} - ${c.title}` })),
              ]}
              className="w-full"
              buttonClassName="h-[46px] text-sm font-normal"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-[#252735]">Task type</label>
            <Select
              value={type}
              onChange={(val) => setType(val as TaskType)}
              options={[
                { value: "assignment", label: "Assignment" },
                { value: "exam", label: "Exam" },
                { value: "quiz", label: "Quiz" },
                { value: "project_milestone", label: "Project milestone" },
              ]}
              className="w-full"
              buttonClassName="h-[46px] text-sm font-normal"
            />
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
            <Select
              value={priority}
              onChange={(val) => setPriority(val as TaskPriority)}
              options={[
                { value: "high", label: "High" },
                { value: "medium", label: "Medium" },
                { value: "low", label: "Low" },
              ]}
              className="w-full"
              buttonClassName="h-10 text-xs font-medium"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-[#252735]">Status</label>
            <Select
              value={status}
              onChange={(val) => setStatus(val as TaskStatus)}
              options={[
                { value: "pending", label: "Pending" },
                { value: "in_progress", label: "In progress" },
                { value: "completed", label: "Completed" },
              ]}
              className="w-full"
              buttonClassName="h-10 text-xs font-medium"
            />
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
