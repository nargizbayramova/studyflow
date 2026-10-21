export interface User {
  id: number;
  email: string;
  full_name: string;
  created_at: string;
}

export interface AuthToken {
  access_token: string;
  token_type: string;
}

export interface Course {
  id: number;
  code: string;
  title: string;
  instructor: string | null;
  semester: string;
  color: string;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface CourseCreatePayload {
  code: string;
  title: string;
  instructor?: string | null;
  semester: string;
  color?: string;
}

export interface CourseUpdatePayload {
  code?: string;
  title?: string;
  instructor?: string | null;
  semester?: string;
  color?: string;
  is_archived?: boolean;
}

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

export interface StudyBlockFilters {
  task_id?: number;
  semester?: string;
  status?: BlockStatus;
  start_from?: string;
  start_to?: string;
}

export type SlotKind = "available" | "blocked";

export interface AvailabilitySlot {
  id: number;
  day_of_week: number; // 0 = Monday ... 6 = Sunday
  specific_date?: string | null; // "YYYY-MM-DD" when week-specific, null when recurring
  start_time: string; // "HH:MM" or "HH:MM:SS"
  end_time: string;
  kind: SlotKind;
}

export interface SlotCreatePayload {
  day_of_week: number;
  specific_date?: string | null;
  start_time: string;
  end_time: string;
  kind?: SlotKind;
}

export interface SlotUpdatePayload {
  day_of_week?: number;
  specific_date?: string | null;
  start_time?: string;
  end_time?: string;
  kind?: SlotKind;
}

export type BlockStatus = "planned" | "completed" | "missed";

export interface StudyBlock {
  id: number;
  task_id: number;
  start_at: string;
  end_at: string;
  date?: string;
  start_time?: string;
  end_time?: string;
  focus_goal?: string;
  status: BlockStatus;
  task_title?: string | null;
  course_name?: string | null;
  course_code?: string | null;
  course_color?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ScheduleResponse {
  study_blocks: StudyBlock[];
  overload_warning: boolean;
}

export interface StudyBlockCreatePayload {
  task_id: number;
  start_at: string;
  end_at: string;
  status?: BlockStatus;
}

export interface StudyBlockUpdatePayload {
  task_id?: number;
  start_at?: string;
  end_at?: string;
  status?: BlockStatus;
}

export interface StudyBlockFilters {
  task_id?: number;
  semester?: string;
  status?: BlockStatus;
  start_from?: string;
  start_to?: string;
}

