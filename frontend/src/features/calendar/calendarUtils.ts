import React from "react";
import { AvailabilitySlot, StudyBlock, Task } from "@/types";

export type CalendarViewMode = "day" | "week" | "month";

export const START_HOUR = 9;
export const END_HOUR = 21;
export const CALENDAR_HOURS = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
export const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function toDateKey(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

export function toIsoDateStr(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function getSlotsForCalendarDate(
  slots: AvailabilitySlot[],
  date: Date
): AvailabilitySlot[] {
  const dayIndex = getDayOfWeekIndex(date);
  const isoDate = toIsoDateStr(date);
  return slots.filter(
    (s) => (!s.specific_date && s.day_of_week === dayIndex) || s.specific_date === isoDate
  );
}

export function isToday(d: Date): boolean {
  return toDateKey(d) === toDateKey(new Date());
}

/** Convert JS Date.getDay() (0=Sun..6=Sat) to 0=Mon..6=Sun */
export function getDayOfWeekIndex(d: Date): number {
  return (d.getDay() + 6) % 7;
}

export function parseTimeHours(timeStr: string): number {
  const [h, m] = timeStr.split(":").map(Number);
  return (h || 0) + (m || 0) / 60;
}

/** Blend hex color with white into a 100% opaque pastel rgb() string */
export function toSolidPastel(hex: string, ratio = 0.14): string {
  const clean = hex.replace("#", "");
  if (clean.length !== 6) return "#EFEEF9";
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  const mix = (c: number) => Math.round(255 * (1 - ratio) + c * ratio);
  return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`;
}

export function groupBlocksByDate(blocks: StudyBlock[]): Map<string, StudyBlock[]> {
  const map = new Map<string, StudyBlock[]>();
  for (const block of blocks) {
    const key = toDateKey(block.start_at);
    const list = map.get(key);
    if (list) list.push(block);
    else map.set(key, [block]);
  }
  return map;
}

export function groupTasksByDueDate(tasks: Task[]): Map<string, Task[]> {
  const map = new Map<string, Task[]>();
  for (const task of tasks) {
    const key = toDateKey(task.due_date);
    const list = map.get(key);
    if (list) list.push(task);
    else map.set(key, [task]);
  }
  return map;
}

export function sumBlocksHours(blocks: StudyBlock[]): number {
  const total = blocks.reduce(
    (acc, b) => acc + (new Date(b.end_at).getTime() - new Date(b.start_at).getTime()) / 3_600_000,
    0
  );
  return Math.round(total * 10) / 10;
}

export function computeWeeklyAvailabilitySummary(
  slots: AvailabilitySlot[],
  weekDays?: Date[]
) {
  const weekIsoSet = weekDays ? new Set(weekDays.map(toIsoDateStr)) : null;
  let availableHours = 0;
  let blockedHours = 0;
  for (const s of slots) {
    if (s.specific_date && (!weekIsoSet || !weekIsoSet.has(s.specific_date))) continue;
    const hrs = Math.max(0, parseTimeHours(s.end_time) - parseTimeHours(s.start_time));
    if (s.kind === "available") availableHours += hrs;
    else blockedHours += hrs;
  }
  return {
    availableHours: Math.round(availableHours * 10) / 10,
    blockedHours: Math.round(blockedHours * 10) / 10,
  };
}

export function shiftCalendarDate(date: Date, mode: CalendarViewMode, step: -1 | 1): Date {
  const next = new Date(date);
  if (mode === "day") next.setDate(next.getDate() + step);
  else if (mode === "week") next.setDate(next.getDate() + step * 7);
  else next.setMonth(next.getMonth() + step);
  return next;
}

export function getWeekDays(currentDate: Date): Date[] {
  const d = new Date(currentDate);
  const day = d.getDay();
  const monday = new Date(d.setDate(d.getDate() - day + (day === 0 ? -6 : 1)));
  monday.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, i) => {
    const next = new Date(monday);
    next.setDate(monday.getDate() + i);
    return next;
  });
}

export function getMonthGridDays(currentDate: Date): { date: Date; isCurrentMonth: boolean }[] {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const startDayOfWeek = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days: { date: Date; isCurrentMonth: boolean }[] = [];

  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    days.push({ date: new Date(year, month, -i), isCurrentMonth: false });
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push({ date: new Date(year, month, i), isCurrentMonth: true });
  }
  const remaining = (7 - (days.length % 7)) % 7;
  for (let i = 1; i <= remaining; i++) {
    days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
  }
  return days;
}

export function getViewBlocks(
  blocks: StudyBlock[],
  currentDate: Date,
  viewMode: CalendarViewMode,
  weekDays: Date[]
): StudyBlock[] {
  if (viewMode === "day") {
    const targetKey = toDateKey(currentDate);
    return blocks.filter((b) => toDateKey(b.start_at) === targetKey);
  }
  if (viewMode === "week") {
    const start = weekDays[0].getTime();
    const end = new Date(weekDays[6]).setHours(23, 59, 59, 999);
    return blocks.filter((b) => {
      const t = new Date(b.start_at).getTime();
      return t >= start && t <= end;
    });
  }
  const m = currentDate.getMonth();
  const y = currentDate.getFullYear();
  return blocks.filter((b) => {
    const bd = new Date(b.start_at);
    return bd.getMonth() === m && bd.getFullYear() === y;
  });
}

export function formatCalendarTitle(
  currentDate: Date,
  viewMode: CalendarViewMode,
  weekDays: Date[]
): string {
  if (viewMode === "day") {
    return currentDate.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }
  if (viewMode === "month") {
    return currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  }
  const start = weekDays[0];
  const end = weekDays[6];
  const sMonth = start.toLocaleDateString("en-US", { month: "long" });
  const eMonth = end.toLocaleDateString("en-US", { month: "long" });
  if (sMonth === eMonth) {
    return `${sMonth} ${start.getDate()}–${end.getDate()}, ${end.getFullYear()}`;
  }
  return `${sMonth} ${start.getDate()}–${eMonth} ${end.getDate()}, ${end.getFullYear()}`;
}

export function formatHourLabel(h: number): string {
  return h === 12 ? "12 PM" : h > 12 ? `${h - 12} PM` : `${h} AM`;
}

export function formatTimeRange(startIso: string, endIso: string): string {
  const fmt = (iso: string) =>
    new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return `${fmt(startIso)}–${fmt(endIso)}`;
}

export function toLocalDatetimeInput(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}

export function getInitialBlockTimes(block: StudyBlock | null, initialSlot: Date | null) {
  if (block) {
    return {
      start: toLocalDatetimeInput(new Date(block.start_at)),
      end: toLocalDatetimeInput(new Date(block.end_at)),
    };
  }
  const base = initialSlot ? new Date(initialSlot) : new Date();
  if (!initialSlot) base.setMinutes(0, 0, 0);
  return {
    start: toLocalDatetimeInput(base),
    end: toLocalDatetimeInput(new Date(base.getTime() + 3_600_000)),
  };
}

export function getSlotFromClick(
  e: React.MouseEvent<HTMLElement>,
  baseDate: Date,
  hourHeight: number
): Date {
  const rect = e.currentTarget.getBoundingClientRect();
  const clickedHour = Math.floor((e.clientY - rect.top) / hourHeight) + START_HOUR;
  const slot = new Date(baseDate);
  slot.setHours(clickedHour, 0, 0, 0);
  return slot;
}

export function getCurrentTimeOffset(hourHeight: number): number | null {
  const now = new Date();
  const nowHours = now.getHours() + now.getMinutes() / 60;
  return nowHours >= START_HOUR && nowHours <= END_HOUR
    ? (nowHours - START_HOUR) * hourHeight
    : null;
}
