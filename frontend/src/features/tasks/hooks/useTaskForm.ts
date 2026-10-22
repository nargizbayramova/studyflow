import React, { useState } from "react";
import { Task, TaskCreatePayload } from "@/features/tasks/types";
import { Course } from "@/features/courses/types";
import { TaskFormValues, getInitialTaskForm } from "../utils/taskForm";

interface Options {
  initialData?: Task | null;
  courses: Course[];
  defaultCourseId?: number;
  onSubmit: (data: TaskCreatePayload) => Promise<void>;
  onDelete?: (id: number) => Promise<void>;
  onClose: () => void;
}

/** Form state, submit and delete for the task modal. Mounted fresh on each open. */
export function useTaskForm({ initialData, courses, defaultCourseId, onSubmit, onDelete, onClose }: Options) {
  const [values, setValues] = useState<TaskFormValues>(() =>
    getInitialTaskForm(initialData, courses, defaultCourseId)
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof TaskFormValues>(key: K, value: TaskFormValues[K]) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!values.courseId) {
      setError("Please select a course");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await onSubmit({
        course_id: values.courseId,
        title: values.title,
        due_date: new Date(values.dueDate).toISOString(),
        estimated_hours: Number(values.estimatedHours),
        weight_percent: Number(values.weightPercent),
        type: values.type,
        status: values.status,
        priority: values.priority,
        description: values.description || null,
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save task");
    } finally {
      setLoading(false);
    }
  };

  const remove = async () => {
    if (!initialData || !onDelete || !window.confirm("Are you sure you want to delete this task?")) return;
    setLoading(true);
    try {
      await onDelete(initialData.id);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return { values, set, loading, error, submit, remove };
}
