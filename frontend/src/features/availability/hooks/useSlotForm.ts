import React, { useState } from "react";
import { AvailabilitySlot, SlotCreatePayload, SlotKind, SlotUpdatePayload } from "@/features/availability/types";
import {
  findOverlappingSlot,
  formatSlotTimeRange,
  getSlotDurationHours,
  normalizeTimeValue,
  parseMinutes,
  toIsoDate,
} from "../utils/availabilityUtils";

export type RepeatType = "recurring" | "specific";

interface Options {
  selectedSlot: AvailabilitySlot | null;
  isEditing: boolean;
  defaultDay: number;
  defaultKind: SlotKind;
  defaultRepeat: RepeatType;
  weekDates: Date[];
  pool: AvailabilitySlot[];
  onCreate: (data: SlotCreatePayload) => Promise<void>;
  onUpdate: (id: number, data: SlotUpdatePayload) => Promise<void>;
}

/** Owns the slot editor's form state, validation (incl. overlap check) and submit. */
export function useSlotForm(o: Options) {
  const { selectedSlot: slot, isEditing } = o;
  const [dayOfWeek, setDayOfWeek] = useState(isEditing && slot ? slot.day_of_week : o.defaultDay);
  const [kind, setKind] = useState<SlotKind>(isEditing && slot ? slot.kind : o.defaultKind);
  const [repeatType, setRepeatType] = useState<RepeatType>(
    isEditing && slot ? (slot.specific_date ? "specific" : "recurring") : o.defaultRepeat
  );
  const [startTime, setStartTime] = useState(
    isEditing && slot ? normalizeTimeValue(slot.start_time) : o.defaultKind === "blocked" ? "10:00" : "16:00"
  );
  const [endTime, setEndTime] = useState(
    isEditing && slot ? normalizeTimeValue(slot.end_time) : o.defaultKind === "blocked" ? "12:00" : "19:00"
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Any field edit clears a stale validation error.
  const field =
    <T,>(set: (v: T) => void) =>
    (v: T) => {
      set(v);
      setError(null);
    };

  const targetWeekDate = o.weekDates[dayOfWeek] || o.weekDates[0];
  const targetDateIso =
    isEditing && slot?.specific_date && slot.day_of_week === dayOfWeek
      ? slot.specific_date
      : toIsoDate(targetWeekDate);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (parseMinutes(startTime) >= parseMinutes(endTime)) {
      setError("End time must be after start time");
      return;
    }
    const specific_date = repeatType === "specific" ? targetDateIso : null;
    const overlap = findOverlappingSlot(
      { day_of_week: dayOfWeek, specific_date, start_time: startTime, end_time: endTime },
      o.pool,
      isEditing && slot ? slot.id : null
    );
    if (overlap) {
      const range = formatSlotTimeRange(overlap.start_time, overlap.end_time);
      setError(`Time window overlaps with existing ${overlap.kind} slot (${range}). Slots cannot overlap.`);
      return;
    }

    setLoading(true);
    setError(null);
    const payload = {
      day_of_week: dayOfWeek,
      specific_date,
      kind,
      start_time: `${startTime}:00`,
      end_time: `${endTime}:00`,
    };
    try {
      if (isEditing && slot) await o.onUpdate(slot.id, payload);
      else await o.onCreate(payload);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save slot");
    } finally {
      setLoading(false);
    }
  };

  return {
    dayOfWeek,
    kind,
    repeatType,
    startTime,
    endTime,
    loading,
    error,
    targetDateIso,
    durationHours: getSlotDurationHours(startTime, endTime),
    setDayOfWeek: field(setDayOfWeek),
    setKind: field(setKind),
    setRepeatType: field(setRepeatType),
    setStartTime: field(setStartTime),
    setEndTime: field(setEndTime),
    submit,
  };
}
