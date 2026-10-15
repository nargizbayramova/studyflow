import React from "react";
import { Sliders, Clock, Sparkles } from "lucide-react";

export const AcademicPreferencesCard: React.FC = () => {
  return (
    <div className="bg-white border border-[#E5E6EB] rounded-xl p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-1">
        <Sliders className="w-4 h-4 text-[#5553B7]" />
        <h3 className="text-sm font-bold text-[#252735]">Study Pacing & Scheduler Preferences</h3>
      </div>
      <p className="text-xs text-[#747683] mb-5">
        Configure how the AI scheduler generates and balances your weekly study blocks.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-xl border border-[#E5E6EB] bg-[#F7F7F4]/50 flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-xs text-[#747683] font-medium">
            <Clock className="w-3.5 h-3.5 text-[#5553B7]" /> Session Length
          </div>
          <span className="text-sm font-bold text-[#252735]">50 minutes</span>
          <span className="text-[11px] text-[#A0A2B1]">With 10 min break intervals</span>
        </div>

        <div className="p-3.5 rounded-xl border border-[#E5E6EB] bg-[#F7F7F4]/50 flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-xs text-[#747683] font-medium">
            <Sparkles className="w-3.5 h-3.5 text-[#5553B7]" /> Weekly Target
          </div>
          <span className="text-sm font-bold text-[#252735]">20 hrs / week</span>
          <span className="text-[11px] text-[#A0A2B1]">Distributed over active days</span>
        </div>

        <div className="p-3.5 rounded-xl border border-[#E5E6EB] bg-[#F7F7F4]/50 flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-xs text-[#747683] font-medium">
            <Sliders className="w-3.5 h-3.5 text-[#5553B7]" /> Scheduling Strategy
          </div>
          <span className="text-sm font-bold text-[#252735]">Balanced Load</span>
          <span className="text-[11px] text-[#A0A2B1]">Prioritizes upcoming deadlines</span>
        </div>
      </div>
    </div>
  );
};
