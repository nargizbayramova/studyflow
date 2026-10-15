import React from "react";
import { StudyBlock, Task, Course } from "@/types";
import { StudyBlockCard } from "./StudyBlockCard";

interface DayColumnProps {
  dayName: string;
  date: Date;
  today: boolean;
  blocks: StudyBlock[];
  tasks: Task[];
  courses: Course[];
  onSelectBlock: (block: StudyBlock) => void;
}

export const DayColumn: React.FC<DayColumnProps> = ({
  dayName,
  date,
  today,
  blocks,
  tasks,
  courses,
  onSelectBlock,
}) => {
  return (
    <div
      className={`bg-white border rounded-xl p-3 flex flex-col gap-3 min-h-[360px] shadow-sm ${
        today ? "border-[#5553B7] ring-1 ring-[#5553B7]/20" : "border-[#E5E6EB]"
      }`}
    >
      <div className="flex items-center justify-between border-b border-[#E5E6EB] pb-2">
        <span className="text-xs font-semibold text-[#747683]">{dayName.slice(0, 3)}</span>
        <span
          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
            today ? "bg-[#5553B7] text-white" : "text-[#252735]"
          }`}
        >
          {date.getDate()}
        </span>
      </div>

      <div className="flex-1 flex flex-col gap-2 overflow-y-auto">
        {blocks.length === 0 ? (
          <span className="text-[11px] text-[#747683]/50 text-center py-8">No sessions</span>
        ) : (
          blocks.map((b) => {
            const task = tasks.find((t) => t.id === b.task_id);
            const course = courses.find((c) => c.id === task?.course_id);
            return (
              <StudyBlockCard
                key={b.id}
                block={b}
                task={task}
                course={course}
                onClick={() => onSelectBlock(b)}
              />
            );
          })
        )}
      </div>
    </div>
  );
};
