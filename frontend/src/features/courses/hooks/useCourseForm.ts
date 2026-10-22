import { useState } from "react";
import { Course } from "@/features/courses/types";
import { COURSE_COLORS } from "../constants";

export interface CourseFormValues {
  code: string;
  title: string;
  instructor: string;
  semester: string;
  color: string;
}

/** Controlled values for the course form, seeded from an existing course or defaults. */
export function useCourseForm(course?: Course | null, defaultSemester = "Fall 2026") {
  const [values, setValues] = useState<CourseFormValues>({
    code: course?.code ?? "",
    title: course?.title ?? "",
    instructor: course?.instructor ?? "",
    semester: course?.semester ?? defaultSemester,
    color: course?.color ?? COURSE_COLORS[0],
  });

  const set = <K extends keyof CourseFormValues>(key: K, value: CourseFormValues[K]) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  const toPayload = () => ({ ...values, instructor: values.instructor || null });

  return { values, set, toPayload };
}
