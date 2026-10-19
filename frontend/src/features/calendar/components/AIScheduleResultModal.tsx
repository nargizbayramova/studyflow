import React from "react";
import { AlertTriangle, CheckCircle2, Sparkles } from "lucide-react";
import { ScheduleResponse } from "@/types";
import { Modal } from "@/components/common/Modal";
import { CourseTag } from "@/components/common/CourseTag";
import { Button } from "@/components/common/Button";
import { formatTimeRange, sumBlocksHours } from "../calendarUtils";

interface AIScheduleResultModalProps {
  result: ScheduleResponse | null;
  onClose: () => void;
}

export const AIScheduleResultModal: React.FC<AIScheduleResultModalProps> = ({
  result,
  onClose,
}) => {
  if (!result) return null;

  const blocks = result.study_blocks;
  const totalHours = sumBlocksHours(blocks);
  const uniqueTasks = new Set(blocks.map((b) => b.task_id)).size;

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="AI Schedule Generated"
      description="Your study sessions have been automatically distributed across your open availability windows."
      maxWidth="lg"
    >
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded-xl bg-[#F7F7F4] border border-[#E5E6EB] text-center">
            <div className="text-lg font-bold text-[#252735]">{blocks.length}</div>
            <div className="text-[11px] text-[#747683]">Sessions created</div>
          </div>
          <div className="p-3 rounded-xl bg-[#F7F7F4] border border-[#E5E6EB] text-center">
            <div className="text-lg font-bold text-[#5553B7]">{totalHours} h</div>
            <div className="text-[11px] text-[#747683]">Total study time</div>
          </div>
          <div className="p-3 rounded-xl bg-[#F7F7F4] border border-[#E5E6EB] text-center">
            <div className="text-lg font-bold text-[#252735]">{uniqueTasks}</div>
            <div className="text-[11px] text-[#747683]">Tasks covered</div>
          </div>
        </div>

        {result.overload_warning ? (
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <span>
              <strong>Overload detected:</strong> Your tasks require more hours than your available slots before their deadlines. We scheduled as much as fits—consider adding more availability slots.
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>All pending tasks fit within your available study windows before their due dates.</span>
          </div>
        )}

        <div className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-1">
          {blocks.map((b) => {
            const color = b.course_color || "#5553B7";
            const dateLabel = new Date(b.start_at).toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
            });
            return (
              <div
                key={b.id}
                style={{ backgroundColor: `${color}12`, borderLeft: `3px solid ${color}` }}
                className="p-3 rounded-lg flex flex-col gap-1"
              >
                <div className="flex items-center justify-between gap-2">
                  <CourseTag code={b.course_code || "STUDY"} color={color} />
                  <span className="text-[11px] font-medium text-[#747683]">
                    {dateLabel} &bull; {formatTimeRange(b.start_at, b.end_at)}
                  </span>
                </div>
                <span className="text-xs font-bold text-[#252735]">{b.task_title}</span>
                {b.focus_goal && (
                  <span className="text-[11px] text-[#747683] flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-[#5553B7] flex-shrink-0" />
                    {b.focus_goal}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex justify-end pt-3 border-t border-[#E5E6EB]">
          <Button type="button" onClick={onClose} className="bg-[#5553B7] hover:bg-[#48469F]">
            Got it
          </Button>
        </div>
      </div>
    </Modal>
  );
};
