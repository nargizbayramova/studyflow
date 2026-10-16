import React from "react";
import { Link } from "react-router-dom";
import { Clock3 } from "lucide-react";
import { StudyBlock, Course, Task } from "@/types";
import { CourseTag } from "@/components/common/CourseTag";

interface TodayStudyPlanProps {
  studyBlocks: StudyBlock[];
  courses: Course[];
  tasks: Task[];
}

export const TodayStudyPlan: React.FC<TodayStudyPlanProps> = ({
  studyBlocks,
  courses,
  tasks,
}) => {
  const todayStr = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date());

  const isToday = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    return (
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate()
    );
  };

  const todayBlocks = studyBlocks.filter((b) => isToday(b.start_at));

  const totalTodayHours = Math.round(
    todayBlocks.reduce((acc, b) => {
      const dur = (new Date(b.end_at).getTime() - new Date(b.start_at).getTime()) / 3600000;
      return acc + dur;
    }, 0)
  );

  const formatTimeRange = (start: string, end: string) => {
    const s = new Date(start).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    const e = new Date(end).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    return `${s}–${e}`;
  };

  const getDurationHours = (start: string, end: string) => {
    const hours = (new Date(end).getTime() - new Date(start).getTime()) / 3600000;
    return `${hours === 1 ? "1 hour" : `${hours} hours`}`;
  };

  return (
    <div className="w-full lg:w-[420px] p-6 bg-white border border-[#E5E6EB] rounded-xl flex flex-col gap-5 flex-shrink-0 shadow-sm">
      <h3 className="text-lg font-semibold text-[#252735]">Today’s study plan</h3>

      <div className="flex items-center justify-between text-[13px]">
        <span className="text-[#747683]">{todayStr}</span>
        <span className="px-2.5 py-1 bg-[#EFEEF9] text-[#5553B7] rounded-md text-xs font-medium">
          {totalTodayHours} h scheduled
        </span>
      </div>

      <div className="flex flex-col gap-3">
        {todayBlocks.length === 0 ? (
          <div className="p-6 text-center text-xs text-[#747683] bg-[#F7F7F4] rounded-lg">
            No study blocks scheduled for today.
          </div>
        ) : (
          todayBlocks.slice(0, 3).map((block) => {
            const task = block.task_title ? undefined : tasks.find((t) => t.id === block.task_id);
            const course = block.course_code && block.course_color ? undefined : courses.find((c) => c.id === task?.course_id);
            const color = block.course_color || course?.color || "#5553B7";
            const code = block.course_code || course?.code || "GENERAL";
            const title = block.task_title || task?.title || "Focus Study Session";

            return (
              <div
                key={block.id}
                className="p-4 rounded-lg flex flex-col gap-2"
                style={{
                  backgroundColor: `${color}15`,
                  borderLeft: `3px solid ${color}`,
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#252735]">
                    {formatTimeRange(block.start_at, block.end_at)}
                  </span>
                  <Clock3 className="w-3.5 h-3.5 text-[#747683]" />
                </div>
                <h4 className="text-sm font-semibold text-[#252735] line-clamp-1">
                  {title}
                </h4>
                <div className="flex items-center justify-between text-xs pt-0.5">
                  <CourseTag code={code} color={color} />
                  <span className="text-[11px] text-[#747683]">
                    {getDurationHours(block.start_at, block.end_at)} · Scheduled
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      <Link
        to="/calendar"
        className="text-[13px] font-semibold text-[#5553B7] hover:text-[#48469F] transition-colors mt-auto pt-1"
      >
        Open study calendar →
      </Link>
    </div>
  );
};
