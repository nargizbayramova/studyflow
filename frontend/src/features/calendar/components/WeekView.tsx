import React from "react";
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
  toDateKey,
} from "../calendarUtils";

const HOUR_HEIGHT = 60;

interface WeekViewProps {
  weekDays: Date[];
  blocksByDate: Map<string, StudyBlock[]>;
  tasksByDueDate: Map<string, Task[]>;
  coursesById: Map<number, Course>;
  availabilitySlots: AvailabilitySlot[];
  onSelectBlock: (block: StudyBlock) => void;
  onSelectSlot: (date: Date) => void;
  onStatusChange?: (block: StudyBlock, status: "completed" | "missed") => void;
}

export const WeekView: React.FC<WeekViewProps> = ({
  weekDays,
  blocksByDate,
  tasksByDueDate,
  coursesById,
  availabilitySlots,
  onSelectBlock,
  onSelectSlot,
  onStatusChange,
}) => {
  const currentLineTop = getCurrentTimeOffset(HOUR_HEIGHT);

  return (
    <div className="bg-white border border-[#E5E6EB] rounded-[12px] overflow-hidden flex flex-col">
      <div className="overflow-x-auto">
        <div className="min-w-[760px]">
          {/* Day Headers Row */}
          <div className="grid grid-cols-[60px_repeat(7,minmax(0,1fr))] border-b border-[#E5E6EB]">
            <div className="border-r border-[#E5E6EB] bg-white" />
            {weekDays.map((date) => {
              const today = isToday(date);
              const shortDay = date.toLocaleDateString("en-US", { weekday: "short" });

              return (
                <div
                  key={date.toISOString()}
                  className={`min-w-0 py-2.5 px-2 text-center border-r border-[#E5E6EB] last:border-r-0 flex flex-col items-center justify-center gap-0.5 ${
                    today ? "bg-[#EFEEF9]" : "bg-white"
                  }`}
                >
                  <span
                    className={`text-[11px] leading-tight ${
                      today ? "font-medium text-[#5553B7]" : "font-normal text-[#747683]"
                    }`}
                  >
                    {today ? `${shortDay} · TODAY` : shortDay}
                  </span>
                  <span
                    className={`text-[18px] font-semibold leading-tight ${
                      today ? "text-[#5553B7]" : "text-[#252735]"
                    }`}
                  >
                    {date.getDate()}
                  </span>
                </div>
              );
            })}
          </div>

          {/* TASK DUE Row */}
          <div className="grid grid-cols-[60px_repeat(7,minmax(0,1fr))] border-b border-[#E5E6EB] bg-[#F7F7F4]/75">
            <div className="border-r border-[#E5E6EB] p-2.5 text-[10px] font-normal uppercase leading-tight text-[#747683]">
              TASK
              <br />
              DUE
            </div>
            {weekDays.map((date) => {
              const dayTasks = tasksByDueDate.get(toDateKey(date)) ?? [];
              return (
                <div
                  key={`due-${date.toISOString()}`}
                  className="min-w-0 overflow-hidden p-2.5 border-r border-[#E5E6EB] last:border-r-0 min-h-[68px]"
                >
                  <TaskDueCell tasks={dayTasks} coursesById={coursesById} />
                </div>
              );
            })}
          </div>

          {/* Hourly Grid */}
          <div className="grid grid-cols-[60px_repeat(7,minmax(0,1fr))] relative">
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

            {weekDays.map((date) => {
              const today = isToday(date);
              const daySlots = getSlotsForCalendarDate(availabilitySlots, date);
              const dayBlocks = blocksByDate.get(toDateKey(date)) ?? [];

              return (
                <div
                  key={date.toISOString()}
                  className={`min-w-0 relative border-r border-[#E5E6EB] last:border-r-0 cursor-pointer ${
                    today ? "bg-[#EFEEF9]/20" : "bg-white"
                  }`}
                  onClick={(e) => onSelectSlot(getSlotFromClick(e, date, HOUR_HEIGHT))}
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
      </div>
    </div>
  );
};
