import React, { useState } from "react";
import { StudyBlock } from "@/types";
import { useCreateStudyBlock, useDeleteStudyBlock, useUpdateStudyBlock } from "@/api/studyBlocks";
import { useSchedule } from "@/hooks/useSchedule";
import { useTasks } from "@/api/tasks";
import { useWorkspace } from "@/context/WorkspaceContext";
import { Modal } from "@/components/common/Modal";
import { Input } from "@/components/common/Input";
import { Button } from "@/components/common/Button";
import { CourseTag } from "@/components/common/CourseTag";
import { Select } from "@/components/common/Select";
import { getInitialBlockTimes } from "../calendarUtils";

interface StudyBlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  block: StudyBlock | null;
  initialSlot: Date | null;
}

export const StudyBlockModal: React.FC<StudyBlockModalProps> = ({
  isOpen,
  onClose,
  block,
  initialSlot,
}) => {
  const { workspace } = useWorkspace();
  const { updateBlockStatus } = useSchedule();
  const { data: tasks = [] } = useTasks({ semester: workspace }, { enabled: isOpen && !block });
  const createBlock = useCreateStudyBlock();
  const updateBlock = useUpdateStudyBlock();
  const deleteBlock = useDeleteStudyBlock();

  const initialTimes = getInitialBlockTimes(block, initialSlot);
  const [selectedTaskId, setSelectedTaskId] = useState<number | "">(block?.task_id ?? "");
  const [startAt, setStartAt] = useState(initialTimes.start);
  const [endAt, setEndAt] = useState(initialTimes.end);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const activeTaskId = selectedTaskId || tasks[0]?.id || "";
  const isSubmitting = createBlock.isPending || updateBlock.isPending || deleteBlock.isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const payload = {
        start_at: new Date(startAt).toISOString(),
        end_at: new Date(endAt).toISOString(),
      };
      if (block) {
        await updateBlock.mutateAsync({ id: block.id, data: payload });
      } else {
        await createBlock.mutateAsync({ task_id: Number(activeTaskId), ...payload });
      }
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save study block");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={block ? "Study session detail" : "Schedule study block"}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && (
          <div className="p-2.5 rounded-lg bg-rose-50 text-rose-700 text-xs font-medium">{error}</div>
        )}

        {block ? (
          <div className="p-3.5 bg-[#F7F7F4] rounded-lg flex flex-col gap-2">
            <span className="text-sm font-semibold text-[#252735]">
              {block.task_title || "Focus Study Session"}
            </span>
            <div className="flex items-center justify-between">
              <CourseTag code={block.course_code || "GENERAL"} color={block.course_color || "#5553B7"} />
              <span className="text-xs px-2 py-0.5 rounded-md bg-[#EFEEF9] text-[#5553B7] font-medium capitalize">
                {block.status}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-[#252735]">Task</label>
            <Select
              value={activeTaskId ? String(activeTaskId) : ""}
              onChange={(val) => setSelectedTaskId(val ? Number(val) : 0)}
              options={[
                { value: "", label: "Select a task" },
                ...tasks.map((t) => ({ value: String(t.id), label: t.title })),
              ]}
              className="w-full"
              buttonClassName="h-[46px] text-sm font-normal"
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Input label="Start time" type="datetime-local" required value={startAt} onChange={(e) => setStartAt(e.target.value)} />
          <Input label="End time" type="datetime-local" required value={endAt} onChange={(e) => setEndAt(e.target.value)} />
        </div>

        {block && (
          <div className="flex items-center gap-2 pt-1">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={async () => {
                  await updateBlockStatus(block, "completed");
                  onClose();
                }}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  block.status === "completed"
                    ? "bg-emerald-600 text-white"
                    : "bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-200"
                }`}
              >
                ✓ Done
              </button>
              {(new Date(block.end_at).getTime() <= Date.now() || block.status === "missed") && (
                <button
                  type="button"
                  onClick={async () => {
                    await updateBlockStatus(block, "missed");
                    onClose();
                  }}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    block.status === "missed"
                      ? "bg-rose-600 text-white"
                      : "bg-white hover:bg-rose-50 text-rose-700 border border-rose-200"
                  }`}
                >
                  ✕ Missed
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={async () => {
                if (window.confirm("Delete this scheduled block?")) {
                  await deleteBlock.mutateAsync(block.id);
                  onClose();
                }
              }}
              className="text-xs font-medium text-[#B45353] hover:underline cursor-pointer ml-auto"
            >
              Delete session
            </button>
          </div>
        )}

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#E5E6EB]">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting} className="bg-[#5553B7] hover:bg-[#48469F]">
            {block ? "Reschedule" : "Schedule study block"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
