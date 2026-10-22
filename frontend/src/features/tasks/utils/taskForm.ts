import { Task, TaskPriority, TaskStatus, TaskType } from "@/features/tasks/types";
import { Course } from "@/features/courses/types";

export interface TaskFormValues {
  title: string;
  courseId: number;
  dueDate: string;
  estimatedHours: number;
  weightPercent: number;
  type: TaskType;
  status: TaskStatus;
  priority: TaskPriority;
  description: string;
}

export const TASK_TYPE_OPTIONS: { value: TaskType; label: string }[] = [
  { value: "assignment", label: "Assignment" },
  { value: "exam", label: "Exam" },
  { value: "quiz", label: "Quiz" },
  { value: "project_milestone", label: "Project milestone" },
];

export const TASK_PRIORITY_OPTIONS: { value: TaskPriority; label: string }[] = [
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

export const TASK_STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "in_progress", label: "In progress" },
  { value: "completed", label: "Completed" },
];

/** Format a Date for an `<input type="datetime-local">` (local time, no timezone). */
export function toLocalDatetimeString(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function getInitialTaskForm(
  task: Task | null | undefined,
  courses: Course[],
  defaultCourseId?: number
): TaskFormValues {
  if (task) {
    return {
      title: task.title,
      courseId: task.course_id,
      dueDate: toLocalDatetimeString(new Date(task.due_date)),
      estimatedHours: task.estimated_hours || 1,
      weightPercent: task.weight_percent || 0,
      type: task.type,
      status: task.status,
      priority: task.priority,
      description: task.description || "",
    };
  }
  const due = new Date();
  due.setDate(due.getDate() + 2);
  due.setHours(23, 59, 0, 0);
  return {
    title: "",
    courseId: defaultCourseId || courses[0]?.id || 0,
    dueDate: toLocalDatetimeString(due),
    estimatedHours: 2,
    weightPercent: 10,
    type: "assignment",
    status: "pending",
    priority: "medium",
    description: "",
  };
}
