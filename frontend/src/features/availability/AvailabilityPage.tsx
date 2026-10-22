import React, { useState, useMemo } from "react";
import {
  useAvailabilitySlots,
  useCreateSlot,
  useUpdateSlot,
  useDeleteSlot,
} from "@/features/availability/api/availability";
import { useStudyBlocks } from "@/features/calendar/api/studyBlocks";
import { useWorkspace } from "@/features/workspace/context/WorkspaceContext";
import { useToast } from "@/shared/toast/ToastContext";
import { Spinner } from "@/shared/ui/Spinner";
import {
  computePlannedHoursForWeek,
  computeSlotStats,
  getEffectiveSlotsForWeek,
  getMondayOfWeek,
  getWeekDatesFromMonday,
} from "./utils/availabilityUtils";
import { useAvailabilityEditor } from "./hooks/useAvailabilityEditor";
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

  const [scopeMode, setScopeMode] = useState<"recurring" | "week">("recurring");
  const [weekMonday, setWeekMonday] = useState<Date>(() => getMondayOfWeek(new Date()));

  const weekDates = useMemo(() => getWeekDatesFromMonday(weekMonday), [weekMonday]);
  const visibleSlots = useMemo(
    () => getEffectiveSlotsForWeek(slots, scopeMode === "week" ? weekDates : null),
    [slots, scopeMode, weekDates]
  );
  const editor = useAvailabilityEditor(visibleSlots);

  const { availableHours, blockedHours, availableCount, blockedCount } = computeSlotStats(visibleSlots);
  const plannedHoursThisWeek = computePlannedHoursForWeek(studyBlocks, weekDates);
  const editingSlot = editor.effectiveMode === "edit" ? editor.selectedSlot : null;

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
        scopeMode={scopeMode}
        weekDates={weekDates}
        onScopeModeChange={setScopeMode}
        onShiftWeek={(step) =>
          setWeekMonday((prev) => {
            const next = new Date(prev);
            next.setDate(prev.getDate() + step * 7);
            return next;
          })
        }
        onResetCurrentWeek={() => setWeekMonday(getMondayOfWeek(new Date()))}
        onAddSlot={() => editor.addSlotForDay(editor.activeDayIndex, "available")}
      />

      <div className="flex flex-col lg:flex-row items-start gap-6">
        <RecurringWeekTable
          slots={visibleSlots}
          scopeMode={scopeMode}
          weekDates={weekDates}
          availableCount={availableCount}
          blockedCount={blockedCount}
          activeDayIndex={editor.activeDayIndex}
          isEditorVisible={editor.isEditorVisible}
          selectedSlotId={editingSlot?.id ?? null}
          onSelectSlot={editor.selectSlot}
          onAddSlotForDay={editor.addSlotForDay}
          onEditDay={editor.editDay}
        />

        {editor.isEditorVisible && (
          <div ref={editor.editorRef} className="w-full lg:w-[360px] flex-shrink-0">
            <SlotModal
              key={
                editingSlot
                  ? `edit-${editingSlot.id}`
                  : `create-${editor.defaultDay}-${editor.defaultKind}-${scopeMode}-${weekMonday.getTime()}`
              }
              mode={editor.effectiveMode}
              selectedSlot={editor.selectedSlot}
              defaultDay={editor.defaultDay}
              defaultKind={editor.defaultKind}
              defaultRepeat={scopeMode === "week" ? "specific" : "recurring"}
              weekDates={weekDates}
              daySlots={visibleSlots}
              allSlots={slots}
              onSelectSlot={editor.selectSlot}
              onStartCreateForDay={editor.addSlotForDay}
              onCreate={async (data) => {
                const created = await createSlot.mutateAsync(data);
                editor.afterCreate(created.id);
                toast.success("Availability slot added");
              }}
              onUpdate={async (id, data) => {
                await updateSlot.mutateAsync({ id, data });
                toast.success("Availability slot updated");
              }}
              onDelete={async (id) => {
                await deleteSlot.mutateAsync(id);
                editor.afterDelete(id);
                toast.showToast({ type: "info", message: "Availability slot deleted" });
              }}
              onCancel={editor.cancel}
            />
          </div>
        )}
      </div>
    </div>
  );
};
