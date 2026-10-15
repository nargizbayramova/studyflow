import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, Archive } from "lucide-react";
import { Course } from "@/types";
import { useUpdateCourse, useDeleteCourse } from "@/api/courses";
import { Input } from "@/components/common/Input";
import { FIGMA_COURSE_COLORS } from "./CourseModal";

interface EditCourseSidebarProps {
  course: Course;
}

export const EditCourseSidebar: React.FC<EditCourseSidebarProps> = ({ course }) => {
  const navigate = useNavigate();
  const updateCourse = useUpdateCourse();
  const deleteCourse = useDeleteCourse();

  const [code, setCode] = useState(course.code);
  const [title, setTitle] = useState(course.title);
  const [instructor, setInstructor] = useState(course.instructor || "");
  const [semester, setSemester] = useState(course.semester);
  const [color, setColor] = useState(course.color);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await updateCourse.mutateAsync({
        id: course.id,
        data: {
          code,
          title,
          instructor: instructor || null,
          semester,
          color,
        },
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update course");
    } finally {
      setLoading(false);
    }
  };

  const handleArchiveToggle = async () => {
    try {
      await updateCourse.mutateAsync({
        id: course.id,
        data: { is_archived: !course.is_archived },
      });
    } catch {
      // handled
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this course? All associated tasks will be removed.")) {
      try {
        await deleteCourse.mutateAsync(course.id);
        navigate("/courses");
      } catch {
        // handled
      }
    }
  };

  return (
    <div className="w-full lg:w-[360px] p-6 bg-white border border-[#E5E6EB] rounded-xl flex flex-col gap-4 shadow-sm flex-shrink-0 self-start">
      <div className="flex flex-col gap-1">
        <h3 className="text-lg font-semibold text-[#252735]">Edit course</h3>
        <p className="text-xs text-[#747683]">Update course details for this semester.</p>
      </div>

      {error && (
        <div className="p-2.5 rounded-lg bg-rose-50 text-rose-700 text-xs font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSave} className="flex flex-col gap-3.5">
        <Input
          label="Course code"
          required
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />

        <Input
          label="Course title"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <Input
          label="Instructor"
          value={instructor}
          onChange={(e) => setInstructor(e.target.value)}
        />

        <Input
          label="Semester"
          required
          value={semester}
          onChange={(e) => setSemester(e.target.value)}
        />

        <div className="flex flex-col gap-1.5 pt-1">
          <label className="text-[13px] font-semibold text-[#252735]">Course color</label>
          <div className="flex items-center gap-2.5">
            {FIGMA_COURSE_COLORS.map((c) => (
              <button
                type="button"
                key={c}
                onClick={() => setColor(c)}
                className="w-[28px] h-[28px] rounded-full flex items-center justify-center transition-transform hover:scale-110 cursor-pointer"
                style={{ backgroundColor: c }}
              >
                {color === c && <Check className="w-3.5 h-3.5 text-white" />}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2.5 pt-3">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-2 rounded-lg bg-[#5553B7] hover:bg-[#48469F] text-white text-xs font-semibold transition-colors disabled:opacity-60 cursor-pointer"
          >
            {loading ? "Saving..." : "Save changes"}
          </button>
          <button
            type="button"
            onClick={() => navigate("/courses")}
            className="px-3.5 py-2 rounded-lg border border-[#E5E6EB] hover:bg-slate-50 text-xs font-medium text-[#252735] transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </form>

      <div className="h-[1px] bg-[#E5E6EB] w-full my-1" />

      {/* Archive course */}
      <div className="flex flex-col gap-1">
        <button
          onClick={handleArchiveToggle}
          className="flex items-center justify-between text-xs text-[#747683] hover:text-[#252735] transition-colors cursor-pointer"
        >
          <span>{course.is_archived ? "Unarchive course" : "Archive course"}</span>
          <Archive className="w-3.5 h-3.5" />
        </button>
        <span className="text-[11px] text-[#747683]">
          Hide from active courses. All tasks stay saved.
        </span>
      </div>

      <button
        onClick={handleDelete}
        className="text-left text-xs text-[#B45353] hover:underline cursor-pointer pt-1"
      >
        Delete course…
      </button>
    </div>
  );
};
