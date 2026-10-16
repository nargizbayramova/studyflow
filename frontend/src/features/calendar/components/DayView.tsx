import React from "react";
import { StudyBlock, Task, Course } from "@/types";
import { CourseTag } from "@/components/common/CourseTag";
import { PriorityBadge } from "@/components/common/PriorityBadge";
import { CheckCircle2, Clock, Plus } from "lucide-react";

const HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22];
const HOUR_HEIGHT = 64;

interface DayViewProps {
  currentDate: Date;
  blocks: StudyBlock[];
  tasks: Task[];
  courses: Course[];
  onSelectBlock: (block: StudyBlock) => void;
  onSelectSlot: (date: Date) => void;
}

export const DayView: React.FC<DayViewProps> = ({
  currentDate,
  blocks,
  tasks,
  courses,
  onSelectBlock,
  onSelectSlot,
}) => {
  const dayBlocks = blocks.filter((b) => {
    const bd = new Date(b.start_at);
    return (
      bd.getDate() === currentDate.getDate() &&
      bd.getMonth() === currentDate.getMonth() &&
      bd.getFullYear() === currentDate.getFullYear()
    );
  });

  const now = new Date();
  const isToday =
    currentDate.getDate() === now.getDate() &&
    currentDate.getMonth() === now.getMonth() &&
    currentDate.getFullYear() === now.getFullYear();

  const nowHours = now.getHours() + now.getMinutes() / 60;
  const currentLineTop = (nowHours - 8) * HOUR_HEIGHT;

  const dayTasks = tasks.filter((t) => {
    const td = new Date(t.due_date);
    return (
      td.getDate() === currentDate.getDate() &&
      td.getMonth() === currentDate.getMonth() &&
      td.getFullYear() === currentDate.getFullYear()
    );
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Detailed Hourly Timeline (8 cols) */}
      <div className="lg:col-span-8 bg-white border border-[#E5E6EB] rounded-xl shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-[#E5E6EB] bg-[#F7F7F4]/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#5553B7]" />
            <span className="text-sm font-bold text-[#252735]">Hourly Schedule</span>
          </div>
          <span className="text-xs text-[#747683]">Click any open slot to schedule a session</span>
        </div>

        <div className="grid grid-cols-[68px_1fr] relative overflow-y-auto max-h-[720px]">
          {/* Time gutter */}
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

          {/* Timeline slots column */}
          <div
            className="relative cursor-pointer"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const clickedHour = Math.floor((e.clientY - rect.top) / HOUR_HEIGHT) + 8;
              const slotDate = new Date(currentDate);
              slotDate.setHours(clickedHour, 0, 0, 0);
              onSelectSlot(slotDate);
            }}
          >
            {HOURS.map((h) => (
              <div
                key={h}
                style={{ height: `${HOUR_HEIGHT}px` }}
                className="border-b border-[#F0F1F5] hover:bg-[#F7F7F4]/40 transition-colors"
              />
            ))}

            {isToday && nowHours >= 8 && nowHours <= 22 && (
              <div
                className="absolute left-0 right-0 z-10 flex items-center pointer-events-none"
                style={{ top: `${currentLineTop}px` }}
              >
                <div className="w-2.5 h-2.5 -ml-1 rounded-full bg-[#5553B7]" />
                <div className="flex-1 h-[2px] bg-[#5553B7]" />
              </div>
            )}

            {/* Blocks */}
            {dayBlocks.map((b) => {
              const bStart = new Date(b.start_at);
              const bEnd = new Date(b.end_at);
              const startHour = bStart.getHours() + bStart.getMinutes() / 60;
              const endHour = bEnd.getHours() + bEnd.getMinutes() / 60;

              const top = Math.max(0, (startHour - 8) * HOUR_HEIGHT);
              const height = Math.max(34, (endHour - startHour) * HOUR_HEIGHT - 3);

              const task = b.task_title ? undefined : tasks.find((t) => t.id === b.task_id);
              const course = b.course_code && b.course_color ? undefined : courses.find((c) => c.id === task?.course_id);
              const color = b.course_color || course?.color || "#5553B7";
              const code = b.course_code || course?.code || "STUDY";
              const title = b.task_title || task?.title || "Study Session";
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
                    borderLeft: `4px solid ${color}`,
                    borderTop: `1px solid ${color}35`,
                    borderRight: `1px solid ${color}35`,
                    borderBottom: `1px solid ${color}35`,
                  }}
                  className={`absolute left-2 right-2 rounded-lg p-2.5 flex items-center justify-between shadow-xs hover:shadow-md transition-all cursor-pointer z-10 ${
                    isCompleted ? "opacity-75" : ""
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <CourseTag code={code} color={color} />
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-[#252735] truncate">
                        {title}
                      </span>
                      <span className="text-[11px] text-[#747683]">
                        {formatTime(bStart)} – {formatTime(bEnd)} &bull; {b.status}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {task?.priority && <PriorityBadge priority={task.priority} />}
                    {isCompleted && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right Side Panel: Deadlines & Day Summary (4 cols) */}
      <div className="lg:col-span-4 flex flex-col gap-5">
        <div className="bg-white border border-[#E5E6EB] rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-[#F0F1F5] mb-3">
            <h3 className="text-sm font-bold text-[#252735]">Deadlines today</h3>
            <span className="text-xs font-semibold text-[#747683]">{dayTasks.length}</span>
          </div>

          {dayTasks.length === 0 ? (
            <p className="py-6 text-center text-xs text-[#747683]">No deadlines due on this day</p>
          ) : (
            <div className="flex flex-col gap-2.5">
              {dayTasks.map((t) => {
                const course = courses.find((c) => c.id === t.course_id);
                return (
                  <div
                    key={t.id}
                    className="p-3 rounded-lg border border-[#E5E6EB] bg-[#F7F7F4]/50 flex flex-col gap-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <CourseTag code={course?.code || "COURSE"} color={course?.color || "#5553B7"} />
                      <PriorityBadge priority={t.priority} />
                    </div>
                    <span className="text-xs font-bold text-[#252735]">{t.title}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white border border-[#E5E6EB] rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-bold text-[#252735] mb-1">Study block count</h3>
          <p className="text-xs text-[#747683] mb-4">
            {dayBlocks.length} planned session{dayBlocks.length === 1 ? "" : "s"} for this date.
          </p>
          <button
            onClick={() => {
              const d = new Date(currentDate);
              d.setHours(9, 0, 0, 0);
              onSelectSlot(d);
            }}
            className="w-full py-2.5 rounded-lg border border-[#5553B7] text-[#5553B7] hover:bg-[#EFEEF9] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Add session to this day
          </button>
        </div>
      </div>
    </div>
  );
};
