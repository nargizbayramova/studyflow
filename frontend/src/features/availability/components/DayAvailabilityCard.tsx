import React from "react";
import { Pencil } from "lucide-react";
import { AvailabilitySlot, SlotKind } from "@/types";
import { DaySlotColumn } from "./DaySlotColumn";

interface DayAvailabilityRowProps {
  dayIndex: number;
  dayName: string;
  dayDateLabel?: string | null;
  slots: AvailabilitySlot[];
  isSelectedDay: boolean;
  selectedSlotId: number | null;
  onSelectSlot: (slot: AvailabilitySlot) => void;
  onAddSlotForDay: (dayIndex: number, kind: SlotKind) => void;
  onEditDay: (dayIndex: number) => void;
}

export const DayAvailabilityCard: React.FC<DayAvailabilityRowProps> = ({
  dayIndex,
  dayName,
  dayDateLabel,
  slots,
  isSelectedDay,
  selectedSlotId,
  onSelectSlot,
  onAddSlotForDay,
  onEditDay,
}) => {
  const availableSlots = slots.filter((s) => s.kind === "available");
  const blockedSlots = slots.filter((s) => s.kind === "blocked");
  const blockedKindLabel = dayIndex >= 5 ? "Personal time" : "Classes";

  return (
    <div
      onClick={() => onEditDay(dayIndex)}
      className={`group/dayrow flex flex-col sm:flex-row sm:items-start gap-2.5 sm:gap-4 px-3 py-4 sm:py-[16px] border-b border-[#E5E6EB] transition-colors cursor-pointer ${
        isSelectedDay ? "bg-[#EFEEF9] rounded-[8px]" : "bg-white hover:bg-[#F7F7F4]/60"
      }`}
    >
      <div className="w-full sm:w-[92px] flex-shrink-0 flex items-center sm:flex-col sm:items-start justify-between pt-0.5">
        <span
          className={`text-[12px] leading-[1.45] text-[#252735] ${
            isSelectedDay ? "font-semibold" : "font-medium"
          }`}
        >
          {dayName}
        </span>
        {dayDateLabel && (
          <span className="text-[11px] text-[#747683] leading-tight">{dayDateLabel}</span>
        )}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onEditDay(dayIndex);
          }}
          className="sm:hidden p-1 text-[#747683] hover:text-[#252735] cursor-pointer"
          aria-label={`Edit ${dayName} availability`}
        >
          <Pencil className="w-[15px] h-[15px]" />
        </button>
      </div>

      <div className="flex-1 min-w-0">
        <DaySlotColumn
          slots={availableSlots}
          selectedSlotId={selectedSlotId}
          mobileHeader="Available study time"
          mobileHeaderColor="text-[#327864]"
          primaryTextColor="text-[#327864]"
          subtitleSuffix="Available"
          emptyText="No available slots"
          addLabel="Add available"
          onSelectSlot={onSelectSlot}
          onAddSlot={() => onAddSlotForDay(dayIndex, "available")}
        />
      </div>

      <div className="w-full sm:w-[190px] flex-shrink-0">
        <DaySlotColumn
          slots={blockedSlots}
          selectedSlotId={selectedSlotId}
          mobileHeader="Blocked time"
          mobileHeaderColor="text-[#747683]"
          primaryTextColor="text-[#747683]"
          subtitleSuffix={blockedKindLabel}
          emptyText="No blocked slots"
          addLabel="Add blocked"
          onSelectSlot={onSelectSlot}
          onAddSlot={() => onAddSlotForDay(dayIndex, "blocked")}
        />
      </div>

      <div className="hidden sm:flex w-[24px] flex-shrink-0 items-center justify-end pt-1">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onEditDay(dayIndex);
          }}
          className="p-1 text-[#747683] hover:text-[#252735] transition-colors cursor-pointer"
          aria-label={`Edit ${dayName} availability`}
        >
          <Pencil className="w-[15px] h-[15px]" />
        </button>
      </div>
    </div>
  );
};
