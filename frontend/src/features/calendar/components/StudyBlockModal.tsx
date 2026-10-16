import React, { useState, useEffect } from "react";
import { StudyBlock, Task, Course, BlockStatus } from "@/types";
import { Modal } from "@/components/common/Modal";
import { Input } from "@/components/common/Input";
import { Button } from "@/components/common/Button";
import { CourseTag } from "@/components/common/CourseTag";

interface StudyBlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  block?: StudyBlock | null;
  initialSlot?: Date | null;
  tasks: Task[];
  courses: Course[];
  onCreate: (data: { task_id: number; start_at: string; end_at: string }) => Promise<void>;
  onUpdate: (id: number, data: { start_at?: string; end_at?: string; status?: BlockStatus }) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}

function toLocalDatetimeString(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export const StudyBlockModal: React.FC<StudyBlockModalProps> = ({
  isOpen,
  onClose,
  block,
  initialSlot,
  tasks,
  courses,
  onCreate,
  onUpdate,
  onDelete,
}) => {
  const [taskId, setTaskId] = useState<number>(0);
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (block) {
      setTaskId(block.task_id);
      setStartAt(toLocalDatetimeString(new Date(block.start_at)));
      setEndAt(toLocalDatetimeString(new Date(block.end_at)));
    } else {
      setTaskId(tasks[0]?.id || 0);
      const base = initialSlot ? new Date(initialSlot) : new Date();
      if (!initialSlot) base.setMinutes(0, 0, 0);
      setStartAt(toLocalDatetimeString(base));
      const later = new Date(base.getTime() + 60 * 60 * 1000);
      setEndAt(toLocalDatetimeString(later));
    }
    setError(null);
  }, [block, initialSlot, isOpen, tasks]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (block) {
        await onUpdate(block.id, {
          start_at: new Date(startAt).toISOString(),
          end_at: new Date(endAt).toISOString(),
        });
      } else {
        await onCreate({
          task_id: Number(taskId),
          start_at: new Date(startAt).toISOString(),
          end_at: new Date(endAt).toISOString(),
        });
      }
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save study block");
    } finally {
      setLoading(false);
    }
  };

  const currentTask = tasks.find((t) => t.id === (block ? block.task_id : taskId));
  const currentCourse = courses.find((c) => c.id === currentTask?.course_id);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={block ? "Study session detail" : "Schedule study session"}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && (
          <div className="p-2.5 rounded-lg bg-rose-50 text-rose-700 text-xs font-medium">
            {error}
          </div>
        )}

        {block ? (
          <div className="p-3.5 bg-[#F7F7F4] rounded-lg flex flex-col gap-2">
            <span className="text-sm font-semibold text-[#252735]">
              {currentTask?.title || "Focus Study Session"}
            </span>
            <div className="flex items-center justify-between">
              <CourseTag
                code={currentCourse?.code || "GENERAL"}
                color={currentCourse?.color || "#5553B7"}
              />
              <span className="text-xs px-2 py-0.5 rounded-md bg-[#EFEEF9] text-[#5553B7] font-medium capitalize">
                {block.status}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-[#252735]">Task</label>
            <select
              value={taskId}
              onChange={(e) => setTaskId(Number(e.target.value))}
              required
              className="h-[46px] px-3 rounded-lg border border-[#E5E6EB] text-sm text-[#252735] bg-white focus:outline-none focus:border-[#5553B7]"
            >
              <option value="">Select a task</option>
              {tasks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Start time"
            type="datetime-local"
            required
            value={startAt}
            onChange={(e) => setStartAt(e.target.value)}
          />
          <Input
            label="End time"
            type="datetime-local"
            required
            value={endAt}
            onChange={(e) => setEndAt(e.target.value)}
          />
        </div>

        {block && (
          <div className="flex items-center gap-2 pt-1">
            {block.status !== "completed" && (
              <button
                type="button"
                onClick={async () => {
                  await onUpdate(block.id, { status: "completed" });
                  onClose();
                }}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors cursor-pointer"
              >
                Mark as completed
              </button>
            )}
            <button
              type="button"
              onClick={async () => {
                if (window.confirm("Delete this scheduled block?")) {
                  await onDelete(block.id);
                  onClose();
                }
              }}
              className="text-xs font-medium text-rose-600 hover:underline cursor-pointer ml-auto"
            >
              Delete session
            </button>
          </div>
        )}

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#E5E6EB]">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" isLoading={loading} className="bg-[#5553B7] hover:bg-[#48469F]">
            {block ? "Reschedule" : "Schedule session"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
