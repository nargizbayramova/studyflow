import React from "react";

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
