import React, { useState } from "react";
import { ChevronDown, Check } from "lucide-react";

export interface SelectOption<T = string | number> {
  value: T;
  label: string;
}

interface SelectProps<T = string | number> {
  value: T;
  onChange: (value: T) => void;
  options: SelectOption<T>[];
  placeholder?: string;
  className?: string;
  buttonClassName?: string;
  menuClassName?: string;
  id?: string;
  name?: string;
}

export function Select<T extends string | number>({
  value,
  onChange,
  options,
  placeholder = "Select...",
  className = "",
  buttonClassName = "",
  menuClassName = "",
}: SelectProps<T>): React.ReactElement {
  const [isOpen, setIsOpen] = useState(false);

  const selectedOption = options.find((o) => o.value === value);
  const displayLabel = selectedOption ? selectedOption.label : placeholder;

  const handleSelect = (val: T) => {
    onChange(val);
    setIsOpen(false);
  };

  return (
    <div className={`relative inline-block ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg border border-[#E5E6EB] bg-white text-xs font-medium text-[#252735] hover:bg-[#F7F7F4] focus:outline-none focus:border-[#5553B7] focus:ring-1 focus:ring-[#5553B7] transition-all cursor-pointer shadow-2xs ${buttonClassName}`}
      >
        <span className="truncate">{displayLabel}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-[#747683] flex-shrink-0 transition-transform duration-150 ${
            isOpen ? "rotate-180 text-[#5553B7]" : ""
          }`}
        />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-20 cursor-default"
            onClick={() => setIsOpen(false)}
          />
          <div
            className={`absolute left-0 top-full mt-1 min-w-full w-max max-w-[280px] max-h-60 overflow-y-auto rounded-lg bg-white border border-[#E5E6EB] shadow-lg py-1 z-30 focus:outline-none ${menuClassName}`}
          >
            {options.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={String(opt.value)}
                  type="button"
                  onClick={() => handleSelect(opt.value)}
                  className={`w-full flex items-center justify-between gap-3 px-3 py-2 text-xs text-left transition-colors cursor-pointer ${
                    isSelected
                      ? "bg-[#EFEEF9] text-[#5553B7] font-semibold"
                      : "text-[#252735] hover:bg-[#F7F7F4]"
                  }`}
                >
                  <span className="truncate">{opt.label}</span>
                  {isSelected && (
                    <Check className="w-3.5 h-3.5 text-[#5553B7] flex-shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
