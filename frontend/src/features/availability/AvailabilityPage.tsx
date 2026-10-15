import React, { useState } from "react";
import { Plus, Trash2, CheckCircle2, Ban } from "lucide-react";
import { useAvailabilitySlots, useCreateSlot, useDeleteSlot } from "@/api/availability";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/common/Card";
import { Button } from "@/components/common/Button";
import { Modal } from "@/components/common/Modal";
import { Input } from "@/components/common/Input";
import { Badge } from "@/components/common/Badge";
import { Spinner } from "@/components/common/Spinner";
import { SlotKind } from "@/types";

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export const AvailabilityPage: React.FC = () => {
  const { data: slots = [], isLoading } = useAvailabilitySlots();
  const createSlot = useCreateSlot();
  const deleteSlot = useDeleteSlot();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [dayOfWeek, setDayOfWeek] = useState(0);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("12:00");
  const [kind, setKind] = useState<SlotKind>("available");
  const [modalError, setModalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    try {
      await createSlot.mutateAsync({
        day_of_week: Number(dayOfWeek),
        start_time: startTime,
        end_time: endTime,
        kind,
      });
      setIsModalOpen(false);
      setModalError(null);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setModalError(err.message);
      } else {
        setModalError("Failed to add time slot");
      }
    }
  };

  const handleDelete = async (id: number) => {
    await deleteSlot.mutateAsync(id);
  };

  return (
    <div className="space-y-8">
      <Header
        title="Weekly Availability & Preferences"
        subtitle="Specify your recurring study hours and blocked slots for AI scheduling."
        actions={
          <Button size="sm" onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4" /> Add Time Slot
          </Button>
        }
      />

      {isLoading ? (
        <Spinner className="py-20" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {DAYS.map((dayName, dayIndex) => {
            const daySlots = slots.filter((s) => s.day_of_week === dayIndex);

            return (
              <Card key={dayIndex} className="p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                    <h3 className="font-bold text-slate-900 text-sm">{dayName}</h3>
                    <span className="text-xs font-semibold text-slate-400">
                      {daySlots.length} {daySlots.length === 1 ? "slot" : "slots"}
                    </span>
                  </div>

                  {daySlots.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400">
                      No slots configured
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {daySlots.map((slot) => {
                        const isAvailable = slot.kind === "available";
                        return (
                          <div
                            key={slot.id}
                            className={`p-2.5 rounded-xl border flex items-center justify-between transition-colors ${
                              isAvailable
                                ? "bg-emerald-50/50 border-emerald-200/70"
                                : "bg-rose-50/50 border-rose-200/70"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              {isAvailable ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                              ) : (
                                <Ban className="w-4 h-4 text-rose-600 flex-shrink-0" />
                              )}
                              <div>
                                <span className="text-xs font-bold text-slate-800">
                                  {slot.start_time.slice(0, 5)} – {slot.end_time.slice(0, 5)}
                                </span>
                                <Badge
                                  variant={isAvailable ? "success" : "danger"}
                                  size="sm"
                                  className="ml-2 text-[10px]"
                                >
                                  {slot.kind}
                                </Badge>
                              </div>
                            </div>

                            <button
                              onClick={() => handleDelete(slot.id)}
                              className="text-slate-400 hover:text-rose-600 p-1 rounded-md transition-colors"
                              title="Delete Slot"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs"
                    onClick={() => {
                      setDayOfWeek(dayIndex);
                      setIsModalOpen(true);
                    }}
                  >
                    <Plus className="w-3.5 h-3.5" /> Add slot
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Slot Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setModalError(null);
        }}
        title="Add Recurring Weekly Slot"
        description="Define your typical available study periods or blocked lectures."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {modalError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200/70 text-rose-700 text-xs font-medium">
              {modalError}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Day of Week</label>
            <select
              value={dayOfWeek}
              onChange={(e) => setDayOfWeek(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-white"
            >
              {DAYS.map((d, idx) => (
                <option key={idx} value={idx}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start Time"
              type="time"
              required
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
            <Input
              label="End Time"
              type="time"
              required
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Slot Type</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setKind("available")}
                className={`py-2 px-3 text-xs font-semibold rounded-lg border flex items-center justify-center gap-1.5 ${
                  kind === "available"
                    ? "bg-emerald-50 border-emerald-500 text-emerald-700 ring-1 ring-emerald-500"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Study Available
              </button>
              <button
                type="button"
                onClick={() => setKind("blocked")}
                className={`py-2 px-3 text-xs font-semibold rounded-lg border flex items-center justify-center gap-1.5 ${
                  kind === "blocked"
                    ? "bg-rose-50 border-rose-500 text-rose-700 ring-1 ring-rose-500"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <Ban className="w-4 h-4 text-rose-600" /> Blocked / Class
              </button>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={createSlot.isPending}>
              Add Slot
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
