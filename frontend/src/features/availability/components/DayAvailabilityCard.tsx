import React from "react";
import { Trash2, Plus } from "lucide-react";
import { AvailabilitySlot } from "@/types";

interface DayAvailabilityCardProps {
  dayName: string;
  dayIndex: number;
  slots: AvailabilitySlot[];
  onAddSlot: (dayIndex: number) => void;
  onDeleteSlot: (id: number) => void;
}

export const DayAvailabilityCard: React.FC<DayAvailabilityCardProps> = ({
  dayName,
  dayIndex,
  slots,
  onAddSlot,
  onDeleteSlot,
}) => {
  return (
    <div className="bg-white border border-[#E5E6EB] rounded-xl p-4 flex flex-col justify-between shadow-sm min-h-[220px]">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-[#F0F1F5] mb-3">
          <h3 className="text-sm font-bold text-[#252735]">{dayName}</h3>
          <span className="text-xs font-medium text-[#747683]">
            {slots.length} {slots.length === 1 ? "slot" : "slots"}
          </span>
        </div>

        {slots.length === 0 ? (
          <p className="py-8 text-center text-xs text-[#747683]">No slots configured</p>
        ) : (
          <div className="flex flex-col gap-2">
            {slots.map((slot) => {
              const isAvail = slot.kind === "available";
              return (
                <div
                  key={slot.id}
                  className={`px-3 py-2 rounded-lg border flex items-center justify-between text-xs transition-colors ${
                    isAvail
                      ? "bg-[#EFEEF9] border-[#DEDCF5] text-[#5553B7]"
                      : "bg-[#FCF3E3] border-[#F7E2BC] text-[#98651E]"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[#252735]">
                      {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                    </span>
                    <span className="text-[11px] font-medium capitalize opacity-85">
                      ({slot.kind})
                    </span>
                  </div>

                  <button
                    onClick={() => onDeleteSlot(slot.id)}
                    className="text-[#747683] hover:text-red-500 p-1 rounded transition-colors"
                    title="Delete slot"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <button
        onClick={() => onAddSlot(dayIndex)}
        className="mt-4 pt-3 border-t border-[#F0F1F5] flex items-center justify-center gap-1.5 text-xs font-semibold text-[#5553B7] hover:text-[#48469F] transition-colors w-full"
      >
        <Plus className="w-3.5 h-3.5" /> Add time slot
      </button>
    </div>
  );
};
