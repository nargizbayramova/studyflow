import React, { useState } from "react";
import { Plus } from "lucide-react";
import { useAvailabilitySlots, useCreateSlot, useDeleteSlot } from "@/api/availability";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/common/Button";
import { Spinner } from "@/components/common/Spinner";
import { DayAvailabilityCard } from "./components/DayAvailabilityCard";
import { SlotModal } from "./components/SlotModal";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export const AvailabilityPage: React.FC = () => {
  const { data: slots = [], isLoading } = useAvailabilitySlots();
  const createSlot = useCreateSlot();
  const deleteSlot = useDeleteSlot();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState(0);

  const handleOpenAddSlot = (dayIndex: number) => {
    setSelectedDay(dayIndex);
    setIsModalOpen(true);
  };

  const handleCreateSlot = async (slotData: {
    day_of_week: number;
    start_time: string;
    end_time: string;
    kind: "available" | "blocked";
  }) => {
    await createSlot.mutateAsync(slotData);
  };

  return (
    <div className="space-y-6">
      <Header
        title="Weekly availability"
        subtitle="Set recurring study windows and commitments for the scheduler"
        actions={
          <Button
            size="sm"
            onClick={() => handleOpenAddSlot(0)}
            className="bg-[#5553B7] hover:bg-[#48469F] text-white"
          >
            <Plus className="w-4 h-4" /> Add time slot
          </Button>
        }
      />

      {isLoading ? (
        <Spinner className="py-20" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {DAYS.map((dayName, dayIndex) => (
            <DayAvailabilityCard
              key={dayName}
              dayName={dayName}
              dayIndex={dayIndex}
              slots={slots.filter((s) => s.day_of_week === dayIndex)}
              onAddSlot={handleOpenAddSlot}
              onDeleteSlot={(id) => deleteSlot.mutate(id)}
            />
          ))}
        </div>
      )}

      {isModalOpen && (
        <SlotModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleCreateSlot}
          defaultDay={selectedDay}
        />
      )}
    </div>
  );
};
