import React from "react";
import { Plus } from "lucide-react";
import { AvailabilitySlot } from "@/features/availability/types";
import { DAYS, formatSlotTimeRange } from "../utils/availabilityUtils";

interface Props {
  dayOfWeek: number;
  slots: AvailabilitySlot[];
  activeSlotId: number | null;
  onSelectSlot: (slot: AvailabilitySlot) => void;
  onNew: () => void;
}

/** Quick switcher between the slots of the day currently being edited. */
export const SlotDaySwitcher: React.FC<Props> = ({ dayOfWeek, slots, activeSlotId, onSelectSlot, onNew }) => (
  <div className="flex flex-col gap-1.5 p-2.5 rounded-[8px] bg-[#F7F7F4]">
    <div className="flex items-center justify-between">
      <span className="text-[11px] font-medium text-[#747683]">
        {DAYS[dayOfWeek]} slots ({slots.length})
      </span>
      <button
        type="button"
        onClick={onNew}
        className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-[#5553B7] hover:underline cursor-pointer"
      >
        <Plus className="w-3 h-3" /> New on {DAYS[dayOfWeek].slice(0, 3)}
      </button>
    </div>
    <div className="flex flex-wrap gap-1.5">
      {slots.map((s) => (
        <button
          key={s.id}
          type="button"
          onClick={() => onSelectSlot(s)}
          className={`px-2 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
            activeSlotId === s.id
              ? "bg-[#5553B7] text-white"
              : "bg-white border border-[#E5E6EB] text-[#252735] hover:bg-[#EFEEF9]"
          }`}
        >
          {formatSlotTimeRange(s.start_time, s.end_time)}
        </button>
      ))}
    </div>
  </div>
);
