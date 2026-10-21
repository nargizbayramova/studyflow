import React, { useState, useRef } from "react";
import {
  useAvailabilitySlots,
  useCreateSlot,
  useUpdateSlot,
  useDeleteSlot,
} from "@/api/availability";
import { useStudyBlocks } from "@/api/studyBlocks";
import { useWorkspace } from "@/context/WorkspaceContext";
import { useToast } from "@/context/ToastContext";
import { Spinner } from "@/components/common/Spinner";
import { AvailabilitySlot, SlotKind } from "@/types";
import { computePlannedHoursThisWeek, computeSlotStats } from "./utils/availabilityUtils";
import { AvailabilityHeader } from "./components/AvailabilityHeader";
import { RecurringWeekTable } from "./components/RecurringWeekTable";
import { SlotModal } from "./components/SlotModal";

export const AvailabilityPage: React.FC = () => {
  const { workspace } = useWorkspace();
  const { data: slots = [], isLoading } = useAvailabilitySlots();
  const { data: studyBlocks = [] } = useStudyBlocks({ semester: workspace });
  const createSlot = useCreateSlot();
  const updateSlot = useUpdateSlot();
  const deleteSlot = useDeleteSlot();
  const toast = useToast();

  const [editorMode, setEditorMode] = useState<"edit" | "create">("edit");
  const [selectedSlotId, setSelectedSlotId] = useState<number | null>(null);
  const [defaultDay, setDefaultDay] = useState<number>(3);
  const [defaultKind, setDefaultKind] = useState<SlotKind>("available");
  const [isEditorVisible, setIsEditorVisible] = useState<boolean>(true);
  const editorRef = useRef<HTMLDivElement>(null);

  const fallbackSlot =
    slots.find((s) => s.day_of_week === 3 && s.kind === "available") ?? slots[0] ?? null;
  const selectedSlot =
    slots.find((s) => s.id === selectedSlotId) ?? (editorMode === "edit" ? fallbackSlot : null);
  const effectiveMode: "edit" | "create" =
    editorMode === "edit" && selectedSlot ? "edit" : "create";
  const activeDayIndex = effectiveMode === "edit" && selectedSlot ? selectedSlot.day_of_week : defaultDay;

  const { availableHours, blockedHours, availableCount, blockedCount } = computeSlotStats(slots);
  const plannedHoursThisWeek = computePlannedHoursThisWeek(studyBlocks);

  const revealEditor = () => {
    setIsEditorVisible(true);
    if (window.innerWidth < 1024) {
      setTimeout(() => editorRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }), 50);
    }
  };

  const handleSelectSlot = (slot: AvailabilitySlot) => {
    setEditorMode("edit");
    setSelectedSlotId(slot.id);
    setDefaultDay(slot.day_of_week);
    setDefaultKind(slot.kind);
    revealEditor();
  };

  const handleAddSlotForDay = (dayIndex: number, kind: SlotKind = "available") => {
    setEditorMode("create");
    setSelectedSlotId(null);
    setDefaultDay(dayIndex);
    setDefaultKind(kind);
    revealEditor();
  };

  const handleEditDay = (dayIndex: number) => {
    const daySlots = slots.filter((s) => s.day_of_week === dayIndex);
    const preferred = daySlots.find((s) => s.kind === "available") || daySlots[0];
    if (preferred) handleSelectSlot(preferred);
    else handleAddSlotForDay(dayIndex, "available");
  };

  if (isLoading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 sm:gap-7 max-w-7xl mx-auto font-sans">
      <AvailabilityHeader
        availableHours={availableHours}
        blockedHours={blockedHours}
        plannedHoursThisWeek={plannedHoursThisWeek}
        onAddSlot={() => handleAddSlotForDay(activeDayIndex, "available")}
      />

      <div className="flex flex-col lg:flex-row items-start gap-6">
        <RecurringWeekTable
          slots={slots}
          availableCount={availableCount}
          blockedCount={blockedCount}
          activeDayIndex={activeDayIndex}
          isEditorVisible={isEditorVisible}
          selectedSlotId={effectiveMode === "edit" && selectedSlot ? selectedSlot.id : null}
          onSelectSlot={handleSelectSlot}
          onAddSlotForDay={handleAddSlotForDay}
          onEditDay={handleEditDay}
        />

        {isEditorVisible && (
          <div ref={editorRef} className="w-full lg:w-[360px] flex-shrink-0">
            <SlotModal
              key={
                effectiveMode === "edit" && selectedSlot
                  ? `edit-${selectedSlot.id}`
                  : `create-${defaultDay}-${defaultKind}`
              }
              mode={effectiveMode}
              selectedSlot={selectedSlot}
              defaultDay={defaultDay}
              defaultKind={defaultKind}
              daySlots={slots}
              onSelectSlot={handleSelectSlot}
              onCreate={async (data) => {
                const created = await createSlot.mutateAsync(data);
                setEditorMode("edit");
                setSelectedSlotId(created.id);
                toast.success("Recurring slot added");
              }}
              onUpdate={async (id, data) => {
                await updateSlot.mutateAsync({ id, data });
                toast.success("Recurring slot updated");
              }}
              onDelete={async (id) => {
                await deleteSlot.mutateAsync(id);
                const remaining = slots.filter((s) => s.id !== id);
                setSelectedSlotId(remaining[0]?.id ?? null);
                setEditorMode(remaining.length > 0 ? "edit" : "create");
                toast.showToast({ type: "info", message: "Recurring slot deleted" });
              }}
              onCancel={() => {
                if (effectiveMode === "create" && slots.length > 0) {
                  setEditorMode("edit");
                } else {
                  setIsEditorVisible(false);
                }
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};
