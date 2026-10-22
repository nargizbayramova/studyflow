import React from "react";
import { AvailabilitySlot } from "@/features/availability/types";
import { END_HOUR, START_HOUR, parseTimeHours } from "../calendarUtils";

interface AvailabilitySlotOverlayProps {
  slot: AvailabilitySlot;
  hourHeight: number;
}

export const AvailabilitySlotOverlay: React.FC<AvailabilitySlotOverlayProps> = ({
  slot,
  hourHeight,
}) => {
  const rawStart = parseTimeHours(slot.start_time);
  const rawEnd = parseTimeHours(slot.end_time);
  const clampedStart = Math.max(START_HOUR, rawStart);
  const clampedEnd = Math.min(END_HOUR, rawEnd);

  if (clampedEnd <= clampedStart) return null;

  const top = (clampedStart - START_HOUR) * hourHeight + 2;
  const height = Math.max(24, (clampedEnd - clampedStart) * hourHeight - 4);
  const totalHours = Math.round((rawEnd - rawStart) * 10) / 10;
  const blockedCategory = slot.day_of_week >= 5 ? "Personal time" : "Classes";

  if (slot.kind === "blocked") {
    return (
      <div
        style={{ top: `${top}px`, height: `${height}px` }}
        className="absolute left-1 right-1 rounded-[6px] bg-[#EFECE8] p-2 flex flex-col gap-0.5 pointer-events-none select-none z-[1] overflow-hidden"
      >
        <span className="text-[11px] font-normal leading-tight text-[#747683]">
          {slot.specific_date ? "Blocked (this week)" : "Blocked time"}
        </span>
        <span className="text-[11px] font-normal leading-tight text-[#747683]">
          {blockedCategory} · {totalHours} h
        </span>
      </div>
    );
  }

  return (
    <div
      style={{ top: `${top}px`, height: `${height}px` }}
      className="absolute left-1 right-1 rounded-[6px] bg-[#EAF4EF] border border-dashed border-[#327864]/50 p-2 flex flex-col justify-end pointer-events-none select-none z-[1] overflow-hidden"
    >
      <span className="text-[11px] font-medium leading-tight text-[#327864]">
        {slot.specific_date ? "Available (this week)" : "Available to study"}
      </span>
    </div>
  );
};
