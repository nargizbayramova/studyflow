import React from "react";
import { Course } from "@/features/courses/types";
import { Task } from "@/features/tasks/types";

interface CourseProgressPanelProps {
  courses: Course[];
  tasks: Task[];
}

export const CourseProgressPanel: React.FC<CourseProgressPanelProps> = ({ courses, tasks }) => {
  return (
    <div className="p-6 bg-white border border-[#E5E6EB] rounded-xl flex flex-col gap-5 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-[#252735]">Course progress</span>
        <span className="text-xs text-[#747683]">Completed tasks · Fall 2026</span>
      </div>

      {courses.length === 0 ? (
        <div className="py-4 text-center text-xs text-[#747683]">
          No courses added yet. Add courses to track your semester progress.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-7">
          {courses.slice(0, 4).map((course) => {
            const courseTasks = tasks.filter((t) => t.course_id === course.id);
            const completed = courseTasks.filter((t) => t.status === "completed").length;
            const total = courseTasks.length;
            const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
            const color = course.color || "#5553B7";

            return (
              <div key={course.id} className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold" style={{ color }}>
                    {course.code}
                  </span>
                  <span className="text-[11px] text-[#747683]">
                    {completed} / {total}
                  </span>
                </div>
                <div
                  className="w-full h-[5px] rounded-full overflow-hidden"
                  style={{ backgroundColor: `${color}25` }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{ width: `${Math.max(5, pct)}%`, backgroundColor: color }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
