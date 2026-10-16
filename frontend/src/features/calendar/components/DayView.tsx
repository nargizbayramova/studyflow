import React from "react";
import { StudyBlock } from "@/types";
import { Clock, Plus } from "lucide-react";
import { StudyBlockCard } from "./StudyBlockCard";
import {
  CALENDAR_HOURS,
  formatHourLabel,
  getCurrentTimeOffset,
  getSlotFromClick,
  isToday,
  sumBlocksHours,
} from "../calendarUtils";

const HOUR_HEIGHT = 64;

interface DayViewProps {
  currentDate: Date;
  dayBlocks: StudyBlock[];
  onSelectBlock: (block: StudyBlock) => void;
  onSelectSlot: (date: Date) => void;
}

export const DayView: React.FC<DayViewProps> = ({
  currentDate,
  dayBlocks,
  onSelectBlock,
  onSelectSlot,
}) => {
  const today = isToday(currentDate);
  const currentLineTop = getCurrentTimeOffset(HOUR_HEIGHT);
  const completedCount = dayBlocks.filter((b) => b.status === "completed").length;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <div className="lg:col-span-8 bg-white border border-[#E5E6EB] rounded-xl shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-[#E5E6EB] bg-[#F7F7F4]/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#5553B7]" />
            <span className="text-sm font-bold text-[#252735]">Hourly Schedule</span>
          </div>
          <span className="text-xs text-[#747683]">Click any open slot to schedule a session</span>
        </div>

        <div className="grid grid-cols-[68px_1fr] relative overflow-y-auto max-h-[720px]">
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

          <div
            className="relative cursor-pointer"
            onClick={(e) => onSelectSlot(getSlotFromClick(e, currentDate, HOUR_HEIGHT))}
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
                onSelect={onSelectBlock}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="lg:col-span-4 flex flex-col gap-5">
        <div className="bg-white border border-[#E5E6EB] rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-bold text-[#252735] mb-3 pb-3 border-b border-[#F0F1F5]">
            Day Summary
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#747683]">Total sessions</span>
              <span className="font-semibold text-[#252735]">{dayBlocks.length}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#747683]">Completed</span>
              <span className="font-semibold text-emerald-600">{completedCount}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#747683]">Scheduled time</span>
              <span className="font-semibold text-[#252735]">{sumBlocksHours(dayBlocks)} hrs</span>
            </div>
          </div>
          <button
            onClick={() => {
              const d = new Date(currentDate);
              d.setHours(9, 0, 0, 0);
              onSelectSlot(d);
            }}
            className="w-full mt-5 py-2.5 rounded-lg border border-[#5553B7] text-[#5553B7] hover:bg-[#EFEEF9] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Add session to this day
          </button>
        </div>
      </div>
    </div>
  );
};
