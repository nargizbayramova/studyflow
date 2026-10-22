import React from "react";
import { Clock } from "lucide-react";
import { StudyBlock } from "@/features/calendar/types";
import { buildGoogleCalendarUrl } from "@/shared/lib/calendar";
import { START_HOUR, formatTimeRange, toSolidPastel } from "../calendarUtils";

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
  const durationHours = Math.max(0.5, Math.round((endHour - startHour) * 10) / 10);

  const top = Math.max(0, (startHour - START_HOUR) * hourHeight + 3);
  const minHeight = compact ? 42 : 52;
  const height = Math.max(minHeight, (endHour - startHour) * hourHeight - 6);

  const color = block.course_color || "#5553B7";
  const code = block.course_code || "STUDY";
  const title = block.task_title || "Study Session";
  const isCompleted = block.status === "completed";
  const isMissed = block.status === "missed";
  const canMarkMissed = bEnd.getTime() <= Date.now() || isMissed;
  const timeRange = formatTimeRange(block.start_at, block.end_at);

  const gcalUrl = buildGoogleCalendarUrl({
    title: `[${code}] Study: ${title}`,
    details: block.focus_goal || `StudyFlow session (${block.status})`,
    date: block.date || block.start_at,
    startTime: block.start_time || block.start_at,
    endTime: block.end_time || block.end_at,
  });

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onSelect(block);
      }}
      style={{
        top: `${top}px`,
        height: `${height}px`,
        backgroundColor: toSolidPastel(color),
        borderLeft: `3px solid ${color}`,
      }}
      className="group absolute left-1.5 right-1.5 rounded-[6px] p-2 flex flex-col justify-between overflow-hidden hover:shadow-md transition-shadow cursor-pointer z-10"
    >
      <div className="flex flex-col gap-0.5 min-w-0">
        <span
          className="text-[11px] font-semibold leading-tight truncate"
          style={{ color }}
        >
          {isCompleted ? `✓ ${title}` : title}
        </span>
        <span className="text-[11px] font-normal leading-tight text-[#747683] truncate">
          {timeRange}
        </span>

        {(durationHours >= 1.5 || !compact) && (
          <div className="mt-0.5">
            {isCompleted ? (
              <span className="text-[11px] leading-tight truncate" style={{ color }}>
                ✓ Session done · {durationHours} h
              </span>
            ) : isMissed ? (
              <span className="text-[11px] leading-tight truncate text-[#B45353]">
                ✕ Missed · {durationHours} h
              </span>
            ) : (
              <span
                className="text-[11px] leading-tight truncate inline-flex items-center gap-1"
                style={{ color }}
              >
                <Clock className="w-2.5 h-2.5 flex-shrink-0" />
                <span>Scheduled · {durationHours} h</span>
              </span>
            )}
          </div>
        )}
      </div>

      <div
        className="hidden group-hover:flex items-center gap-1 pt-0.5 flex-wrap"
        onClick={(e) => e.stopPropagation()}
      >
        <a
          href={gcalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="px-1.5 py-0.5 rounded text-[9px] leading-tight font-semibold bg-white hover:bg-[#EFEEF9] text-[#5553B7] border border-[#E5E6EB] shadow-2xs"
          title="Add study block to Google Calendar"
        >
          ➕ Google Cal
        </a>
        {onStatusChange && (
          <>
            <button
              type="button"
              onClick={() => onStatusChange(block, "completed")}
              className={`px-1.5 py-0.5 rounded text-[9px] leading-tight font-semibold cursor-pointer ${
                isCompleted
                  ? "bg-emerald-600 text-white"
                  : "bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-200"
              }`}
            >
              ✓ Done
            </button>
            {canMarkMissed && (
              <button
                type="button"
                onClick={() => onStatusChange(block, "missed")}
                className={`px-1.5 py-0.5 rounded text-[9px] leading-tight font-semibold cursor-pointer ${
                  isMissed
                    ? "bg-rose-600 text-white"
                    : "bg-white hover:bg-rose-50 text-rose-700 border border-rose-200"
                }`}
              >
                ✕ Missed
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};
