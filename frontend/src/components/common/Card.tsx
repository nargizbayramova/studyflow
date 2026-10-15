import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  hoverable = false,
  ...props
}) => {
  return (
    <div
      className={twMerge(
        clsx(
          "bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6",
          hoverable && "transition-shadow hover:shadow-md cursor-pointer",
          className
        )
      )}
      {...props}
    >
      {children}
    </div>
  );
};
