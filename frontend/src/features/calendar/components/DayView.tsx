import React from "react";
import { Clock, Plus } from "lucide-react";
import { AvailabilitySlot, Course, StudyBlock, Task } from "@/types";
import { AvailabilitySlotOverlay } from "./AvailabilitySlotOverlay";
import { StudyBlockCard } from "./StudyBlockCard";
import { TaskDueCell } from "./TaskDueCell";
import {
  CALENDAR_HOURS,
  formatHourLabel,
  getCurrentTimeOffset,
  getSlotFromClick,
  getSlotsForCalendarDate,
  isToday,
  sumBlocksHours,
} from "../calendarUtils";

const HOUR_HEIGHT = 60;

interface DayViewProps {
  currentDate: Date;
  dayBlocks: StudyBlock[];
  dayTasks: Task[];
  coursesById: Map<number, Course>;
  availabilitySlots: AvailabilitySlot[];
  onSelectBlock: (block: StudyBlock) => void;
  onSelectSlot: (date: Date) => void;
  onStatusChange?: (block: StudyBlock, status: "completed" | "missed") => void;
}

export const DayView: React.FC<DayViewProps> = ({
  currentDate,
  dayBlocks,
  dayTasks,
  coursesById,
  availabilitySlots,
  onSelectBlock,
  onSelectSlot,
  onStatusChange,
}) => {
  const today = isToday(currentDate);
  const currentLineTop = getCurrentTimeOffset(HOUR_HEIGHT);
  const completedCount = dayBlocks.filter((b) => b.status === "completed").length;
  const daySlots = getSlotsForCalendarDate(availabilitySlots, currentDate);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <div className="lg:col-span-8 bg-white border border-[#E5E6EB] rounded-[12px] overflow-hidden flex flex-col">
        <div className="p-3.5 sm:p-4 border-b border-[#E5E6EB] bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#5553B7]" />
            <span className="text-sm font-semibold text-[#252735]">Hourly Schedule</span>
          </div>
          <span className="text-xs text-[#747683]">Click any open slot to schedule a session</span>
        </div>

        {/* TASK DUE Row */}
        <div className="grid grid-cols-[60px_minmax(0,1fr)] border-b border-[#E5E6EB] bg-[#F7F7F4]/75">
          <div className="border-r border-[#E5E6EB] p-2.5 text-[10px] uppercase leading-tight text-[#747683]">
            TASK
            <br />
            DUE
          </div>
          <div className="min-w-0 overflow-hidden p-2.5">
            <TaskDueCell tasks={dayTasks} coursesById={coursesById} />
          </div>
        </div>

        {/* Hourly Grid */}
        <div className="grid grid-cols-[60px_minmax(0,1fr)] relative">
          <div className="border-r border-[#E5E6EB] bg-white select-none">
            {CALENDAR_HOURS.map((h) => (
              <div
                key={h}
                style={{ height: `${HOUR_HEIGHT}px` }}
                className="border-b border-[#E5E6EB] last:border-b-0 text-[10px] font-normal text-[#747683] pl-2.5 pt-2"
              >
                {formatHourLabel(h)}
              </div>
            ))}
          </div>

          <div
            className={`relative cursor-pointer ${today ? "bg-[#EFEEF9]/20" : "bg-white"}`}
            onClick={(e) => onSelectSlot(getSlotFromClick(e, currentDate, HOUR_HEIGHT))}
          >
            {CALENDAR_HOURS.map((h) => (
              <div
                key={h}
                style={{ height: `${HOUR_HEIGHT}px` }}
                className="border-b border-[#E5E6EB] last:border-b-0 hover:bg-[#F7F7F4]/40 transition-colors"
              />
            ))}

            {daySlots.map((slot) => (
              <AvailabilitySlotOverlay
                key={slot.id}
                slot={slot}
                hourHeight={HOUR_HEIGHT}
              />
            ))}

            {today && currentLineTop !== null && (
              <div
                className="absolute left-0 right-0 z-10 h-[2px] bg-[#5553B7] pointer-events-none"
                style={{ top: `${currentLineTop}px` }}
              />
            )}

            {dayBlocks.map((b) => (
              <StudyBlockCard
                key={b.id}
                block={b}
                hourHeight={HOUR_HEIGHT}
                onSelect={onSelectBlock}
                onStatusChange={onStatusChange}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="lg:col-span-4 flex flex-col gap-5">
        <div className="bg-white border border-[#E5E6EB] rounded-[12px] p-5">
          <h3 className="text-sm font-semibold text-[#252735] mb-3 pb-3 border-b border-[#E5E6EB]">
            Day Summary
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#747683]">Total sessions</span>
              <span className="font-semibold text-[#252735]">{dayBlocks.length}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#747683]">Completed</span>
              <span className="font-semibold text-[#327864]">{completedCount}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#747683]">Scheduled time</span>
              <span className="font-semibold text-[#252735]">{sumBlocksHours(dayBlocks)} h</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              const d = new Date(currentDate);
              d.setHours(16, 0, 0, 0);
              onSelectSlot(d);
            }}
            className="w-full mt-5 py-2.5 rounded-[8px] border border-[#5553B7] text-[#5553B7] hover:bg-[#EFEEF9] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Add session to this day
          </button>
        </div>
      </div>
    </div>
  );
};
