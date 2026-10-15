import React from "react";
import { StudyBlock, Task, Course } from "@/types";
import { CourseTag } from "@/components/common/CourseTag";

interface StudyBlockCardProps {
  block: StudyBlock;
  task?: Task;
  course?: Course;
  onClick: () => void;
}

export const StudyBlockCard: React.FC<StudyBlockCardProps> = ({
  block,
  task,
  course,
  onClick,
}) => {
  const color = course?.color || "#5553B7";

  const formatTime = (iso: string) => {
    return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  };

  const hours = Math.round(
    ((new Date(block.end_at).getTime() - new Date(block.start_at).getTime()) / 3600000) * 10
  ) / 10;

  const isCompleted = block.status === "completed";

  return (
    <button
      onClick={onClick}
      className={`text-left w-full p-2.5 rounded-lg border-l-[3px] flex flex-col gap-1 transition-all hover:shadow-sm cursor-pointer ${
        isCompleted ? "opacity-60" : ""
      }`}
      style={{
        backgroundColor: `${color}18`,
        borderLeftColor: color,
      }}
    >
      <div className="flex items-center justify-between text-[11px] font-semibold text-[#252735]">
        <span>
          {formatTime(block.start_at)}–{formatTime(block.end_at)}
        </span>
        <span className="text-[10px] text-[#747683]">{hours} h</span>
      </div>

      <span className="text-xs font-semibold text-[#252735] line-clamp-2">
        {task?.title || "Focus Session"}
      </span>

      <div className="pt-0.5">
        <CourseTag code={course?.code || "GENERAL"} color={color} />
      </div>
    </button>
  );
};
