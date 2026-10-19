import React from "react";
import { UrgencyLevel } from "@/types";

interface PriorityBadgeProps {
  priority: "high" | "medium" | "low" | string;
  className?: string;
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority, className = "" }) => {
  const p = priority.toLowerCase();

  const styles = {
    high: "bg-[#FCF3E3] text-[#98651E]",
    medium: "bg-[#F7F7F4] text-[#747683]",
    low: "bg-[#EAF4F2] text-[#428A86]",
  }[p] || "bg-[#F7F7F4] text-[#747683]";

  const label = p.charAt(0).toUpperCase() + p.slice(1);

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${styles} ${className}`}
    >
      {label}
    </span>
  );
};

const URGENCY_STYLES: Record<UrgencyLevel, string> = {
  CRITICAL: "bg-red-50 text-red-700 border border-red-200",
  HIGH: "bg-amber-50 text-amber-700 border border-amber-200",
  MEDIUM: "bg-blue-50 text-blue-700 border border-blue-200",
  LOW: "bg-slate-100 text-slate-600 border border-slate-200",
};

export const UrgencyBadge: React.FC<{
  urgency?: UrgencyLevel | null;
  rank?: number | null;
  className?: string;
}> = ({ urgency, rank, className = "" }) => {
  if (!urgency) return null;
  const key = urgency.toUpperCase() as UrgencyLevel;
  const style = URGENCY_STYLES[key] || URGENCY_STYLES.MEDIUM;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold tracking-wide ${style} ${className}`}
    >
      {rank != null && <span>#{rank}</span>}
      <span>{key}</span>
    </span>
  );
};
