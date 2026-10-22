import { useRef, useState } from "react";
import { AvailabilitySlot, SlotKind } from "@/features/availability/types";

/** Editor-panel state: which slot is selected, create/edit mode and visibility. */
export function useAvailabilityEditor(visibleSlots: AvailabilitySlot[]) {
  const [editorMode, setEditorMode] = useState<"edit" | "create">("edit");
  const [selectedSlotId, setSelectedSlotId] = useState<number | null>(null);
  const [defaultDay, setDefaultDay] = useState(3);
  const [defaultKind, setDefaultKind] = useState<SlotKind>("available");
  const [isEditorVisible, setIsEditorVisible] = useState(true);
  const editorRef = useRef<HTMLDivElement>(null);

  const fallbackSlot =
    visibleSlots.find((s) => s.day_of_week === 3 && s.kind === "available") ?? visibleSlots[0] ?? null;
  const selectedSlot =
    visibleSlots.find((s) => s.id === selectedSlotId) ?? (editorMode === "edit" ? fallbackSlot : null);
  const effectiveMode: "edit" | "create" = editorMode === "edit" && selectedSlot ? "edit" : "create";
  const activeDayIndex = effectiveMode === "edit" && selectedSlot ? selectedSlot.day_of_week : defaultDay;

  const revealEditor = () => {
    setIsEditorVisible(true);
    if (window.innerWidth < 1024) {
      setTimeout(() => editorRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }), 50);
    }
  };

  const selectSlot = (slot: AvailabilitySlot) => {
    setEditorMode("edit");
    setSelectedSlotId(slot.id);
    setDefaultDay(slot.day_of_week);
    setDefaultKind(slot.kind);
    revealEditor();
  };

  const addSlotForDay = (dayIndex: number, kind: SlotKind = "available") => {
    setEditorMode("create");
    setSelectedSlotId(null);
    setDefaultDay(dayIndex);
    setDefaultKind(kind);
    revealEditor();
  };

  const editDay = (dayIndex: number) => {
    const daySlots = visibleSlots.filter((s) => s.day_of_week === dayIndex);
    const preferred = daySlots.find((s) => s.kind === "available") || daySlots[0];
    if (preferred) selectSlot(preferred);
    else addSlotForDay(dayIndex, "available");
  };

  return {
    editorRef,
    selectedSlot,
    effectiveMode,
    activeDayIndex,
    defaultDay,
    defaultKind,
    isEditorVisible,
    selectSlot,
    addSlotForDay,
    editDay,
    afterCreate: (id: number) => {
      setEditorMode("edit");
      setSelectedSlotId(id);
    },
    afterDelete: (id: number) => {
      const remaining = visibleSlots.filter((s) => s.id !== id);
      setSelectedSlotId(remaining[0]?.id ?? null);
      setEditorMode(remaining.length > 0 ? "edit" : "create");
    },
    cancel: () => {
      if (effectiveMode === "create" && visibleSlots.length > 0) setEditorMode("edit");
      else setIsEditorVisible(false);
    },
  };
}
