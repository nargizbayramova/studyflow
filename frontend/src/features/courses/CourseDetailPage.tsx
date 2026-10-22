import React from "react";
import { useParams, Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { useCourse } from "@/features/courses/api/courses";
import { useTasks } from "@/features/tasks/api/tasks";
import { Spinner } from "@/shared/ui/Spinner";
import { CourseGlancePanel } from "./components/CourseGlancePanel";
import { CourseTasksPanel } from "./components/CourseTasksPanel";
import { EditCourseSidebar } from "./components/EditCourseSidebar";

export const CourseDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const courseId = Number(id);

  const { data: course, isLoading: loadingCourse } = useCourse(courseId);
  const { data: allTasks = [], isLoading: loadingTasks } = useTasks({ course_id: courseId });

  if (loadingCourse || loadingTasks) {
    return (
      <div className="h-64 flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="p-12 text-center bg-white border border-[#E5E6EB] rounded-xl max-w-lg mx-auto">
        <h3 className="text-base font-semibold text-[#252735]">Course not found</h3>
        <Link to="/courses" className="text-xs text-[#5553B7] hover:underline mt-2 inline-block">
          ← Back to courses
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-7 max-w-7xl mx-auto font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <Link
            to="/courses"
            className="text-xs font-semibold text-[#5553B7] hover:text-[#48469F] transition-colors"
          >
            ← Courses / {course.code}
          </Link>
          <h1 className="text-[30px] font-normal text-[#252735] tracking-tight">
            {course.title}
          </h1>
          <p className="text-sm text-[#747683]">
            {course.instructor ? `${course.instructor} · ` : ""}{course.semester}
          </p>
        </div>

        <Link
          to={`/tasks?new=true&course_id=${course.id}`}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#5553B7] hover:bg-[#48469F] text-white text-sm font-semibold transition-colors shadow-sm self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add task</span>
        </Link>
      </div>

      {/* Main split */}
      <div className="flex flex-col lg:flex-row items-start gap-6">
        <div className="flex-1 flex flex-col gap-6 w-full">
          <CourseGlancePanel course={course} tasks={allTasks} />
          <CourseTasksPanel tasks={allTasks} />
        </div>
        <EditCourseSidebar course={course} />
      </div>
    </div>
  );
};
