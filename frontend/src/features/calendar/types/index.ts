export interface StudyBlockFilters {
  task_id?: number;
  semester?: string;
  status?: BlockStatus;
  start_from?: string;
  start_to?: string;
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
