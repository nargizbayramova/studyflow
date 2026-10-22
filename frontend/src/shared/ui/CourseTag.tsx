import React from "react";

interface CourseTagProps {
  code: string;
  color?: string;
  className?: string;
}

export const CourseTag: React.FC<CourseTagProps> = ({
  code,
  color = "#6561BD",
  className = "",
}) => {
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-medium ${className}`}
      style={{ color }}
    >
      <span
        className="w-[7px] h-[7px] rounded-[2px] flex-shrink-0"
        style={{ backgroundColor: color }}
      />
      <span>{code}</span>
    </span>
  );
};
