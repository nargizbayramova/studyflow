import React, { useState, useEffect } from "react";
import { Check } from "lucide-react";
import { Course } from "@/types";
import { Modal } from "@/components/common/Modal";
import { Input } from "@/components/common/Input";
import { Button } from "@/components/common/Button";

export const FIGMA_COURSE_COLORS = [
  "#6561BD",
  "#428A86",
  "#B87584",
  "#B38A46",
  "#7187B2",
  "#8C9876",
];

interface CourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    code: string;
    title: string;
    instructor: string | null;
    semester: string;
    color: string;
  }) => Promise<void>;
  initialData?: Course | null;
}

export const CourseModal: React.FC<CourseModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}) => {
  const [code, setCode] = useState("");
  const [title, setTitle] = useState("");
  const [instructor, setInstructor] = useState("");
  const [semester, setSemester] = useState("Fall 2026");
  const [color, setColor] = useState(FIGMA_COURSE_COLORS[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setCode(initialData.code);
      setTitle(initialData.title);
      setInstructor(initialData.instructor || "");
      setSemester(initialData.semester);
      setColor(initialData.color);
    } else {
      setCode("");
      setTitle("");
      setInstructor("");
      setSemester("Fall 2026");
      setColor(FIGMA_COURSE_COLORS[0]);
    }
    setError(null);
  }, [initialData, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await onSubmit({
        code,
        title,
        instructor: instructor || null,
        semester,
        color,
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save course");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? "Edit course" : "Add course"}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && (
          <div className="p-3 rounded-lg bg-rose-50 text-rose-700 text-xs font-medium">
            {error}
          </div>
        )}

        <Input
          label="Course code"
          required
          placeholder="CSCI 3509"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />

        <Input
          label="Course title"
          required
          placeholder="Intro to Software Engineering"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <Input
          label="Instructor"
          placeholder="Kamila Ismayilova"
          value={instructor}
          onChange={(e) => setInstructor(e.target.value)}
        />

        <Input
          label="Semester"
          required
          placeholder="Fall 2026"
          value={semester}
          onChange={(e) => setSemester(e.target.value)}
        />

        <div className="flex flex-col gap-2">
          <label className="text-[13px] font-semibold text-[#252735]">Course color</label>
          <div className="flex items-center gap-3">
            {FIGMA_COURSE_COLORS.map((c) => (
              <button
                type="button"
                key={c}
                onClick={() => setColor(c)}
                className="w-[30px] h-[30px] rounded-full flex items-center justify-center transition-transform hover:scale-110 cursor-pointer"
                style={{ backgroundColor: c }}
              >
                {color === c && <Check className="w-4 h-4 text-white" />}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" isLoading={loading} className="bg-[#5553B7] hover:bg-[#48469F]">
            {initialData ? "Save changes" : "Add course"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
