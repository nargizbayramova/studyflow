import React from "react";
import { Task, Course, StudyBlock } from "@/types";

interface DashboardStatsProps {
  tasks: Task[];
  courses: Course[];
  studyBlocks: StudyBlock[];
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({
  tasks,
  courses,
  studyBlocks,
}) => {
  const openTasks = tasks.filter((t) => t.status !== "completed");
  const completedTasks = tasks.filter((t) => t.status === "completed");

  const now = new Date();
  const next7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const dueNext7Days = openTasks.filter((t) => {
    const due = new Date(t.due_date);
    return due >= now && due <= next7Days;
  });

  const totalMinutes = studyBlocks.reduce((acc, b) => {
    const start = new Date(b.start_at).getTime();
    const end = new Date(b.end_at).getTime();
    return acc + Math.max(0, (end - start) / 60000);
  }, 0);
  const totalHours = Math.round(totalMinutes / 60);

  const completedHours = Math.round(
    studyBlocks
      .filter((b) => b.status === "completed")
      .reduce((acc, b) => {
        const start = new Date(b.start_at).getTime();
        const end = new Date(b.end_at).getTime();
        return acc + Math.max(0, (end - start) / 60000);
      }, 0) / 60
  );
  const scheduledHours = totalHours - completedHours;

  const completionPct =
    tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0;

  const stats = [
    {
      label: "Open tasks",
      value: String(openTasks.length),
      caption: `Across ${courses.length} active courses`,
    },
    {
      label: "Due in the next 7 days",
      value: String(dueNext7Days.length),
      caption: `${dueNext7Days.length} due this upcoming week`,
    },
    {
      label: "Study time this week",
      value: `${totalHours} h`,
      caption: `${completedHours} h done · ${Math.max(0, scheduledHours)} h scheduled`,
    },
    {
      label: "Tasks completed",
      value: `${completedTasks.length} / ${tasks.length}`,
      caption: `${completionPct}% of this semester’s tasks`,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {stats.map((s) => (
        <div
          key={s.label}
          className="p-4 sm:p-6 bg-white border border-[#E5E6EB] rounded-xl flex flex-col gap-2.5 sm:gap-4 shadow-sm"
        >
          <span className="text-xs sm:text-[13px] text-[#747683] leading-snug">{s.label}</span>
          <span className="text-2xl sm:text-[30px] font-normal text-[#252735] tracking-tight leading-none">
            {s.value}
          </span>
          <span className="text-[11px] sm:text-xs text-[#747683]">{s.caption}</span>
        </div>
      ))}
    </div>
  );
};
