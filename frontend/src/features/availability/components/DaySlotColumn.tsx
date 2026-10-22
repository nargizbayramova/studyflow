import React from "react";
import { Plus } from "lucide-react";
import { AvailabilitySlot } from "@/features/availability/types";
import {
  formatHoursLabel,
  formatShortDate,
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
  addLabel: string;
  onSelectSlot: (slot: AvailabilitySlot) => void;
  onAddSlot: () => void;
}

export const DaySlotColumn: React.FC<DaySlotColumnProps> = ({
  slots,
  selectedSlotId,
  mobileHeader,
  mobileHeaderColor,
  primaryTextColor,
  subtitleSuffix,
  emptyText,
  addLabel,
  onSelectSlot,
  onAddSlot,
}) => (
  <div className="flex flex-col gap-1.5 items-start">
    <span className={`sm:hidden text-[10px] font-medium uppercase ${mobileHeaderColor}`}>
      {mobileHeader}
    </span>
    {slots.length > 0 ? (
      <div className="flex flex-wrap items-start gap-3 sm:gap-4 w-full">
        {slots.map((slot) => {
          const hrs = getSlotDurationHours(slot.start_time, slot.end_time);
          const isSelected = selectedSlotId === slot.id;
          return (
            <div
              key={slot.id}
              onClick={(e) => {
                e.stopPropagation();
                onSelectSlot(slot);
              }}
              className={`flex flex-col gap-0.5 rounded-[6px] px-2.5 py-1.5 transition-all cursor-pointer ${
                isSelected
                  ? "bg-white ring-1 ring-[#5553B7] shadow-xs"
                  : "hover:bg-black/[0.04]"
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span className={`text-[12px] font-normal leading-[1.45] ${primaryTextColor}`}>
                  {formatSlotTimeRange(slot.start_time, slot.end_time)}
                </span>
                {slot.specific_date && (
                  <span className="px-1.5 py-0.2 rounded bg-[#EFEEF9] text-[#5553B7] text-[10px] font-medium">
                    Only {formatShortDate(slot.specific_date)}
                  </span>
                )}
              </div>
              <span className="text-[11px] font-normal leading-[1.45] text-[#747683]">
                {formatHoursLabel(hrs)} · {subtitleSuffix}
              </span>
            </div>
          );
        })}
      </div>
    ) : (
      <div
        onClick={(e) => {
          e.stopPropagation();
          onAddSlot();
        }}
        className="flex flex-col gap-0.5 px-2.5 py-1.5 cursor-pointer rounded-[6px] hover:bg-black/[0.04]"
      >
        <span className="text-[12px] font-normal leading-[1.45] text-[#747683]">—</span>
        <span className="text-[11px] font-normal leading-[1.45] text-[#747683]">{emptyText}</span>
      </div>
    )}

    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onAddSlot();
      }}
      className="opacity-0 group-hover/dayrow:opacity-100 focus:opacity-100 inline-flex items-center gap-1 text-[11px] font-medium text-[#5553B7] hover:underline transition-opacity cursor-pointer"
    >
      <Plus className="w-3 h-3" />
      <span>{addLabel}</span>
    </button>
  </div>
);
