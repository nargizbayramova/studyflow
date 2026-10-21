import React from "react";
import { Link } from "react-router-dom";
import { AvailabilitySlot, SlotKind } from "@/types";
import { DAYS } from "../utils/availabilityUtils";
import { DayAvailabilityCard } from "./DayAvailabilityCard";

interface RecurringWeekTableProps {
  slots: AvailabilitySlot[];
  availableCount: number;
  blockedCount: number;
  activeDayIndex: number;
  isEditorVisible: boolean;
  selectedSlotId: number | null;
  onSelectSlot: (slot: AvailabilitySlot) => void;
  onAddSlotForDay: (dayIndex: number, kind: SlotKind) => void;
  onEditDay: (dayIndex: number) => void;
}

export const RecurringWeekTable: React.FC<RecurringWeekTableProps> = ({
  slots,
  availableCount,
  blockedCount,
  activeDayIndex,
  isEditorVisible,
  selectedSlotId,
  onSelectSlot,
  onAddSlotForDay,
  onEditDay,
}) => {
  return (
    <div className="flex-1 w-full min-w-0 flex flex-col gap-6">
      <div className="bg-white border border-[#E5E6EB] rounded-[12px] p-4 sm:p-6 flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <h2 className="text-[18px] font-semibold leading-[1.45] text-[#252735]">
            Your recurring week
          </h2>
          <p className="text-[13px] font-normal leading-[1.45] text-[#747683]">
            These are time windows, not scheduled sessions. Use your study calendar to add actual study blocks.
          </p>
        </div>

        <div className="flex flex-col">
          <div className="hidden sm:flex items-center gap-4 p-3 bg-[#F7F7F4] text-[11px] font-normal leading-[1.45]">
            <span className="w-[92px] flex-shrink-0 text-[#747683]">DAY</span>
            <span className="flex-1 text-[#327864]">AVAILABLE STUDY TIME</span>
            <span className="w-[160px] flex-shrink-0 text-[#747683]">BLOCKED TIME</span>
            <span className="w-[24px] flex-shrink-0" />
          </div>

          <div className="flex flex-col">
            {DAYS.map((dayName, idx) => (
              <DayAvailabilityCard
                key={dayName}
                dayIndex={idx}
                dayName={dayName}
                slots={slots.filter((s) => s.day_of_week === idx)}
                isSelectedDay={isEditorVisible && activeDayIndex === idx}
                selectedSlotId={selectedSlotId}
                onSelectSlot={onSelectSlot}
                onAddSlotForDay={onAddSlotForDay}
                onEditDay={onEditDay}
              />
            ))}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span className="text-[12px] font-normal leading-[1.45] text-[#747683]">
            {slots.length} recurring {slots.length === 1 ? "slot" : "slots"} · {availableCount} available / {blockedCount} blocked
          </span>
          <Link
            to="/calendar"
            className="text-[12px] font-normal leading-[1.45] text-[#5553B7] hover:underline"
          >
            View in calendar →
          </Link>
        </div>
      </div>

      <div className="p-4 rounded-[8px] bg-[#EFEEF9] flex flex-col gap-1.5">
        <span className="text-[13px] font-semibold leading-[1.45] text-[#5553B7]">
          Protect your time, not just your deadlines.
        </span>
        <p className="text-[13px] font-normal leading-[1.45] text-[#747683]">
          Available time is a window you could use for study. Blocked time is reserved for classes, work, or rest — keep study sessions outside it.
        </p>
      </div>
    </div>
  );
};
