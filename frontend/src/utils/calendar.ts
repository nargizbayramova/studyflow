import { apiClient } from "@/api/client";

export interface GoogleCalendarUrlParams {
  title: string;
  details?: string | null;
  date?: string; // ISO string or YYYY-MM-DD
  startTime?: string; // HH:MM or ISO datetime
  endTime?: string; // HH:MM or ISO datetime
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function toYmd(d: Date): string {
  return `${d.getFullYear()}${pad2(d.getMonth() + 1)}${pad2(d.getDate())}`;
}

function toYmdHms(d: Date): string {
  return `${toYmd(d)}T${pad2(d.getHours())}${pad2(d.getMinutes())}${pad2(d.getSeconds())}`;
}

function resolveDateTime(dateStr: string | undefined, timeOrIso: string): Date {
  if (timeOrIso.includes("T") || timeOrIso.includes("-")) {
    return new Date(timeOrIso);
  }
  const base = dateStr ? new Date(dateStr) : new Date();
  const [h, m] = timeOrIso.split(":").map(Number);
  const resolved = new Date(base);
  resolved.setHours(h || 0, m || 0, 0, 0);
  return resolved;
}

export function buildGoogleCalendarUrl({
  title,
  details,
  date,
  startTime,
  endTime,
}: GoogleCalendarUrlParams): string {
  let datesParam: string;

  if (startTime && endTime) {
    const start = resolveDateTime(date, startTime);
    const end = resolveDateTime(date, endTime);
    datesParam = `${toYmdHms(start)}/${toYmdHms(end)}`;
  } else {
    const dayDate = date ? new Date(date) : new Date();
    const ymd = toYmd(dayDate);
    datesParam = `${ymd}/${ymd}`;
  }

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: datesParam,
  });
  if (details) {
    params.set("details", details);
  }

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export async function downloadScheduleIcs(semester?: string): Promise<void> {
  const icsContent = await apiClient<string>("/schedule/export.ics", {
    params: semester ? { semester } : undefined,
  });
  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "studyflow_schedule.ics";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
