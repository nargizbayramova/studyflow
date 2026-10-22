import React, { useState } from "react";
import { Course } from "@/features/courses/types";
import { Button } from "@/shared/ui/Button";
import { useCourseForm } from "../hooks/useCourseForm";
import { CourseFields } from "./CourseFields";

export interface CourseFormProps {
  onClose: () => void;
  onSubmit: (data: {
    code: string;
    title: string;
    instructor: string | null;
    semester: string;
    color: string;
  }) => Promise<void>;
  initialData?: Course | null;
  defaultSemester?: string;
}

export const CourseForm: React.FC<CourseFormProps> = ({ onClose, onSubmit, initialData, defaultSemester }) => {
  const { values, set, toPayload } = useCourseForm(initialData, defaultSemester);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await onSubmit(toPayload());
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save course");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && <div className="p-3 rounded-lg bg-rose-50 text-rose-700 text-xs font-medium">{error}</div>}
      <CourseFields values={values} onChange={set} showPlaceholders />
      <div className="flex items-center justify-end gap-3 pt-3">
        <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" isLoading={loading} className="bg-[#5553B7] hover:bg-[#48469F]">
          {initialData ? "Save changes" : "Add course"}
        </Button>
      </div>
    </form>
  );
};
