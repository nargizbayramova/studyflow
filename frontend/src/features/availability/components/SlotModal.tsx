import React, { useState } from "react";
import { SlotKind } from "@/types";
import { Modal } from "@/components/common/Modal";
import { Input } from "@/components/common/Input";
import { Button } from "@/components/common/Button";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

interface SlotModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    day_of_week: number;
    start_time: string;
    end_time: string;
    kind: SlotKind;
  }) => Promise<void>;
  defaultDay?: number;
}

export const SlotModal: React.FC<SlotModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  defaultDay = 0,
}) => {
  const [dayOfWeek, setDayOfWeek] = useState(defaultDay);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("12:00");
  const [kind, setKind] = useState<SlotKind>("available");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await onSubmit({
        day_of_week: Number(dayOfWeek),
        start_time: startTime,
        end_time: endTime,
        kind,
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to add slot");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add availability slot">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && (
          <div className="p-2.5 rounded-lg bg-rose-50 text-rose-700 text-xs font-medium">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-semibold text-[#252735]">Day of week</label>
          <select
            value={dayOfWeek}
            onChange={(e) => setDayOfWeek(Number(e.target.value))}
            className="h-[46px] px-3 rounded-lg border border-[#E5E6EB] text-sm text-[#252735] bg-white focus:outline-none focus:border-[#5553B7]"
          >
            {DAYS.map((name, idx) => (
              <option key={name} value={idx}>
                {name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Start time"
            type="time"
            required
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
          />
          <Input
            label="End time"
            type="time"
            required
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-semibold text-[#252735]">Slot type</label>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => setKind("available")}
              className={`p-3 rounded-lg border text-xs font-semibold flex flex-col gap-0.5 cursor-pointer text-left transition-all ${
                kind === "available"
                  ? "border-[#5553B7] bg-[#EFEEF9] text-[#5553B7]"
                  : "border-[#E5E6EB] bg-white text-[#747683]"
              }`}
            >
              <span>Available for study</span>
              <span className="text-[11px] font-normal opacity-80">Free time to schedule</span>
            </button>
            <button
              type="button"
              onClick={() => setKind("blocked")}
              className={`p-3 rounded-lg border text-xs font-semibold flex flex-col gap-0.5 cursor-pointer text-left transition-all ${
                kind === "blocked"
                  ? "border-amber-600 bg-amber-50 text-amber-800"
                  : "border-[#E5E6EB] bg-white text-[#747683]"
              }`}
            >
              <span>Blocked time</span>
              <span className="text-[11px] font-normal opacity-80">Class, work, personal</span>
            </button>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#E5E6EB]">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" isLoading={loading} className="bg-[#5553B7] hover:bg-[#48469F]">
            Add slot
          </Button>
        </div>
      </form>
    </Modal>
  );
};
