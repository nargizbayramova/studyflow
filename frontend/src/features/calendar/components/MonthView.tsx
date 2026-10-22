import React from "react";
import { StudyBlock } from "@/features/calendar/types";
import { getMonthGridDays, isToday, toDateKey, toSolidPastel, WEEKDAY_LABELS } from "../calendarUtils";

interface MonthViewProps {
  currentDate: Date;
  blocksByDate: Map<string, StudyBlock[]>;
  onSelectBlock: (block: StudyBlock) => void;
  onSelectSlot: (date: Date) => void;
}

export const MonthView: React.FC<MonthViewProps> = ({
  currentDate,
  blocksByDate,
  onSelectBlock,
  onSelectSlot,
}) => {
  const calendarDays = getMonthGridDays(currentDate);

  return (
    <div className="bg-white border border-[#E5E6EB] rounded-xl shadow-sm overflow-hidden flex flex-col">
      <div className="grid grid-cols-7 border-b border-[#E5E6EB] bg-[#F7F7F4]/70">
        {WEEKDAY_LABELS.map((day) => (
          <div
            key={day}
            className="min-w-0 p-2 sm:p-3 text-center text-[10px] sm:text-xs font-semibold text-[#747683] uppercase tracking-wider border-r border-[#E5E6EB] last:border-r-0"
          >
            <span className="sm:hidden">{day.charAt(0)}</span>
            <span className="hidden sm:inline">{day}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 auto-rows-fr">
        {calendarDays.map(({ date, isCurrentMonth }) => {
          const today = isToday(date);
          const dayBlocks = blocksByDate.get(toDateKey(date)) ?? [];

          return (
            <div
              key={date.toISOString()}
              onClick={() => {
                const slot = new Date(date);
                slot.setHours(10, 0, 0, 0);
                onSelectSlot(slot);
              }}
              className={`min-w-0 overflow-hidden min-h-[78px] sm:min-h-[110px] p-1 sm:p-2 border-b border-r border-[#F0F1F5] flex flex-col justify-between transition-colors hover:bg-slate-50/70 cursor-pointer ${
                !isCurrentMonth ? "bg-[#FAFAF8]/50 text-slate-300" : ""
              }`}
            >
              <div className="flex items-center justify-between gap-0.5">
                <span
                  className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[11px] sm:text-xs font-semibold ${
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
                  <span className="hidden sm:inline text-[10px] font-bold text-[#5553B7]">
                    {dayBlocks.length} session{dayBlocks.length === 1 ? "" : "s"}
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-1 mt-1.5 overflow-hidden">
                {dayBlocks.slice(0, 2).map((b) => {
                  const color = b.course_color || "#5553B7";
                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectBlock(b);
                      }}
                      style={{
                        backgroundColor: toSolidPastel(color),
                        borderLeft: `2.5px solid ${color}`,
                      }}
                      className="px-1.5 py-0.5 rounded text-[10px] font-semibold text-[#252735] text-left truncate transition-colors"
                    >
                      {b.course_code && (
                        <span className="opacity-75 mr-1 font-bold">{b.course_code}</span>
                      )}
                      <span>{b.task_title || "Session"}</span>
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
