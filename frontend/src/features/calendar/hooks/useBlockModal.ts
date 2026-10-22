import { useState } from "react";
import { StudyBlock } from "@/features/calendar/types";

/** Open/close state of the study-block modal: editing a block, or creating from a clicked slot. */
export function useBlockModal() {
  const [selectedBlock, setSelectedBlock] = useState<StudyBlock | null>(null);
  const [initialSlot, setInitialSlot] = useState<Date | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const open = (block: StudyBlock | null, slot: Date | null) => {
    setSelectedBlock(block);
    setInitialSlot(slot);
    setIsOpen(true);
  };

  return {
    selectedBlock,
    initialSlot,
    isOpen,
    openNew: () => open(null, null),
    openBlock: (block: StudyBlock) => open(block, null),
    openSlot: (slot: Date) => open(null, slot),
    close: () => {
      setIsOpen(false);
      setSelectedBlock(null);
      setInitialSlot(null);
    },
  };
}
