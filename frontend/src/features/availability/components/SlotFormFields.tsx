import React from "react";
import { CheckCircle2, Ban } from "lucide-react";
import { SlotKind } from "@/features/availability/types";
import { SelectField } from "@/shared/ui/SelectField";
import { DAYS, buildTimeOptions, formatHoursLabel, formatShortDate } from "../utils/availabilityUtils";
import { RepeatType, useSlotForm } from "../hooks/useSlotForm";

type Form = ReturnType<typeof useSlotForm>;

/** Form inputs of the slot editor; state lives in `useSlotForm`. */
export const SlotFormFields: React.FC<{ form: Form }> = ({ form: f }) => (
  <>
    <SelectField
      label="Day of the week"
      value={f.dayOfWeek}
      onChange={(v) => f.setDayOfWeek(Number(v))}
      options={DAYS.map((d, idx) => ({ value: idx, label: d }))}
    />
    <SelectField
      label="Applies to"
      value={f.repeatType}
      onChange={(v) => f.setRepeatType(v as RepeatType)}
      options={[
        { value: "recurring", label: "Every week (Recurring)" },
        { value: "specific", label: `Only ${DAYS[f.dayOfWeek]}, ${formatShortDate(f.targetDateIso)}` },
      ]}
    />
    <SelectField
      label="Time type"
      value={f.kind}
      onChange={(v) => f.setKind(v as SlotKind)}
      options={[
        { value: "available", label: "Available study time" },
        { value: "blocked", label: "Blocked time" },
      ]}
    />

    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <CheckCircle2 className="w-[15px] h-[15px] text-[#327864] flex-shrink-0" />
        <span className="text-[12px] text-[#327864]">Available: time you can study</span>
      </div>
      <div className="flex items-center gap-2">
        <Ban className="w-[15px] h-[15px] text-[#747683] flex-shrink-0" />
        <span className="text-[12px] text-[#747683]">Blocked: time to keep free of study</span>
      </div>
    </div>

    <div className="grid grid-cols-2 gap-2.5">
      <SelectField label="Start time" value={f.startTime} onChange={f.setStartTime} options={buildTimeOptions(f.startTime)} />
      <SelectField label="End time" value={f.endTime} onChange={f.setEndTime} options={buildTimeOptions(f.endTime)} />
    </div>

    <div className="flex items-center justify-between gap-2">
      <span className="text-[13px] text-[#747683]">
        {f.repeatType === "specific"
          ? `Only on ${DAYS[f.dayOfWeek]}, ${formatShortDate(f.targetDateIso)}`
          : `Repeats every ${DAYS[f.dayOfWeek]}`}
      </span>
      <span
        className={`px-[9px] py-1 rounded-[6px] text-[12px] font-medium ${
          f.kind === "available" ? "bg-[#EAF4EF] text-[#327864]" : "bg-[#F7F7F4] text-[#747683]"
        }`}
      >
        {formatHoursLabel(f.durationHours)}
      </span>
    </div>

    <div className="p-3.5 rounded-[8px] bg-[#EFEEF9] flex flex-col gap-1">
      <span className="text-[13px] font-semibold text-[#5553B7]">Changes affect your study windows</span>
      <p className="text-[12px] text-[#747683] leading-[1.45]">
        Existing study blocks keep their scheduled times. Review them in your calendar after editing availability.
      </p>
    </div>
  </>
);
