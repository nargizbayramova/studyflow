import React from "react";
import { StudyBlock } from "@/types";
import { StudyBlockCard } from "./StudyBlockCard";
import {
  CALENDAR_HOURS,
  formatHourLabel,
  getCurrentTimeOffset,
  getSlotFromClick,
  isToday,
  sumBlocksHours,
  toDateKey,
} from "../calendarUtils";

const HOUR_HEIGHT = 60;

interface WeekViewProps {
  weekDays: Date[];
  blocksByDate: Map<string, StudyBlock[]>;
  onSelectBlock: (block: StudyBlock) => void;
  onSelectSlot: (date: Date) => void;
  onStatusChange?: (block: StudyBlock, status: "completed" | "missed") => void;
}

export const WeekView: React.FC<WeekViewProps> = ({
  weekDays,
  blocksByDate,
  onSelectBlock,
  onSelectSlot,
  onStatusChange,
}) => {
  const currentLineTop = getCurrentTimeOffset(HOUR_HEIGHT);

  return (
    <div className="bg-white border border-[#E5E6EB] rounded-xl shadow-sm overflow-hidden flex flex-col">
      <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-[#E5E6EB] bg-[#F7F7F4]/60 sticky top-0 z-20">
        <div className="border-r border-[#E5E6EB] p-2 text-center text-[10px] font-semibold text-[#747683] flex items-center justify-center uppercase">
          Time
        </div>
        {weekDays.map((date) => {
          const today = isToday(date);
          const dayBlocks = blocksByDate.get(toDateKey(date)) ?? [];
          const dayHours = sumBlocksHours(dayBlocks);

          return (
            <div
              key={date.toISOString()}
              className={`p-2.5 text-center border-r border-[#E5E6EB] last:border-r-0 flex flex-col items-center gap-1 ${
                today ? "bg-[#EFEEF9]/50" : ""
              }`}
            >
              <span className="text-[11px] font-semibold text-[#747683] uppercase tracking-wider">
                {date.toLocaleDateString("en-US", { weekday: "short" })}
              </span>
              <span
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                  today ? "bg-[#5553B7] text-white shadow-sm" : "text-[#252735]"
                }`}
              >
                {date.getDate()}
              </span>
              {dayHours > 0 && (
                <span className="text-[10px] text-[#5553B7] font-semibold">
                  {dayHours.toFixed(1)}h
                </span>
              )}
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-[60px_repeat(7,1fr)] relative overflow-x-auto max-h-[750px] overflow-y-auto">
        <div className="border-r border-[#E5E6EB] bg-[#FAFAF8] select-none">
          {CALENDAR_HOURS.map((h) => (
            <div
              key={h}
              style={{ height: `${HOUR_HEIGHT}px` }}
              className="border-b border-[#F0F1F5] text-[11px] font-medium text-[#747683] pr-2 pt-1 text-right"
            >
              {formatHourLabel(h)}
            </div>
          ))}
        </div>

        {weekDays.map((date) => {
          const today = isToday(date);
          const dayBlocks = blocksByDate.get(toDateKey(date)) ?? [];

          return (
            <div
              key={date.toISOString()}
              className="relative border-r border-[#F0F1F5] last:border-r-0 cursor-pointer"
              onClick={(e) => onSelectSlot(getSlotFromClick(e, date, HOUR_HEIGHT))}
            >
              {CALENDAR_HOURS.map((h) => (
                <div
                  key={h}
                  style={{ height: `${HOUR_HEIGHT}px` }}
                  className="border-b border-[#F0F1F5] hover:bg-[#F7F7F4]/40 transition-colors"
                />
              ))}

              {today && currentLineTop !== null && (
                <div
                  className="absolute left-0 right-0 z-10 flex items-center pointer-events-none"
                  style={{ top: `${currentLineTop}px` }}
                >
                  <div className="w-2.5 h-2.5 -ml-1 rounded-full bg-[#5553B7]" />
                  <div className="flex-1 h-[2px] bg-[#5553B7]" />
                </div>
              )}

              {dayBlocks.map((b) => (
                <StudyBlockCard
                  key={b.id}
                  block={b}
                  hourHeight={HOUR_HEIGHT}
                  compact
                  onSelect={onSelectBlock}
                  onStatusChange={onStatusChange}
                />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
};
