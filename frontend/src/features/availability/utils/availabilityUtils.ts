import { AvailabilitySlot, StudyBlock } from "@/types";

export const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export function toIsoDate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function getMondayOfWeek(baseDate: Date): Date {
  const d = new Date(baseDate);
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function getWeekDatesFromMonday(monday: Date): Date[] {
  return Array.from({ length: 7 }, (_, idx) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + idx);
    return d;
  });
}

export function formatWeekRange(weekDates: Date[]): string {
  const start = weekDates[0];
  const end = weekDates[6];
  const sMonth = start.toLocaleDateString("en-US", { month: "short" });
  const eMonth = end.toLocaleDateString("en-US", { month: "short" });
  if (sMonth === eMonth) {
    return `${sMonth} ${start.getDate()}–${end.getDate()}, ${end.getFullYear()}`;
  }
  return `${sMonth} ${start.getDate()}–${eMonth} ${end.getDate()}, ${end.getFullYear()}`;
}

export function formatShortDate(isoDate: string): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function parseMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

export function normalizeTimeValue(timeStr: string): string {
  const parts = timeStr.split(":");
  return `${(parts[0] || "00").padStart(2, "0")}:${(parts[1] || "00").padStart(2, "0")}`;
}

export function getSlotDurationHours(startTime: string, endTime: string): number {
  const diff = parseMinutes(endTime) - parseMinutes(startTime);
  return Math.max(0, Math.round((diff / 60) * 10) / 10);
}

export function formatHoursCompact(hours: number): string {
  const rounded = Math.round(hours * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

export function formatHoursLabel(hours: number): string {
  const formatted = formatHoursCompact(hours);
  return `${formatted} ${hours === 1 ? "hour" : "hours"}`;
}

export function formatSingleTime12h(timeStr: string): { time: string; period: string; full: string } {
  const [hStr, mStr] = timeStr.split(":");
  const h = parseInt(hStr, 10);
  const m = mStr || "00";
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return {
    time: `${h12}:${m}`,
    period,
    full: `${h12}:${m} ${period}`,
  };
}

export function formatSlotTimeRange(startTime: string, endTime: string): string {
  const start = formatSingleTime12h(startTime);
  const end = formatSingleTime12h(endTime);
  return start.period === end.period
    ? `${start.time}–${end.full}`
    : `${start.full}–${end.full}`;
}

export const TIME_OPTIONS: { value: string; label: string }[] = Array.from(
  { length: 35 },
  (_, idx) => {
    const totalMinutes = 6 * 60 + idx * 30;
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    const value = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    return { value, label: formatSingleTime12h(value).full };
  }
);

export function buildTimeOptions(currentValue: string): { value: string; label: string }[] {
  if (TIME_OPTIONS.some((o) => o.value === currentValue)) {
    return TIME_OPTIONS;
  }
  return [
    ...TIME_OPTIONS,
    { value: currentValue, label: formatSingleTime12h(currentValue).full },
  ].sort((a, b) => parseMinutes(a.value) - parseMinutes(b.value));
}

export function getEffectiveSlotsForWeek(
  slots: AvailabilitySlot[],
  weekDates: Date[] | null
): AvailabilitySlot[] {
  if (!weekDates) {
    return slots.filter((s) => !s.specific_date);
  }
  const weekIsoSet = new Set(weekDates.map(toIsoDate));
  return slots.filter((s) => !s.specific_date || weekIsoSet.has(s.specific_date));
}

export function computeSlotStats(slots: AvailabilitySlot[]) {
  let availableHours = 0;
  let blockedHours = 0;
  let availableCount = 0;
  let blockedCount = 0;

  for (const s of slots) {
    const duration = getSlotDurationHours(s.start_time, s.end_time);
    if (s.kind === "available") {
      availableHours += duration;
      availableCount += 1;
    } else {
      blockedHours += duration;
      blockedCount += 1;
    }
  }

  return { availableHours, blockedHours, availableCount, blockedCount };
}

export function computePlannedHoursForWeek(
  studyBlocks: StudyBlock[],
  weekDates: Date[]
): number {
  const weekStart = new Date(weekDates[0]);
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekDates[6]);
  weekEnd.setHours(23, 59, 59, 999);

  let weekHrs = 0;
  for (const block of studyBlocks) {
    if (block.status === "missed") continue;
    const start = new Date(block.start_at);
    const end = new Date(block.end_at);
    if (start >= weekStart && start <= weekEnd) {
      weekHrs += Math.max(0, (end.getTime() - start.getTime()) / 3_600_000);
    }
  }
  return weekHrs;
}

export function findOverlappingSlot(
  candidate: {
    day_of_week: number;
    specific_date?: string | null;
    start_time: string;
    end_time: string;
  },
  existingSlots: AvailabilitySlot[],
  excludeSlotId?: number | null
): AvailabilitySlot | null {
  const candStart = parseMinutes(candidate.start_time);
  const candEnd = parseMinutes(candidate.end_time);
  if (candEnd <= candStart) return null;

  for (const s of existingSlots) {
    if (excludeSlotId != null && s.id === excludeSlotId) continue;
    if (s.day_of_week !== candidate.day_of_week) continue;

    // Slots with different explicit calendar dates do not share a day
    if (candidate.specific_date && s.specific_date && candidate.specific_date !== s.specific_date) {
      continue;
    }

    const sStart = parseMinutes(s.start_time);
    const sEnd = parseMinutes(s.end_time);
    if (candStart < sEnd && candEnd > sStart) {
      return s;
    }
  }
  return null;
}
