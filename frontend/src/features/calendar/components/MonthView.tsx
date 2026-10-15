import React from "react";
import { StudyBlock, Task, Course } from "@/types";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

interface MonthViewProps {
  currentDate: Date;
  blocks: StudyBlock[];
  tasks: Task[];
  courses: Course[];
  onSelectBlock: (block: StudyBlock) => void;
  onSelectSlot: (date: Date) => void;
}

export const MonthView: React.FC<MonthViewProps> = ({
  currentDate,
  blocks,
  tasks,
  courses,
  onSelectBlock,
  onSelectSlot,
}) => {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  // Day of week index (0 = Monday, ..., 6 = Sunday)
  const startDayOfWeek = (firstDayOfMonth.getDay() + 6) % 7;
  const daysInMonth = lastDayOfMonth.getDate();

  const calendarDays: { date: Date; isCurrentMonth: boolean }[] = [];

  // Previous month trailing days
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    calendarDays.push({
      date: new Date(year, month, -i),
      isCurrentMonth: false,
    });
  }

  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push({
      date: new Date(year, month, i),
      isCurrentMonth: true,
    });
  }

  // Next month leading days to complete the 7-col grid
  const remaining = 7 - (calendarDays.length % 7);
  if (remaining < 7) {
    for (let i = 1; i <= remaining; i++) {
      calendarDays.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false,
      });
    }
  }

  const now = new Date();
  const isToday = (d: Date) =>
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();

  return (
    <div className="bg-white border border-[#E5E6EB] rounded-xl shadow-sm overflow-hidden flex flex-col">
      {/* Weekday Header */}
      <div className="grid grid-cols-7 border-b border-[#E5E6EB] bg-[#F7F7F4]/70">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="p-3 text-center text-xs font-semibold text-[#747683] uppercase tracking-wider border-r border-[#E5E6EB] last:border-r-0"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Month Days Grid */}
      <div className="grid grid-cols-7 auto-rows-fr">
        {calendarDays.map(({ date, isCurrentMonth }) => {
          const today = isToday(date);
          const dayBlocks = blocks.filter((b) => {
            const bd = new Date(b.start_at);
            return (
              bd.getDate() === date.getDate() &&
              bd.getMonth() === date.getMonth() &&
              bd.getFullYear() === date.getFullYear()
            );
          });

          return (
            <div
              key={date.toISOString()}
              onClick={() => {
                const slot = new Date(date);
                slot.setHours(10, 0, 0, 0);
                onSelectSlot(slot);
              }}
              className={`min-h-[110px] p-2 border-b border-r border-[#F0F1F5] flex flex-col justify-between transition-colors hover:bg-slate-50/70 cursor-pointer ${
                !isCurrentMonth ? "bg-[#FAFAF8]/50 text-slate-300" : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                    today
                      ? "bg-[#5553B7] text-white"
                      : isCurrentMonth
                      ? "text-[#252735]"
                      : "text-slate-400"
                  }`}
                >
                  {date.getDate()}
                </span>
                {dayBlocks.length > 0 && (
                  <span className="text-[10px] font-bold text-[#5553B7]">
                    {dayBlocks.length} session{dayBlocks.length === 1 ? "" : "s"}
                  </span>
                )}
              </div>

              {/* Study block pills */}
              <div className="flex flex-col gap-1 mt-1.5 overflow-hidden">
                {dayBlocks.slice(0, 2).map((b) => {
                  const task = tasks.find((t) => t.id === b.task_id);
                  const course = courses.find((c) => c.id === task?.course_id);
                  const color = course?.color || "#5553B7";

                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectBlock(b);
                      }}
                      style={{
                        backgroundColor: `${color}18`,
                        borderLeft: `2.5px solid ${color}`,
                      }}
                      className="px-1.5 py-0.5 rounded text-[10px] font-semibold text-[#252735] text-left truncate hover:opacity-85 transition-opacity"
                    >
                      <span className="opacity-75 mr-1 font-bold">{course?.code}</span>
                      <span>{task?.title || "Session"}</span>
                    </button>
                  );
                })}

                {dayBlocks.length > 2 && (
                  <span className="text-[10px] font-semibold text-[#747683] pl-1">
                    +{dayBlocks.length - 2} more
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
