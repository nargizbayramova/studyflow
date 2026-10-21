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

export function computePlannedHoursThisWeek(studyBlocks: StudyBlock[]): number {
  const now = new Date();
  const day = now.getDay();
  const diffToMonday = (day === 0 ? -6 : 1) - day;
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() + diffToMonday);
  weekStart.setHours(0, 0, 0, 0);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);

  let weekHrs = 0;
  let totalActiveHrs = 0;

  for (const block of studyBlocks) {
    if (block.status === "missed") continue;
    const start = new Date(block.start_at);
    const end = new Date(block.end_at);
    const hrs = Math.max(0, (end.getTime() - start.getTime()) / (1000 * 60 * 60));
    totalActiveHrs += hrs;
    if (start >= weekStart && start < weekEnd) {
      weekHrs += hrs;
    }
  }

  return weekHrs > 0 ? weekHrs : totalActiveHrs;
}
