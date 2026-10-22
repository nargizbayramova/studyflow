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
