import React from "react";
import { StudyBlock } from "@/types";
import { CourseTag } from "@/components/common/CourseTag";
import { CheckCircle2 } from "lucide-react";

const HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22];
const HOUR_HEIGHT = 60; // 60px per hour => 1px per minute

interface WeekViewProps {
  weekDays: Date[];
  blocks: StudyBlock[];
  onSelectBlock: (block: StudyBlock) => void;
  onSelectSlot: (date: Date) => void;
}

export const WeekView: React.FC<WeekViewProps> = ({
  weekDays,
  blocks,
  onSelectBlock,
  onSelectSlot,
}) => {
  const now = new Date();
  const nowHours = now.getHours() + now.getMinutes() / 60;
  const showCurrentTime = nowHours >= 8 && nowHours <= 22;
  const currentLineTop = (nowHours - 8) * HOUR_HEIGHT;

  const isToday = (d: Date) =>
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();

  return (
    <div className="bg-white border border-[#E5E6EB] rounded-xl shadow-sm overflow-hidden flex flex-col">
      {/* 7-Day Header Row */}
      <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-[#E5E6EB] bg-[#F7F7F4]/60 sticky top-0 z-20">
        <div className="border-r border-[#E5E6EB] p-2 text-center text-[10px] font-semibold text-[#747683] flex items-center justify-center uppercase">
          Time
        </div>
        {weekDays.map((date) => {
          const today = isToday(date);
          const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
          const dayNum = date.getDate();

          const dayHours = blocks
            .filter((b) => {
              const bd = new Date(b.start_at);
              return (
                bd.getDate() === date.getDate() &&
                bd.getMonth() === date.getMonth() &&
                bd.getFullYear() === date.getFullYear()
              );
            })
            .reduce((acc, b) => {
              return acc + (new Date(b.end_at).getTime() - new Date(b.start_at).getTime()) / 3600000;
            }, 0);

          return (
            <div
              key={date.toISOString()}
              className={`p-2.5 text-center border-r border-[#E5E6EB] last:border-r-0 flex flex-col items-center gap-1 ${
                today ? "bg-[#EFEEF9]/50" : ""
              }`}
            >
              <span className="text-[11px] font-semibold text-[#747683] uppercase tracking-wider">
                {dayName}
              </span>
              <span
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                  today ? "bg-[#5553B7] text-white shadow-sm" : "text-[#252735]"
                }`}
              >
                {dayNum}
              </span>
              {dayHours > 0 && (
                <span className="text-[10px] text-[#5553B7] font-semibold">{dayHours.toFixed(1)}h</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Timeline Grid Body */}
      <div className="grid grid-cols-[60px_repeat(7,1fr)] relative overflow-x-auto max-h-[750px] overflow-y-auto">
        {/* Left Hours Column */}
        <div className="border-r border-[#E5E6EB] bg-[#FAFAF8] select-none">
          {HOURS.map((h) => (
            <div
              key={h}
              style={{ height: `${HOUR_HEIGHT}px` }}
              className="border-b border-[#F0F1F5] text-[11px] font-medium text-[#747683] pr-2 pt-1 text-right"
            >
              {h === 12 ? "12 PM" : h > 12 ? `${h - 12} PM` : `${h} AM`}
            </div>
          ))}
        </div>

        {/* 7 Columns for Days */}
        {weekDays.map((date) => {
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
              className="relative border-r border-[#F0F1F5] last:border-r-0 cursor-pointer"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const offsetY = e.clientY - rect.top;
                const clickedHour = Math.floor(offsetY / HOUR_HEIGHT) + 8;
                const slotDate = new Date(date);
                slotDate.setHours(clickedHour, 0, 0, 0);
                onSelectSlot(slotDate);
              }}
            >
              {/* Hour Grid Lines */}
              {HOURS.map((h) => (
                <div
                  key={h}
                  style={{ height: `${HOUR_HEIGHT}px` }}
                  className="border-b border-[#F0F1F5] hover:bg-[#F7F7F4]/40 transition-colors"
                />
              ))}

              {/* Current Time Indicator */}
              {today && showCurrentTime && (
                <div
                  className="absolute left-0 right-0 z-10 flex items-center pointer-events-none"
                  style={{ top: `${currentLineTop}px` }}
                >
                  <div className="w-2.5 h-2.5 -ml-1 rounded-full bg-[#5553B7]" />
                  <div className="flex-1 h-[2px] bg-[#5553B7]" />
                </div>
              )}

              {/* Study Blocks */}
              {dayBlocks.map((b) => {
                const bStart = new Date(b.start_at);
                const bEnd = new Date(b.end_at);
                const startHour = bStart.getHours() + bStart.getMinutes() / 60;
                const endHour = bEnd.getHours() + bEnd.getMinutes() / 60;

                const top = Math.max(0, (startHour - 8) * HOUR_HEIGHT);
                const height = Math.max(28, (endHour - startHour) * HOUR_HEIGHT - 3);

                const color = b.course_color || "#5553B7";
                const code = b.course_code || "STUDY";
                const title = b.task_title || "Study Session";
                const isCompleted = b.status === "completed";

                const formatTime = (d: Date) =>
                  d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

                return (
                  <div
                    key={b.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectBlock(b);
                    }}
                    style={{
                      top: `${top}px`,
                      height: `${height}px`,
                      backgroundColor: `${color}18`,
                      borderLeft: `3px solid ${color}`,
                      borderTop: `1px solid ${color}30`,
                      borderRight: `1px solid ${color}30`,
                      borderBottom: `1px solid ${color}30`,
                    }}
                    className={`absolute left-1 right-1 rounded-md p-1.5 flex flex-col justify-between overflow-hidden shadow-xs hover:shadow-md transition-all cursor-pointer z-10 ${
                      isCompleted ? "opacity-75" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 leading-none">
                      <CourseTag code={code} color={color} />
                      <span className="text-[10px] font-medium text-[#747683]">
                        {formatTime(bStart)}–{formatTime(bEnd)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-1 mt-0.5">
                      <span className="text-[11px] font-bold text-[#252735] truncate">
                        {title}
                      </span>
                      {isCompleted && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
};
