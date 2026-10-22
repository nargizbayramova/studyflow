export type TaskType = "assignment" | "exam" | "quiz" | "project_milestone";

export type TaskStatus = "pending" | "in_progress" | "completed";

export type TaskPriority = "low" | "medium" | "high";

export type UrgencyLevel = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

export interface Task {
  id: number;
  course_id: number;
  title: string;
  description: string | null;
  type: TaskType;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string;
  estimated_hours: number;
  weight_percent: number;
  ai_priority_score: number | null;
  priority_rank?: number | null;
  urgency_level?: UrgencyLevel | null;
  ai_recommendation?: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TaskCreatePayload {
  course_id: number;
  title: string;
  description?: string | null;
  type?: TaskType;
  status?: TaskStatus;
  priority?: TaskPriority;
  due_date: string;
  estimated_hours?: number;
  weight_percent?: number;
}

export interface TaskUpdatePayload {
  course_id?: number;
  title?: string;
  description?: string | null;
  type?: TaskType;
  status?: TaskStatus;
  priority?: TaskPriority;
  due_date?: string;
  estimated_hours?: number;
  weight_percent?: number;
}

export interface TaskFilters {
  course_id?: number;
  semester?: string;
  type?: TaskType;
  status?: TaskStatus;
  priority?: TaskPriority;
  due_from?: string;
  due_to?: string;
  q?: string;
}
