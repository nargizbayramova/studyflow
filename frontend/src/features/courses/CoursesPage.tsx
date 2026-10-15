import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, ChevronDown, Archive, CheckSquare, Square } from "lucide-react";
import { useCourses, useCreateCourse } from "@/api/courses";
import { useTasks } from "@/api/tasks";
import { Spinner } from "@/components/common/Spinner";
import { CourseCard } from "./components/CourseCard";
import { CourseModal } from "./components/CourseModal";

export const CoursesPage: React.FC = () => {
  const navigate = useNavigate();
  const [includeArchived, setIncludeArchived] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: courses = [], isLoading: loadingCourses } = useCourses({
    include_archived: includeArchived,
  });
  const { data: tasks = [], isLoading: loadingTasks } = useTasks();
  const createCourse = useCreateCourse();

  if (loadingCourses || loadingTasks) {
    return (
      <div className="h-64 flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  const activeCourses = courses.filter((c) => !c.is_archived);

  return (
    <div className="flex flex-col gap-7 max-w-7xl mx-auto font-sans">
      {/* Top title and add button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-[30px] font-normal text-[#252735] tracking-tight">Your courses</h1>
          <p className="text-sm text-[#747683]">
            One home for each subject. Keep coursework connected and easy to find.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#5553B7] hover:bg-[#48469F] text-white text-sm font-semibold transition-colors shadow-sm self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add course</span>
        </button>
      </div>

      {/* Filters row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <button className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white border border-[#E5E6EB] text-sm font-semibold text-[#252735] shadow-sm cursor-pointer">
            <span>Fall 2026</span>
            <ChevronDown className="w-4 h-4 text-[#747683]" />
          </button>
          <span className="px-2.5 py-1 rounded-md bg-[#F7F7F4] text-xs font-medium text-[#747683]">
            {activeCourses.length} active {activeCourses.length === 1 ? "course" : "courses"}
          </span>
        </div>

        <button
          onClick={() => setIncludeArchived(!includeArchived)}
          className="inline-flex items-center gap-2 text-[13px] text-[#747683] hover:text-[#252735] transition-colors cursor-pointer"
        >
          {includeArchived ? (
            <CheckSquare className="w-4 h-4 text-[#5553B7]" />
          ) : (
            <Square className="w-4 h-4 text-[#747683]" />
          )}
          <span>Include archived courses</span>
        </button>
      </div>

      {/* Course cards grid */}
      {courses.length === 0 ? (
        <div className="p-12 text-center bg-white border border-[#E5E6EB] rounded-xl flex flex-col items-center gap-3">
          <p className="text-base font-semibold text-[#252735]">No courses found</p>
          <p className="text-xs text-[#747683]">Get started by adding your first course for this semester.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {courses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              tasks={tasks}
              onEdit={() => navigate(`/courses/${course.id}`)}
            />
          ))}
        </div>
      )}

      {/* Archive notice footer */}
      <div className="flex items-center gap-2.5 text-[13px] text-[#747683] pt-2">
        <Archive className="w-4 h-4 flex-shrink-0" />
        <span>Finished a course? Archive it to keep its tasks without crowding your current semester.</span>
      </div>

      {/* Add Course Modal */}
      <CourseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={async (data) => {
          await createCourse.mutateAsync(data);
        }}
      />
    </div>
  );
};
