import React, { useState } from "react";
import { Plus, Archive, Trash2, Edit2 } from "lucide-react";
import { useCourses, useCreateCourse, useUpdateCourse, useDeleteCourse } from "@/api/courses";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/common/Card";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { Modal } from "@/components/common/Modal";
import { Spinner } from "@/components/common/Spinner";
import { Course } from "@/types";

const COLOR_PRESETS = [
  "#4F46E5", // Indigo
  "#0EA5E9", // Sky
  "#10B981", // Emerald
  "#F59E0B", // Amber
  "#EF4444", // Rose
  "#8B5CF6", // Purple
  "#EC4899", // Pink
];

export const CoursesPage: React.FC = () => {
  const [includeArchived, setIncludeArchived] = useState(false);
  const { data: courses = [], isLoading } = useCourses({ include_archived: includeArchived });
  const createCourse = useCreateCourse();
  const updateCourse = useUpdateCourse();
  const deleteCourse = useDeleteCourse();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);

  // Form states
  const [code, setCode] = useState("");
  const [title, setTitle] = useState("");
  const [instructor, setInstructor] = useState("");
  const [semester, setSemester] = useState("Fall 2026");
  const [color, setColor] = useState("#4F46E5");

  const resetForm = () => {
    setCode("");
    setTitle("");
    setInstructor("");
    setSemester("Fall 2026");
    setColor("#4F46E5");
    setEditingCourse(null);
    setModalError(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (course: Course) => {
    setEditingCourse(course);
    setCode(course.code);
    setTitle(course.title);
    setInstructor(course.instructor || "");
    setSemester(course.semester);
    setColor(course.color);
    setModalError(null);
    setIsCreateOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    try {
      if (editingCourse) {
        await updateCourse.mutateAsync({
          id: editingCourse.id,
          data: {
            code,
            title,
            instructor: instructor || null,
            semester,
            color,
          },
        });
      } else {
        await createCourse.mutateAsync({
          code,
          title,
          instructor: instructor || null,
          semester,
          color,
        });
      }
      setIsCreateOpen(false);
      resetForm();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setModalError(err.message);
      } else {
        setModalError("Failed to save course");
      }
    }
  };

  const handleToggleArchive = (course: Course) => {
    updateCourse.mutate({
      id: course.id,
      data: { is_archived: !course.is_archived },
    });
  };

  const handleDelete = (id: number) => {
    if (window.confirm("Are you sure you want to delete this course? All associated tasks will be removed.")) {
      deleteCourse.mutate(id);
    }
  };

  return (
    <div className="space-y-8">
      <Header
        title="Courses"
        subtitle="Manage enrolled academic subjects, professors, and syllabus tags."
        actions={
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-xs font-medium text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={includeArchived}
                onChange={(e) => setIncludeArchived(e.target.checked)}
                className="rounded text-primary-600 focus:ring-primary-500"
              />
              Show archived
            </label>
            <Button size="sm" onClick={handleOpenCreate}>
              <Plus className="w-4 h-4" /> Add Course
            </Button>
          </div>
        }
      />

      {isLoading ? (
        <Spinner className="py-16" />
      ) : courses.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-200">
          <p className="text-base font-semibold text-slate-800">No courses cataloged yet</p>
          <p className="text-xs text-slate-500 mt-1">Start by adding your enrolled subjects for this semester.</p>
          <Button size="sm" className="mt-4" onClick={handleOpenCreate}>
            <Plus className="w-4 h-4" /> Add Course
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <Card key={course.id} className="relative group overflow-hidden">
              <div
                className="absolute top-0 left-0 right-0 h-1.5"
                style={{ backgroundColor: course.color }}
              />
              <div className="flex items-start justify-between">
                <div>
                  <span
                    className="inline-block text-xs font-bold px-2 py-0.5 rounded text-white mb-2"
                    style={{ backgroundColor: course.color }}
                  >
                    {course.code}
                  </span>
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-primary-600 transition-colors">
                    {course.title}
                  </h3>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(course)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
                    title="Edit Course"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleToggleArchive(course)}
                    className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                    title={course.is_archived ? "Unarchive" : "Archive"}
                  >
                    <Archive className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(course.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Delete Course"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>{course.instructor || "Instructor: TBD"}</span>
                <span className="font-medium bg-slate-100 px-2 py-0.5 rounded-md">
                  {course.semester}
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create / Edit Course Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => {
          setIsCreateOpen(false);
          resetForm();
        }}
        title={editingCourse ? "Edit Course" : "Add Enrolled Course"}
        description="Enter course code, syllabus name, and tag color."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {modalError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200/70 text-rose-700 text-xs font-medium">
              {modalError}
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Course Code"
              required
              placeholder="CSCI 3509"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
            <Input
              label="Semester"
              required
              placeholder="Fall 2026"
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
            />
          </div>

          <Input
            label="Course Title"
            required
            placeholder="Introduction to Software Engineering"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <Input
            label="Instructor (Optional)"
            placeholder="Dr. Kamila Ismayilova"
            value={instructor}
            onChange={(e) => setInstructor(e.target.value)}
          />

          {/* Color Presets */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Tag Accent Color
            </label>
            <div className="flex items-center gap-2">
              {COLOR_PRESETS.map((hex) => (
                <button
                  type="button"
                  key={hex}
                  onClick={() => setColor(hex)}
                  className={`w-7 h-7 rounded-full transition-transform ${
                    color === hex ? "scale-110 ring-2 ring-offset-2 ring-primary-500" : ""
                  }`}
                  style={{ backgroundColor: hex }}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsCreateOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={createCourse.isPending || updateCourse.isPending}>
              {editingCourse ? "Save Changes" : "Create Course"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
