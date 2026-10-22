import React from "react";
import { X } from "lucide-react";
import { AvailabilitySlot, SlotCreatePayload, SlotKind, SlotUpdatePayload } from "@/features/availability/types";
import { useSlotForm, RepeatType } from "../hooks/useSlotForm";
import { SlotDaySwitcher } from "./SlotDaySwitcher";
import { SlotFormFields } from "./SlotFormFields";

interface SlotEditorPanelProps {
  mode: "edit" | "create";
  selectedSlot: AvailabilitySlot | null;
  defaultDay: number;
  defaultKind: SlotKind;
  defaultRepeat: RepeatType;
  weekDates: Date[];
  daySlots: AvailabilitySlot[];
  allSlots?: AvailabilitySlot[];
  onSelectSlot: (slot: AvailabilitySlot) => void;
  onStartCreateForDay: (dayIndex: number, kind: SlotKind) => void;
  onCreate: (data: SlotCreatePayload) => Promise<void>;
  onUpdate: (id: number, data: SlotUpdatePayload) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  onCancel: () => void;
}

export const SlotModal: React.FC<SlotEditorPanelProps> = (props) => {
  const { mode, selectedSlot, daySlots, onCancel } = props;
  const isEditing = mode === "edit" && selectedSlot !== null;
  const form = useSlotForm({ ...props, isEditing, pool: props.allSlots || daySlots });
  const slotsForCurrentDay = daySlots.filter((s) => s.day_of_week === form.dayOfWeek);

  return (
    <div className="w-full lg:w-[360px] flex-shrink-0 bg-white border border-[#E5E6EB] rounded-[12px] p-5 sm:p-6 flex flex-col gap-4 self-start">
      <div className="flex items-center justify-between">
        <h2 className="text-[19px] font-semibold leading-[1.45] text-[#252735]">
          {isEditing ? "Edit slot" : "Add slot"}
        </h2>
        <button
          type="button"
          onClick={onCancel}
          className="p-1 text-[#747683] hover:text-[#252735] transition-colors cursor-pointer"
          aria-label="Close slot editor"
        >
          <X className="w-[18px] h-[18px]" />
        </button>
      </div>

      {slotsForCurrentDay.length > 0 && (
        <SlotDaySwitcher
          dayOfWeek={form.dayOfWeek}
          slots={slotsForCurrentDay}
          activeSlotId={isEditing ? selectedSlot.id : null}
          onSelectSlot={props.onSelectSlot}
          onNew={() => props.onStartCreateForDay(form.dayOfWeek, form.kind)}
        />
      )}

      {form.error && (
        <div className="px-3 py-2 rounded-lg bg-[#FDF2F2] border border-[#F5D0D0] text-[#B45353] text-xs font-medium">
          {form.error}
        </div>
      )}

      <form onSubmit={form.submit} className="flex flex-col gap-4">
        <SlotFormFields form={form} />
        <div className="flex items-center gap-2.5">
          <button
            type="submit"
            disabled={form.loading}
            className="px-4 py-[11px] rounded-[8px] bg-[#5553B7] hover:bg-[#48469F] text-white text-[14px] font-semibold transition-colors disabled:opacity-60 cursor-pointer"
          >
            {form.loading ? "Saving..." : isEditing ? "Save changes" : "Add slot"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-[11px] rounded-[8px] bg-white border border-[#E5E6EB] hover:bg-[#F7F7F4] text-[#252735] text-[14px] font-semibold transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </form>

      {isEditing && (
        <>
          <div className="h-[1px] w-full bg-[#E5E6EB]" />
          <button
            type="button"
            disabled={form.loading}
            onClick={() => props.onDelete(selectedSlot.id)}
            className="text-[12px] text-[#B45353] hover:underline text-left cursor-pointer disabled:opacity-50"
          >
            Delete slot…
          </button>
        </>
      )}
    </div>
  );
};
