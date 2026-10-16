import React, { forwardRef } from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, leftIcon, rightIcon, className, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-[13px] font-semibold text-[#252735]">
            {label}
          </label>
        )}
        <div className="relative rounded-lg">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#747683]">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={twMerge(
              clsx(
                "block w-full h-[46px] rounded-lg border text-sm text-[#252735] transition-all focus:outline-none focus:ring-1 bg-white",
                leftIcon ? "pl-10" : "pl-3.5",
                rightIcon ? "pr-10" : "pr-3.5",
                error
                  ? "border-rose-300 text-rose-900 focus:border-rose-500 focus:ring-rose-500/20"
                  : "border-[#E5E6EB] placeholder-[#747683]/60 focus:border-[#5553B7] focus:ring-[#5553B7]",
                className
              )
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-[#747683]">
              {rightIcon}
            </div>
          )}
        </div>
        {error && <p className="text-xs text-rose-600">{error}</p>}
        {!error && helperText && <p className="text-xs text-[#747683]">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
