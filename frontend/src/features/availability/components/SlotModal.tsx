import React, { useState } from "react";
import { X, CheckCircle2, Ban } from "lucide-react";
import { AvailabilitySlot, SlotCreatePayload, SlotKind, SlotUpdatePayload } from "@/types";
import {
  DAYS,
  buildTimeOptions,
  formatHoursLabel,
  getSlotDurationHours,
  normalizeTimeValue,
  parseMinutes,
} from "../utils/availabilityUtils";
import { SelectField } from "./SelectField";

interface SlotEditorPanelProps {
  mode: "edit" | "create";
  selectedSlot: AvailabilitySlot | null;
  defaultDay: number;
  defaultKind: SlotKind;
  daySlots: AvailabilitySlot[];
  onSelectSlot: (slot: AvailabilitySlot) => void;
  onCreate: (data: SlotCreatePayload) => Promise<void>;
  onUpdate: (id: number, data: SlotUpdatePayload) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  onCancel: () => void;
}

export const SlotModal: React.FC<SlotEditorPanelProps> = ({
  mode,
  selectedSlot,
  defaultDay,
  defaultKind,
  daySlots,
  onSelectSlot,
  onCreate,
  onUpdate,
  onDelete,
  onCancel,
}) => {
  const isEditing = mode === "edit" && selectedSlot !== null;
  const [dayOfWeek, setDayOfWeek] = useState<number>(
    isEditing ? selectedSlot.day_of_week : defaultDay
  );
  const [kind, setKind] = useState<SlotKind>(isEditing ? selectedSlot.kind : defaultKind);
  const [startTime, setStartTime] = useState<string>(
    isEditing ? normalizeTimeValue(selectedSlot.start_time) : defaultKind === "blocked" ? "10:00" : "16:00"
  );
  const [endTime, setEndTime] = useState<string>(
    isEditing ? normalizeTimeValue(selectedSlot.end_time) : defaultKind === "blocked" ? "12:00" : "19:00"
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const durationHours = getSlotDurationHours(startTime, endTime);

  const handleDayChange = (val: string) => {
    const newDay = Number(val);
    setDayOfWeek(newDay);
    if (isEditing) {
      const match =
        daySlots.find((s) => s.day_of_week === newDay && s.kind === kind) ||
        daySlots.find((s) => s.day_of_week === newDay);
      if (match) onSelectSlot(match);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (parseMinutes(startTime) >= parseMinutes(endTime)) {
      setError("End time must be after start time");
      return;
    }
    setLoading(true);
    setError(null);
    const payload = {
      day_of_week: dayOfWeek,
      kind,
      start_time: `${startTime}:00`,
      end_time: `${endTime}:00`,
    };
    try {
      if (isEditing) {
        await onUpdate(selectedSlot.id, payload);
      } else {
        await onCreate(payload);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save recurring slot");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full lg:w-[360px] flex-shrink-0 bg-white border border-[#E5E6EB] rounded-[12px] p-5 sm:p-6 flex flex-col gap-5 self-start">
      <div className="flex items-center justify-between">
        <h2 className="text-[19px] font-semibold leading-[1.45] text-[#252735]">
          {isEditing ? "Edit recurring slot" : "Add recurring slot"}
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

      {error && (
        <div className="px-3 py-2 rounded-lg bg-[#FDF2F2] border border-[#F5D0D0] text-[#B45353] text-xs font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <SelectField
          label="Day of the week"
          value={dayOfWeek}
          onChange={handleDayChange}
          options={DAYS.map((d, idx) => ({ value: idx, label: d }))}
        />

        <SelectField
          label="Time type"
          value={kind}
          onChange={(v) => setKind(v as SlotKind)}
          options={[
            { value: "available", label: "Available study time" },
            { value: "blocked", label: "Blocked time" },
          ]}
        />

        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-[15px] h-[15px] text-[#327864] flex-shrink-0" />
            <span className="text-[12px] text-[#327864]">Available: time you can study</span>
          </div>
          <div className="flex items-center gap-2">
            <Ban className="w-[15px] h-[15px] text-[#747683] flex-shrink-0" />
            <span className="text-[12px] text-[#747683]">Blocked: time to keep free of study</span>
          </div>
        </div>

        <SelectField
          label="Start time"
          value={startTime}
          onChange={setStartTime}
          options={buildTimeOptions(startTime)}
        />

        <SelectField
          label="End time"
          value={endTime}
          onChange={setEndTime}
          options={buildTimeOptions(endTime)}
        />

        <div className="flex items-center justify-between gap-2">
          <span className="text-[13px] text-[#747683]">Repeats every {DAYS[dayOfWeek]}</span>
          <span
            className={`px-[9px] py-1 rounded-[6px] text-[12px] font-medium ${
              kind === "available" ? "bg-[#EAF4EF] text-[#327864]" : "bg-[#F7F7F4] text-[#747683]"
            }`}
          >
            {formatHoursLabel(durationHours)}
          </span>
        </div>

        <div className="p-4 rounded-[8px] bg-[#EFEEF9] flex flex-col gap-1.5">
          <span className="text-[13px] font-semibold text-[#5553B7]">
            Changes affect your recurring hours
          </span>
          <p className="text-[13px] text-[#747683] leading-[1.45]">
            Existing study blocks keep their scheduled times. Review them in your calendar after editing availability.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-[11px] rounded-[8px] bg-[#5553B7] hover:bg-[#48469F] text-white text-[14px] font-semibold transition-colors disabled:opacity-60 cursor-pointer"
          >
            {loading ? "Saving..." : "Save changes"}
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
            disabled={loading}
            onClick={() => onDelete(selectedSlot.id)}
            className="text-[12px] text-[#B45353] hover:underline text-left cursor-pointer disabled:opacity-50"
          >
            Delete recurring slot…
          </button>
        </>
      )}
    </div>
  );
};
