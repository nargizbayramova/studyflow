import React from "react";
import { StudyBlock } from "@/types";
import { CourseTag } from "@/components/common/CourseTag";
import { CheckCircle2 } from "lucide-react";
import { formatTimeRange } from "../calendarUtils";

interface StudyBlockCardProps {
  block: StudyBlock;
  hourHeight: number;
  compact?: boolean;
  onSelect: (block: StudyBlock) => void;
  onStatusChange?: (block: StudyBlock, status: "completed" | "missed") => void;
}

export const StudyBlockCard: React.FC<StudyBlockCardProps> = ({
  block,
  hourHeight,
  compact = false,
  onSelect,
  onStatusChange,
}) => {
  const bStart = new Date(block.start_at);
  const bEnd = new Date(block.end_at);
  const startHour = bStart.getHours() + bStart.getMinutes() / 60;
  const endHour = bEnd.getHours() + bEnd.getMinutes() / 60;

  const top = Math.max(0, (startHour - 8) * hourHeight);
  const minHeight = compact ? 28 : 34;
  const height = Math.max(minHeight, (endHour - startHour) * hourHeight - 3);

  const color = block.course_color || "#5553B7";
  const code = block.course_code || "STUDY";
  const title = block.task_title || "Study Session";
  const isCompleted = block.status === "completed";
  const isMissed = block.status === "missed";
  const isPast = new Date(block.end_at).getTime() <= Date.now();
  const canMarkMissed = isPast || isMissed;
  const timeRange = formatTimeRange(block.start_at, block.end_at);

  const actionButtons = onStatusChange && (
    <div
      className="hidden group-hover:flex items-center gap-1 flex-shrink-0"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        onClick={() => onStatusChange(block, "completed")}
        className={`px-1.5 py-0.5 rounded text-[10px] leading-tight font-semibold transition-colors cursor-pointer ${
          isCompleted
            ? "bg-emerald-600 text-white"
            : "bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs"
        }`}
        title={isCompleted ? "Undo Done" : "Mark Done"}
      >
        ✓ Done
      </button>
      {canMarkMissed && (
        <button
          type="button"
          onClick={() => onStatusChange(block, "missed")}
          className={`px-1.5 py-0.5 rounded text-[10px] leading-tight font-semibold transition-colors cursor-pointer ${
            isMissed
              ? "bg-rose-600 text-white"
              : "bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 shadow-2xs"
          }`}
          title={isMissed ? "Undo Missed" : "Mark Missed"}
        >
          ✕ Missed
        </button>
      )}
    </div>
  );

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onSelect(block);
      }}
      style={{
        top: `${top}px`,
        height: `${height}px`,
        backgroundColor: `${color}18`,
        borderLeft: `${compact ? 3 : 4}px solid ${color}`,
        borderTop: `1px solid ${color}35`,
        borderRight: `1px solid ${color}35`,
        borderBottom: `1px solid ${color}35`,
      }}
      className={`group absolute ${
        compact
          ? "left-1 right-1 rounded-md p-1.5 flex-col justify-between overflow-hidden"
          : "left-2 right-2 rounded-lg p-2.5 items-center justify-between"
      } flex shadow-xs hover:shadow-md transition-all cursor-pointer z-10 ${
        isCompleted || isMissed ? "opacity-75" : ""
      }`}
    >
      {compact ? (
        <>
          <div className="flex items-center justify-between gap-1 leading-none">
            <CourseTag code={code} color={color} />
            <span className="text-[10px] font-medium text-[#747683] truncate">{timeRange}</span>
          </div>
          <div className="flex items-center justify-between gap-1 mt-0.5">
            <span
              className={`text-[11px] font-bold text-[#252735] truncate ${
                isCompleted ? "line-through" : ""
              }`}
            >
              {title}
            </span>
            {actionButtons}
            {isCompleted && (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 group-hover:hidden" />
            )}
          </div>
        </>
      ) : (
        <>
          <div className="flex items-center gap-3 min-w-0">
            <CourseTag code={code} color={color} />
            <div className="flex flex-col min-w-0">
              <span
                className={`text-xs font-bold text-[#252735] truncate ${
                  isCompleted ? "line-through" : ""
                }`}
              >
                {title}
              </span>
              <span className="text-[11px] text-[#747683]">
                {timeRange} &bull; {block.status}
              </span>
            </div>
          </div>
          {actionButtons}
          {isCompleted && (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 group-hover:hidden" />
          )}
        </>
      )}
    </div>
  );
};
