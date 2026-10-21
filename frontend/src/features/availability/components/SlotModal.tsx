import React, { useState } from "react";
import { X, CheckCircle2, Ban, Plus } from "lucide-react";
import { AvailabilitySlot, SlotCreatePayload, SlotKind, SlotUpdatePayload } from "@/types";
import {
  DAYS,
  buildTimeOptions,
  findOverlappingSlot,
  formatHoursLabel,
  formatShortDate,
  formatSlotTimeRange,
  getSlotDurationHours,
  normalizeTimeValue,
  parseMinutes,
  toIsoDate,
} from "../utils/availabilityUtils";
import { SelectField } from "./SelectField";

interface SlotEditorPanelProps {
  mode: "edit" | "create";
  selectedSlot: AvailabilitySlot | null;
  defaultDay: number;
  defaultKind: SlotKind;
  defaultRepeat: "recurring" | "specific";
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

export const SlotModal: React.FC<SlotEditorPanelProps> = ({
  mode,
  selectedSlot,
  defaultDay,
  defaultKind,
  defaultRepeat,
  weekDates,
  daySlots,
  allSlots,
  onSelectSlot,
  onStartCreateForDay,
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
  const [repeatType, setRepeatType] = useState<"recurring" | "specific">(
    isEditing ? (selectedSlot.specific_date ? "specific" : "recurring") : defaultRepeat
  );
  const [startTime, setStartTime] = useState<string>(
    isEditing ? normalizeTimeValue(selectedSlot.start_time) : defaultKind === "blocked" ? "10:00" : "16:00"
  );
  const [endTime, setEndTime] = useState<string>(
    isEditing ? normalizeTimeValue(selectedSlot.end_time) : defaultKind === "blocked" ? "12:00" : "19:00"
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const durationHours = getSlotDurationHours(startTime, endTime);
  const targetWeekDate = weekDates[dayOfWeek] || weekDates[0];
  const targetDateIso =
    isEditing && selectedSlot.specific_date && selectedSlot.day_of_week === dayOfWeek
      ? selectedSlot.specific_date
      : toIsoDate(targetWeekDate);
  const slotsForCurrentDay = daySlots.filter((s) => s.day_of_week === dayOfWeek);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (parseMinutes(startTime) >= parseMinutes(endTime)) {
      setError("End time must be after start time");
      return;
    }
    const targetSpecificDate = repeatType === "specific" ? targetDateIso : null;
    const pool = allSlots || daySlots;
    const overlap = findOverlappingSlot(
      {
        day_of_week: dayOfWeek,
        specific_date: targetSpecificDate,
        start_time: startTime,
        end_time: endTime,
      },
      pool,
      isEditing ? selectedSlot.id : null
    );
    if (overlap) {
      const kindLabel = overlap.kind === "available" ? "available" : "blocked";
      const timeRange = formatSlotTimeRange(overlap.start_time, overlap.end_time);
      setError(`Time window overlaps with existing ${kindLabel} slot (${timeRange}). Slots cannot overlap.`);
      return;
    }

    setLoading(true);
    setError(null);
    const payload = {
      day_of_week: dayOfWeek,
      specific_date: targetSpecificDate,
      kind,
      start_time: `${startTime}:00`,
      end_time: `${endTime}:00`,
    };
    try {
      if (isEditing) await onUpdate(selectedSlot.id, payload);
      else await onCreate(payload);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save slot");
    } finally {
      setLoading(false);
    }
  };

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

      {/* Multi-slot quick switcher for the selected day */}
      {slotsForCurrentDay.length > 0 && (
        <div className="flex flex-col gap-1.5 p-2.5 rounded-[8px] bg-[#F7F7F4]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-[#747683]">
              {DAYS[dayOfWeek]} slots ({slotsForCurrentDay.length})
            </span>
            <button
              type="button"
              onClick={() => onStartCreateForDay(dayOfWeek, kind)}
              className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-[#5553B7] hover:underline cursor-pointer"
            >
              <Plus className="w-3 h-3" /> New on {DAYS[dayOfWeek].slice(0, 3)}
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {slotsForCurrentDay.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => onSelectSlot(s)}
                className={`px-2 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                  isEditing && selectedSlot.id === s.id
                    ? "bg-[#5553B7] text-white"
                    : "bg-white border border-[#E5E6EB] text-[#252735] hover:bg-[#EFEEF9]"
                }`}
              >
                {formatSlotTimeRange(s.start_time, s.end_time)}
              </button>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="px-3 py-2 rounded-lg bg-[#FDF2F2] border border-[#F5D0D0] text-[#B45353] text-xs font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <SelectField
          label="Day of the week"
          value={dayOfWeek}
          onChange={(v) => {
            setDayOfWeek(Number(v));
            setError(null);
          }}
          options={DAYS.map((d, idx) => ({ value: idx, label: d }))}
        />

        <SelectField
          label="Applies to"
          value={repeatType}
          onChange={(v) => {
            setRepeatType(v as "recurring" | "specific");
            setError(null);
          }}
          options={[
            { value: "recurring", label: "Every week (Recurring)" },
            { value: "specific", label: `Only ${DAYS[dayOfWeek]}, ${formatShortDate(targetDateIso)}` },
          ]}
        />

        <SelectField
          label="Time type"
          value={kind}
          onChange={(v) => {
            setKind(v as SlotKind);
            setError(null);
          }}
          options={[
            { value: "available", label: "Available study time" },
            { value: "blocked", label: "Blocked time" },
          ]}
        />

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-[15px] h-[15px] text-[#327864] flex-shrink-0" />
            <span className="text-[12px] text-[#327864]">Available: time you can study</span>
          </div>
          <div className="flex items-center gap-2">
            <Ban className="w-[15px] h-[15px] text-[#747683] flex-shrink-0" />
            <span className="text-[12px] text-[#747683]">Blocked: time to keep free of study</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <SelectField
            label="Start time"
            value={startTime}
            onChange={(v) => {
              setStartTime(v);
              setError(null);
            }}
            options={buildTimeOptions(startTime)}
          />
          <SelectField
            label="End time"
            value={endTime}
            onChange={(v) => {
              setEndTime(v);
              setError(null);
            }}
            options={buildTimeOptions(endTime)}
          />
        </div>

        <div className="flex items-center justify-between gap-2">
          <span className="text-[13px] text-[#747683]">
            {repeatType === "specific"
              ? `Only on ${DAYS[dayOfWeek]}, ${formatShortDate(targetDateIso)}`
              : `Repeats every ${DAYS[dayOfWeek]}`}
          </span>
          <span
            className={`px-[9px] py-1 rounded-[6px] text-[12px] font-medium ${
              kind === "available" ? "bg-[#EAF4EF] text-[#327864]" : "bg-[#F7F7F4] text-[#747683]"
            }`}
          >
            {formatHoursLabel(durationHours)}
          </span>
        </div>

        <div className="p-3.5 rounded-[8px] bg-[#EFEEF9] flex flex-col gap-1">
          <span className="text-[13px] font-semibold text-[#5553B7]">
            Changes affect your study windows
          </span>
          <p className="text-[12px] text-[#747683] leading-[1.45]">
            Existing study blocks keep their scheduled times. Review them in your calendar after editing availability.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-[11px] rounded-[8px] bg-[#5553B7] hover:bg-[#48469F] text-white text-[14px] font-semibold transition-colors disabled:opacity-60 cursor-pointer"
          >
            {loading ? "Saving..." : isEditing ? "Save changes" : "Add slot"}
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
            Delete slot…
          </button>
        </>
      )}
    </div>
  );
};
