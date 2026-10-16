import React from "react";
import { StudyBlock } from "@/types";

export type CalendarViewMode = "day" | "week" | "month";

export const CALENDAR_HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22];
export const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function toDateKey(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

export function isToday(d: Date): boolean {
  return toDateKey(d) === toDateKey(new Date());
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

export function sumBlocksHours(blocks: StudyBlock[]): number {
  const total = blocks.reduce(
    (acc, b) => acc + (new Date(b.end_at).getTime() - new Date(b.start_at).getTime()) / 3_600_000,
    0
  );
  return Math.round(total * 10) / 10;
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

export function getViewScheduledHours(
  blocks: StudyBlock[],
  currentDate: Date,
  viewMode: CalendarViewMode,
  weekDays: Date[]
): number {
  if (viewMode === "day") {
    const targetKey = toDateKey(currentDate);
    return sumBlocksHours(blocks.filter((b) => toDateKey(b.start_at) === targetKey));
  }
  if (viewMode === "week") {
    const start = weekDays[0].getTime();
    const end = new Date(weekDays[6]).setHours(23, 59, 59, 999);
    return sumBlocksHours(
      blocks.filter((b) => {
        const t = new Date(b.start_at).getTime();
        return t >= start && t <= end;
      })
    );
  }
  const m = currentDate.getMonth();
  const y = currentDate.getFullYear();
  return sumBlocksHours(
    blocks.filter((b) => {
      const bd = new Date(b.start_at);
      return bd.getMonth() === m && bd.getFullYear() === y;
    })
  );
}

export function formatCalendarTitle(
  currentDate: Date,
  viewMode: CalendarViewMode,
  weekDays: Date[]
): string {
  if (viewMode === "day") {
    return currentDate.toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }
  if (viewMode === "month") {
    return currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  }
  const start = weekDays[0];
  const end = weekDays[6];
  const sMonth = start.toLocaleDateString("en-US", { month: "short" });
  return `Week of ${sMonth} ${start.getDate()}–${end.getDate()}, ${end.getFullYear()}`;
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
  const clickedHour = Math.floor((e.clientY - rect.top) / hourHeight) + 8;
  const slot = new Date(baseDate);
  slot.setHours(clickedHour, 0, 0, 0);
  return slot;
}

export function getCurrentTimeOffset(hourHeight: number): number | null {
  const now = new Date();
  const nowHours = now.getHours() + now.getMinutes() / 60;
  return nowHours >= 8 && nowHours <= 22 ? (nowHours - 8) * hourHeight : null;
}
