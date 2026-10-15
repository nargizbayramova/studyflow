import React from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { Course, Task } from "@/types";

interface CourseCardProps {
  course: Course;
  tasks: Task[];
  onEdit?: () => void;
}

export const CourseCard: React.FC<CourseCardProps> = ({ course, tasks, onEdit }) => {
  const courseTasks = tasks.filter((t) => t.course_id === course.id);
  const completedCount = courseTasks.filter((t) => t.status === "completed").length;
  const totalCount = courseTasks.length;
  const openCount = totalCount - completedCount;

  const totalEffortHours = courseTasks
    .filter((t) => t.status !== "completed")
    .reduce((acc, t) => acc + (t.estimated_hours || 0), 0);

  const pct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const color = course.color || "#6561BD";

  const nextTask = courseTasks
    .filter((t) => t.status !== "completed")
    .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())[0];

  const formatDeadline = (dateStr: string) => {
    return new Date(dateStr)
      .toLocaleDateString("en-US", { month: "short", day: "numeric" })
      .toUpperCase();
  };

  return (
    <div className="bg-white border border-[#E5E6EB] rounded-xl overflow-hidden flex flex-col shadow-sm">
      {/* 5px top accent stripe */}
      <div className="w-full h-[5px]" style={{ backgroundColor: color }} />

      <div className="p-6 flex flex-col gap-4 flex-1">
        {/* Header row */}
        <div className="flex items-center justify-between">
          <span
            className="px-2.5 py-1 rounded-md text-xs font-semibold"
            style={{ backgroundColor: `${color}18`, color }}
          >
            {course.code}
          </span>
          <button
            onClick={onEdit}
            className="text-xs font-medium text-[#5553B7] hover:text-[#48469F] transition-colors cursor-pointer"
          >
            Edit
          </button>
        </div>

        {/* Title and Instructor */}
        <div className="flex flex-col gap-0.5">
          <Link
            to={`/courses/${course.id}`}
            className="text-[21px] font-semibold text-[#252735] hover:text-[#5553B7] transition-colors line-clamp-1"
          >
            {course.title}
          </Link>
          <span className="text-[13px] text-[#747683]">
            {course.instructor || "Instructor not set"}
          </span>
        </div>

        {/* Task progress info */}
        <div className="flex items-center justify-between text-xs pt-1">
          <span className="text-[#747683]">Task progress</span>
          <span className="font-semibold text-[#252735]">
            {completedCount} of {totalCount} completed
          </span>
        </div>

        {/* Progress track */}
        <div
          className="w-full h-[6px] rounded-md overflow-hidden"
          style={{ backgroundColor: `${color}20` }}
        >
          <div
            className="h-full rounded-md transition-all duration-300"
            style={{ width: `${Math.max(4, pct)}%`, backgroundColor: color }}
          />
        </div>

        {/* Open tasks and effort */}
        <div className="flex items-center justify-between text-xs text-[#747683]">
          <span>{openCount} open tasks</span>
          <span>{totalEffortHours} h estimated effort</span>
        </div>

        <div className="h-[1px] bg-[#E5E6EB] w-full my-1" />

        {/* Next deadline */}
        {nextTask ? (
          <Link
            to={`/courses/${course.id}`}
            className="flex items-center justify-between text-xs group pt-0.5"
          >
            <div className="flex flex-col gap-0.5 overflow-hidden pr-2">
              <span className="text-[11px] font-medium text-[#747683]">
                NEXT DEADLINE · {formatDeadline(nextTask.due_date)}
              </span>
              <span className="text-[13px] text-[#252735] font-medium group-hover:text-[#5553B7] transition-colors truncate">
                {nextTask.title}
              </span>
            </div>
            <ArrowUpRight className="w-4 h-4 text-[#747683] group-hover:text-[#5553B7] transition-colors flex-shrink-0" />
          </Link>
        ) : (
          <div className="text-xs text-[#747683] italic pt-1">
            No upcoming deadlines
          </div>
        )}
      </div>
    </div>
  );
};
