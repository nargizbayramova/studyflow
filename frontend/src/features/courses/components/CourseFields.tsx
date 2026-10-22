import React from "react";
import { Check } from "lucide-react";
import { Input } from "@/shared/ui/Input";
import { COURSE_COLORS } from "../constants";
import { CourseFormValues } from "../hooks/useCourseForm";

interface Props {
  values: CourseFormValues;
  onChange: <K extends keyof CourseFormValues>(key: K, value: CourseFormValues[K]) => void;
  /** Placeholders are only shown in the "add" flow. */
  showPlaceholders?: boolean;
  swatchClassName?: string;
}

/** Shared inputs + colour picker for the add (modal) and edit (sidebar) course forms. */
export const CourseFields: React.FC<Props> = ({
  values: v,
  onChange,
  showPlaceholders = false,
  swatchClassName = "w-[30px] h-[30px]",
}) => (
  <>
    <Input label="Course code" required placeholder={showPlaceholders ? "CSCI 3509" : undefined} value={v.code} onChange={(e) => onChange("code", e.target.value)} />
    <Input label="Course title" required placeholder={showPlaceholders ? "Intro to Software Engineering" : undefined} value={v.title} onChange={(e) => onChange("title", e.target.value)} />
    <Input label="Instructor" placeholder={showPlaceholders ? "Kamila Ismayilova" : undefined} value={v.instructor} onChange={(e) => onChange("instructor", e.target.value)} />
    <Input label="Semester" required placeholder={showPlaceholders ? "Fall 2026" : undefined} value={v.semester} onChange={(e) => onChange("semester", e.target.value)} />

    <div className="flex flex-col gap-2">
      <label className="text-[13px] font-semibold text-[#252735]">Course color</label>
      <div className="flex items-center gap-3">
        {COURSE_COLORS.map((c) => (
          <button
            type="button"
            key={c}
            onClick={() => onChange("color", c)}
            className={`${swatchClassName} rounded-full flex items-center justify-center transition-transform hover:scale-110 cursor-pointer`}
            style={{ backgroundColor: c }}
            aria-label={`Color ${c}`}
          >
            {v.color === c && <Check className="w-4 h-4 text-white" />}
          </button>
        ))}
      </div>
    </div>
  </>
);
