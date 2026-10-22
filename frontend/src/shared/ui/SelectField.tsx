import React from "react";
import { Select } from "@/shared/ui/Select";

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
    <Select
      value={value}
      onChange={(v) => onChange(String(v))}
      options={options}
      className="w-full"
      buttonClassName="h-[46px] px-[14px] text-[14px] font-normal"
    />
  </div>
);
