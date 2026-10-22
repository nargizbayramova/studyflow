import React from "react";
import { Plus, Download } from "lucide-react";
import { downloadScheduleIcs } from "@/shared/lib/calendar";
import { CalendarActionMenu } from "./CalendarActionMenu";

interface Props {
  onAddBlock: () => void;
  onGenerateSchedule: () => void;
  onRebalanceSchedule: () => void;
  isGenerating: boolean;
  isRebalancing: boolean;
}

/** Row 1 of the calendar header: page title and primary actions. */
export const CalendarTitleBar: React.FC<Props> = ({ onAddBlock, ...menu }) => (
  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
    <div className="flex flex-col gap-1">
      <h1 className="text-2xl sm:text-[30px] font-normal leading-[1.45] text-[#252735] tracking-tight">
        Study calendar
      </h1>
      <p className="text-xs sm:text-[14px] text-[#747683]">
        Make a realistic plan. Schedule study blocks around your available time.
      </p>
    </div>

    <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
      <button
        type="button"
        onClick={() => void downloadScheduleIcs()}
        title="Import into Google Calendar -> Settings -> Import & Export"
        className="inline-flex items-center gap-1.5 px-3 py-[10px] rounded-[8px] border border-[#E5E6EB] bg-white hover:bg-[#F7F7F4] text-[#252735] text-xs sm:text-[13px] font-semibold transition-colors cursor-pointer shadow-2xs"
      >
        <Download className="w-3.5 h-3.5 text-[#747683]" />
        <span>Export .ics</span>
      </button>

      <CalendarActionMenu {...menu} />

      <button
        type="button"
        onClick={onAddBlock}
        className="inline-flex items-center justify-center gap-2 px-3.5 sm:px-4 py-[10px] rounded-[8px] bg-[#5553B7] hover:bg-[#48469F] text-white text-xs sm:text-[14px] font-semibold transition-colors cursor-pointer shadow-2xs"
      >
        <Plus className="w-4 h-4 flex-shrink-0" />
        <span>Schedule study block</span>
      </button>
    </div>
  </div>
);
