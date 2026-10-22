import React from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, BarChart3, CheckCircle2 } from "lucide-react";
import { AvailabilitySlot } from "@/features/availability/types";
import { StudyBlock } from "@/features/calendar/types";
import { Task } from "@/features/tasks/types";
import { computeWorkloadAnalytics, StressLevel } from "../utils/workloadAnalytics";

interface WorkloadAnalyticsPanelProps {
  tasks: Task[];
  studyBlocks: StudyBlock[];
  slots: AvailabilitySlot[];
}

const STRESS_BADGE: Record<StressLevel, { label: string; style: string }> = {
  high: { label: "High stress", style: "bg-[#FDF2F2] text-[#B45353] border-[#F5D0D0]" },
  moderate: { label: "Moderate", style: "bg-[#FEF6EE] text-[#B4690E] border-[#F7DEC0]" },
  low: { label: "Balanced", style: "bg-[#EAF4EF] text-[#327864] border-[#C5E3D5]" },
};

export const WorkloadAnalyticsPanel: React.FC<WorkloadAnalyticsPanelProps> = ({
  tasks,
  studyBlocks,
  slots,
}) => {
  const analytics = computeWorkloadAnalytics(tasks, studyBlocks, slots);
  const maxBarHours = Math.max(
    10,
    analytics.weeklyCapacityHours,
    ...analytics.weeks.map((w) => Math.max(w.plannedHours, w.actualHours, w.remainingTaskHours))
  );

  return (
    <div className="p-5 sm:p-6 bg-white border border-[#E5E6EB] rounded-xl flex flex-col gap-5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#5553B7]" />
            <span className="text-sm font-semibold text-[#252735]">Workload analytics</span>
          </div>
          <span className="text-xs text-[#747683]">
            Planned vs. actual study hours and upcoming 4-week stress forecast
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs">
          <span className="inline-flex items-center gap-1.5 text-[#747683]">
            <span className="w-2.5 h-2.5 rounded-xs bg-[#5553B7]" />
            Planned ({analytics.totalPlannedHours}h)
          </span>
          <span className="inline-flex items-center gap-1.5 text-[#747683]">
            <span className="w-2.5 h-2.5 rounded-xs bg-[#327864]" />
            Completed ({analytics.totalActualHours}h · {analytics.completionRatePct}%)
          </span>
          <span className="px-2.5 py-1 rounded-md bg-[#F7F7F4] text-[#252735] font-medium">
            {analytics.remainingRequiredHours}h remaining effort
          </span>
        </div>
      </div>

      {analytics.highStressWeeks.length > 0 ? (
        <div className="p-3.5 rounded-lg bg-[#FDF2F2] border border-[#F5D0D0] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-[#B45353] flex-shrink-0 mt-0.5" />
            <div className="flex flex-col gap-0.5 text-xs">
              <span className="font-semibold text-[#B45353]">
                High-stress workload alert ({analytics.highStressWeeks.length}{" "}
                {analytics.highStressWeeks.length === 1 ? "week" : "weeks"})
              </span>
              <span className="text-[#747683]">
                {analytics.highStressWeeks
                  .map((w) => `${w.label} (${w.dateRangeLabel}): ${w.warningReason}`)
                  .join(" · ")}
              </span>
            </div>
          </div>
          <Link
            to="/calendar"
            className="text-xs font-semibold text-[#B45353] hover:underline whitespace-nowrap self-end sm:self-center"
          >
            Rebalance in calendar →
          </Link>
        </div>
      ) : (
        <div className="px-3.5 py-2.5 rounded-lg bg-[#EAF4EF] border border-[#C5E3D5] flex items-center gap-2 text-xs text-[#327864]">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>Your upcoming 4-week study workload fits within your available capacity.</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {analytics.weeks.map((week) => {
          const plannedPct = Math.min(100, Math.round((week.plannedHours / maxBarHours) * 100));
          const actualPct = Math.min(100, Math.round((week.actualHours / maxBarHours) * 100));
          const badge = STRESS_BADGE[week.stressLevel];

          return (
            <div
              key={week.weekStart}
              className={`p-4 rounded-lg border flex flex-col justify-between gap-3 ${
                week.isHighStress
                  ? "border-[#F5D0D0] bg-[#FDF2F2]/30"
                  : "border-[#E5E6EB] bg-[#F7F7F4]/50"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-[#252735]">{week.label}</span>
                  <span className="text-[11px] text-[#747683]">{week.dateRangeLabel}</span>
                </div>
                <span className={`px-2 py-0.5 rounded border text-[10px] font-semibold ${badge.style}`}>
                  {badge.label}
                </span>
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between text-[11px] text-[#747683]">
                    <span>Planned</span>
                    <span className="font-medium text-[#252735]">{week.plannedHours}h</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#E5E6EB]/70 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#5553B7] transition-all duration-300"
                      style={{ width: `${week.plannedHours > 0 ? Math.max(6, plannedPct) : 0}%` }}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <div className="flex justify-between text-[11px] text-[#747683]">
                    <span>Actual done</span>
                    <span className="font-medium text-[#327864]">{week.actualHours}h</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#E5E6EB]/70 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#327864] transition-all duration-300"
                      style={{ width: `${week.actualHours > 0 ? Math.max(6, actualPct) : 0}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-[#E5E6EB] flex items-center justify-between text-[11px] text-[#747683]">
                <span>
                  {week.tasksDueCount} {week.tasksDueCount === 1 ? "deadline" : "deadlines"} (
                  {week.remainingTaskHours}h left)
                </span>
                <span>Cap: {week.capacityHours}h</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
