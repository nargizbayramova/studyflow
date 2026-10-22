export type SlotKind = "available" | "blocked";

export interface AvailabilitySlot {
  id: number;
  day_of_week: number; // 0 = Monday ... 6 = Sunday
  specific_date?: string | null; // "YYYY-MM-DD" when week-specific, null when recurring
  start_time: string; // "HH:MM" or "HH:MM:SS"
  end_time: string;
  kind: SlotKind;
}

export interface SlotCreatePayload {
  day_of_week: number;
  specific_date?: string | null;
  start_time: string;
  end_time: string;
  kind?: SlotKind;
}

export interface SlotUpdatePayload {
  day_of_week?: number;
  specific_date?: string | null;
  start_time?: string;
  end_time?: string;
  kind?: SlotKind;
}
