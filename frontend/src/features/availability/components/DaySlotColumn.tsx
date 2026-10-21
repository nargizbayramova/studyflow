import React from "react";
import { AvailabilitySlot } from "@/types";
import {
  formatHoursLabel,
  formatSlotTimeRange,
  getSlotDurationHours,
} from "../utils/availabilityUtils";

interface DaySlotColumnProps {
  slots: AvailabilitySlot[];
  selectedSlotId: number | null;
  mobileHeader: string;
  mobileHeaderColor: string;
  primaryTextColor: string;
  subtitleSuffix: string;
  emptyText: string;
  onSelectSlot: (slot: AvailabilitySlot) => void;
  onEmptyClick: () => void;
}

export const DaySlotColumn: React.FC<DaySlotColumnProps> = ({
  slots,
  selectedSlotId,
  mobileHeader,
  mobileHeaderColor,
  primaryTextColor,
  subtitleSuffix,
  emptyText,
  onSelectSlot,
  onEmptyClick,
}) => (
  <div className="flex flex-col gap-2">
    <span className={`sm:hidden text-[10px] font-medium uppercase ${mobileHeaderColor}`}>
      {mobileHeader}
    </span>
    {slots.length > 0 ? (
      slots.map((slot) => {
        const hrs = getSlotDurationHours(slot.start_time, slot.end_time);
        const isSelected = slots.length > 1 && selectedSlotId === slot.id;
        return (
          <div
            key={slot.id}
            onClick={(e) => {
              e.stopPropagation();
              onSelectSlot(slot);
            }}
            className={`flex flex-col gap-1 rounded-md ${
              isSelected ? "underline underline-offset-2" : ""
            }`}
          >
            <span className={`text-[12px] font-normal leading-[1.45] ${primaryTextColor}`}>
              {formatSlotTimeRange(slot.start_time, slot.end_time)}
            </span>
            <span className="text-[11px] font-normal leading-[1.45] text-[#747683]">
              {formatHoursLabel(hrs)} · {subtitleSuffix}
            </span>
          </div>
        );
      })
    ) : (
      <div
        onClick={(e) => {
          e.stopPropagation();
          onEmptyClick();
        }}
        className="flex flex-col gap-1"
      >
        <span className="text-[12px] font-normal leading-[1.45] text-[#747683]">—</span>
        <span className="text-[11px] font-normal leading-[1.45] text-[#747683]">{emptyText}</span>
      </div>
    )}
  </div>
);
