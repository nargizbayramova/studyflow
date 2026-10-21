import React from "react";
import { ChevronDown } from "lucide-react";

interface SelectFieldProps {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  options: { value: string | number; label: string }[];
}

export const SelectField: React.FC<SelectFieldProps> = ({
  label,
  value,
  onChange,
  options,
}) => (
  <div className="flex flex-col gap-2">
    <label className="text-[13px] font-semibold leading-[1.45] text-[#252735]">{label}</label>
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-[46px] px-[14px] pr-9 bg-white border border-[#E5E6EB] rounded-[8px] text-[14px] font-normal text-[#252735] appearance-none focus:outline-none focus:border-[#5553B7] cursor-pointer"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown className="w-4 h-4 text-[#747683] absolute right-[14px] top-1/2 -translate-y-1/2 pointer-events-none" />
    </div>
  </div>
);
