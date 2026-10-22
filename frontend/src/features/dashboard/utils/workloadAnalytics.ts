import { AvailabilitySlot } from "@/features/availability/types";
import { StudyBlock } from "@/features/calendar/types";
import { Task } from "@/features/tasks/types";
import {
  getMondayOfWeek,
  getSlotDurationHours,
  toIsoDate,
} from "@/features/availability/utils/availabilityUtils";

export type StressLevel = "low" | "moderate" | "high";

export interface WeeklyWorkloadItem {
  weekStart: string;
  weekEnd: string;
  label: string;
  dateRangeLabel: string;
  plannedHours: number;
  actualHours: number;
  remainingTaskHours: number;
  capacityHours: number;
  tasksDueCount: number;
  stressLevel: StressLevel;
  isHighStress: boolean;
  warningReason: string | null;
}

export interface WorkloadAnalyticsSummary {
  totalPlannedHours: number;
  totalActualHours: number;
  completionRatePct: number;
  remainingRequiredHours: number;
  weeklyCapacityHours: number;
  highStressWeeks: WeeklyWorkloadItem[];
  weeks: WeeklyWorkloadItem[];
}

function round1(val: number): number {
  return Math.round(val * 10) / 10;
}

export function computeWorkloadAnalytics(
  tasks: Task[],
  studyBlocks: StudyBlock[],
  slots: AvailabilitySlot[],
  now: Date = new Date()
): WorkloadAnalyticsSummary {
  const monday = getMondayOfWeek(now);

  let baseWeeklyCap = 0;
  const dateAvailMap = new Map<string, number>();

  for (const s of slots) {
    if (s.kind !== "available") continue;
    const hrs = getSlotDurationHours(s.start_time, s.end_time);
    if (s.specific_date) {
      dateAvailMap.set(s.specific_date, (dateAvailMap.get(s.specific_date) || 0) + hrs);
    } else {
      baseWeeklyCap += hrs;
    }
  }
  baseWeeklyCap = round1(baseWeeklyCap);

  const completedByTask = new Map<number, number>();
  let totalPlanned = 0;
  let totalActual = 0;

  for (const b of studyBlocks) {
    const startMs = new Date(b.start_at).getTime();
    const endMs = new Date(b.end_at).getTime();
    const dur = Math.max(0, (endMs - startMs) / 3_600_000);
    if (b.status !== "missed") {
      totalPlanned += dur;
    }
    if (b.status === "completed") {
      totalActual += dur;
      completedByTask.set(b.task_id, (completedByTask.get(b.task_id) || 0) + dur);
    }
  }

  let remainingRequired = 0;
  for (const t of tasks) {
    if (t.status !== "completed") {
      const done = completedByTask.get(t.id) || 0;
      remainingRequired += Math.max(0, t.estimated_hours - done);
    }
  }

  const weeks: WeeklyWorkloadItem[] = [];

  for (let wIdx = 0; wIdx < 4; wIdx++) {
    const wStart = new Date(monday);
    wStart.setDate(monday.getDate() + wIdx * 7);
    wStart.setHours(0, 0, 0, 0);

    const wEnd = new Date(wStart);
    wEnd.setDate(wStart.getDate() + 6);
    wEnd.setHours(23, 59, 59, 999);

    const shortRange = `${wStart.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })}–${wEnd.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;

    const label = wIdx === 0 ? "This week" : wIdx === 1 ? "Next week" : shortRange;

    let wPlanned = 0;
    let wActual = 0;
    for (const b of studyBlocks) {
      const bStart = new Date(b.start_at);
      if (bStart >= wStart && bStart <= wEnd) {
        const dur = Math.max(
          0,
          (new Date(b.end_at).getTime() - bStart.getTime()) / 3_600_000
        );
        if (b.status !== "missed") wPlanned += dur;
        if (b.status === "completed") wActual += dur;
      }
    }

    const wTasks = tasks.filter((t) => {
      if (t.status === "completed") return false;
      const due = new Date(t.due_date);
      return due >= wStart && due <= wEnd;
    });

    const wRemTaskHrs = wTasks.reduce((acc, t) => {
      const done = completedByTask.get(t.id) || 0;
      return acc + Math.max(0, t.estimated_hours - done);
    }, 0);

    const hasHighStakes = wTasks.some(
      (t) => t.type === "exam" || (t.weight_percent ?? 0) >= 25
    );

    let wCap = baseWeeklyCap;
    for (let dOff = 0; dOff < 7; dOff++) {
      const dCur = new Date(wStart);
      dCur.setDate(wStart.getDate() + dOff);
      wCap += dateAvailMap.get(toIsoDate(dCur)) || 0;
    }

    const demand = Math.max(wPlanned, wRemTaskHrs);
    let stressLevel: StressLevel = "low";
    let warningReason: string | null = null;

    if (wCap > 0 && demand > wCap) {
      stressLevel = "high";
      warningReason = `${round1(demand)}h workload exceeds ${round1(wCap)}h available capacity`;
    } else if (demand >= 15) {
      stressLevel = "high";
      warningReason = `Heavy workload (${round1(demand)}h) in one week`;
    } else if (wTasks.length >= 3) {
      stressLevel = "high";
      warningReason = `${wTasks.length} deadlines clustered this week`;
    } else if (hasHighStakes && demand >= 8) {
      stressLevel = "high";
      warningReason = "High-stakes exam or major milestone due";
    } else if (
      demand >= 8 ||
      wTasks.length >= 2 ||
      (wCap > 0 && demand >= 0.6 * wCap)
    ) {
      stressLevel = "moderate";
    }

    weeks.push({
      weekStart: toIsoDate(wStart),
      weekEnd: toIsoDate(wEnd),
      label,
      dateRangeLabel: shortRange,
      plannedHours: round1(wPlanned),
      actualHours: round1(wActual),
      remainingTaskHours: round1(wRemTaskHrs),
      capacityHours: round1(wCap),
      tasksDueCount: wTasks.length,
      stressLevel,
      isHighStress: stressLevel === "high",
      warningReason,
    });
  }

  const completionRatePct =
    totalPlanned > 0 ? Math.min(100, Math.round((totalActual / totalPlanned) * 100)) : 0;

  return {
    totalPlannedHours: round1(totalPlanned),
    totalActualHours: round1(totalActual),
    completionRatePct,
    remainingRequiredHours: round1(remainingRequired),
    weeklyCapacityHours: baseWeeklyCap,
    highStressWeeks: weeks.filter((w) => w.isHighStress),
    weeks,
  };
}
