import React, { useState } from "react";
import { Sparkles, RefreshCw, ChevronDown, Loader2 } from "lucide-react";

interface CalendarActionMenuProps {
  onGenerateSchedule: () => void;
  onRebalanceSchedule: () => void;
  isGenerating: boolean;
  isRebalancing: boolean;
}

export const CalendarActionMenu: React.FC<CalendarActionMenuProps> = ({
  onGenerateSchedule,
  onRebalanceSchedule,
  isGenerating,
  isRebalancing,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [topPos, setTopPos] = useState<number | null>(null);
  const busy = isGenerating || isRebalancing;

  const handleToggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTopPos(rect.bottom + 8);
    setIsOpen((prev) => !prev);
  };

  const handleAction = (action: () => void) => {
    setIsOpen(false);
    action();
  };

  return (
    <div className="relative inline-block text-left">
      {/* Trigger Button */}
      <button
        type="button"
        onClick={handleToggle}
        disabled={busy}
        className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-[10px] rounded-[8px] border border-[#5553B7] bg-[#EFEEF9] hover:bg-[#E2E0F5] text-[#5553B7] text-xs sm:text-[13px] font-semibold transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed shadow-2xs"
      >
        {busy ? (
          <Loader2 className="w-4 h-4 animate-spin text-[#5553B7]" />
        ) : (
          <Sparkles className="w-4 h-4 text-[#5553B7]" />
        )}
        <span>
          {isGenerating ? "Generating..." : isRebalancing ? "Rebalancing..." : "AI Schedule"}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-[#5553B7] transition-transform duration-150 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Click-outside backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-20 cursor-default"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Popover Dropdown Menu (Centered on mobile, right-aligned on sm+) */}
      {isOpen && (
        <div
          style={topPos && typeof window !== "undefined" && window.innerWidth < 640 ? { top: `${topPos}px` } : undefined}
          className="fixed left-3 right-3 sm:absolute sm:inset-x-auto sm:right-0 sm:top-full mt-2 sm:mt-2 w-auto sm:w-80 rounded-xl bg-white border border-[#E5E6EB] shadow-xl py-1.5 z-30 focus:outline-none"
        >
          <div className="px-3 py-1.5 border-b border-[#E5E6EB]/60">
            <span className="text-[11px] font-semibold text-[#747683] uppercase tracking-wider">
              Smart Scheduling
            </span>
          </div>

          <button
            type="button"
            onClick={() => handleAction(onGenerateSchedule)}
            className="w-full flex items-start gap-3 px-3.5 py-2.5 text-left hover:bg-[#EFEEF9]/60 transition-colors cursor-pointer group"
          >
            <div className="p-1.5 rounded-lg bg-[#EFEEF9] text-[#5553B7] group-hover:bg-[#5553B7] group-hover:text-white transition-colors mt-0.5">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-[#252735]">
                Generate AI schedule
              </span>
              <span className="text-[11px] text-[#747683] leading-snug">
                Auto-distribute study blocks across your free hours
              </span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleAction(onRebalanceSchedule)}
            className="w-full flex items-start gap-3 px-3.5 py-2.5 text-left hover:bg-[#EFEEF9]/60 transition-colors cursor-pointer group"
          >
            <div className="p-1.5 rounded-lg bg-[#F7F7F4] text-[#252735] group-hover:bg-[#5553B7] group-hover:text-white transition-colors mt-0.5">
              <RefreshCw className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-[#252735]">
                Rebalance schedule
              </span>
              <span className="text-[11px] text-[#747683] leading-snug">
                Redistribute sessions around missed blocks & deadlines
              </span>
            </div>
          </button>
        </div>
      )}
    </div>
  );
};
