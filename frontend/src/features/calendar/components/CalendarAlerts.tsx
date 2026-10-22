import React from "react";
import { AlertTriangle } from "lucide-react";

interface Props {
  rebalanceReason: string | null;
  canDismiss: boolean;
  overloadWarning: boolean;
  error: string | null;
  busy: boolean;
  isRebalancing: boolean;
  onRebalance: () => void;
  onDismiss: () => void;
}

/** Stacked notices above the calendar: rebalance suggestion, overload warning, errors. */
export const CalendarAlerts: React.FC<Props> = (p) => (
  <>
    {p.rebalanceReason && (
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-[#EFEEF9] border border-[#CAC7EA] text-[#252735] text-xs font-medium">
        <span>{p.rebalanceReason}</span>
        <div className="flex items-center gap-2 self-start sm:self-auto flex-shrink-0">
          <button
            type="button"
            onClick={p.onRebalance}
            disabled={p.busy}
            className="px-3 py-1.5 rounded-lg bg-[#5553B7] hover:bg-[#48469F] disabled:opacity-60 text-white text-xs font-semibold transition-colors cursor-pointer disabled:cursor-not-allowed"
          >
            {p.isRebalancing ? "Rebalancing..." : "🔄 Rebalance Now"}
          </button>
          {p.canDismiss && (
            <button
              type="button"
              onClick={p.onDismiss}
              className="px-2 py-1 text-[#747683] hover:text-[#252735] text-xs cursor-pointer"
            >
              Dismiss
            </button>
          )}
        </div>
      </div>
    )}

    {p.overloadWarning && (
      <div className="flex items-center gap-3 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium">
        <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
        <span>
          Overload warning: Your pending tasks require more study hours than your available weekly slots before
          their deadlines.
        </span>
      </div>
    )}

    {p.error && (
      <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
        {p.error}
      </div>
    )}
  </>
);
