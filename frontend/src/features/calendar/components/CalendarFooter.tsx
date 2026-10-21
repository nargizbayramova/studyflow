import React from "react";
import { Link } from "react-router-dom";
import { Flag } from "lucide-react";

export const CalendarFooter: React.FC = () => {
  return (
    <div className="flex flex-col gap-3 pt-1">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-4 sm:gap-5 text-[12px] text-[#252735]">
          <div className="flex items-center gap-1.5">
            <Flag className="w-3.5 h-3.5 text-[#747683]" />
            <span>Task deadline</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-[3px] bg-[#EFEEF9] border border-[#5553B7] inline-block" />
            <span>Study session</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-[3px] bg-[#EAF4EF] border border-dashed border-[#327864] inline-block" />
            <span>Recurring available time</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-[3px] bg-[#EFECE8] inline-block" />
            <span>Recurring blocked time</span>
          </div>
        </div>

        <Link
          to="/availability"
          className="text-[12px] font-medium text-[#5553B7] hover:underline self-start sm:self-auto"
        >
          Edit availability →
        </Link>
      </div>

      <p className="text-[13px] text-[#747683]">
        Choose an open time to add a study block, or select a session to view, reschedule, or mark it done. Planning is manual — you’re in control.
      </p>
    </div>
  );
};
