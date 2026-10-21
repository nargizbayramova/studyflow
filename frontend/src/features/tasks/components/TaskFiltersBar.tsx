import React from "react";
import { Search, ArrowDownWideNarrow } from "lucide-react";
import { Course, TaskPriority, TaskStatus, TaskType } from "@/types";
import { Select } from "@/components/common/Select";

interface TaskFiltersBarProps {
  search: string;
  onSearchChange: (v: string) => void;
  courses: Course[];
  selectedCourseId?: number;
  onCourseChange: (id?: number) => void;
  selectedType?: TaskType;
  onTypeChange: (t?: TaskType) => void;
  selectedStatus?: TaskStatus;
  onStatusChange: (s?: TaskStatus) => void;
  selectedPriority?: TaskPriority;
  onPriorityChange: (p?: TaskPriority) => void;
  sortByEarliest: boolean;
  onToggleSort: () => void;
}

const TYPE_OPTIONS = [
  { value: "", label: "All types" },
  { value: "assignment", label: "Assignment" },
  { value: "exam", label: "Exam" },
  { value: "quiz", label: "Quiz" },
  { value: "project_milestone", label: "Project milestone" },
];

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "in_progress", label: "In progress" },
  { value: "completed", label: "Completed" },
];

const PRIORITY_OPTIONS = [
  { value: "", label: "All priorities" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

export const TaskFiltersBar: React.FC<TaskFiltersBarProps> = ({
  search,
  onSearchChange,
  courses,
  selectedCourseId,
  onCourseChange,
  selectedType,
  onTypeChange,
  selectedStatus,
  onStatusChange,
  selectedPriority,
  onPriorityChange,
  sortByEarliest,
  onToggleSort,
}) => {
  const courseOptions = [
    { value: "", label: "All courses" },
    ...courses.map((c) => ({ value: String(c.id), label: c.code })),
  ];

  return (
    <div className="flex flex-col gap-3">
      {/* Search and Sort row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-[#747683] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search task titles…"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full h-11 pl-10 pr-3.5 rounded-lg border border-[#E5E6EB] text-sm text-[#252735] placeholder-[#747683]/60 focus:outline-none focus:border-[#5553B7] focus:ring-1 focus:ring-[#5553B7] bg-white transition-all"
          />
        </div>

        <button
          onClick={onToggleSort}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-white border border-[#E5E6EB] text-xs font-semibold text-[#252735] hover:bg-slate-50 transition-colors shadow-sm cursor-pointer whitespace-nowrap"
        >
          <ArrowDownWideNarrow className="w-4 h-4 text-[#747683]" />
          <span>Due date: {sortByEarliest ? "earliest first" : "latest first"}</span>
        </button>
      </div>

      {/* Select Filters row */}
      <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2.5">
        <Select
          value={selectedCourseId ? String(selectedCourseId) : ""}
          onChange={(val) => onCourseChange(val ? Number(val) : undefined)}
          options={courseOptions}
          className="w-full sm:w-auto"
        />

        <Select
          value={selectedType || ""}
          onChange={(val) => onTypeChange((val as TaskType) || undefined)}
          options={TYPE_OPTIONS}
          className="w-full sm:w-auto"
        />

        <Select
          value={selectedStatus || ""}
          onChange={(val) => onStatusChange((val as TaskStatus) || undefined)}
          options={STATUS_OPTIONS}
          className="w-full sm:w-auto"
        />

        <Select
          value={selectedPriority || ""}
          onChange={(val) => onPriorityChange((val as TaskPriority) || undefined)}
          options={PRIORITY_OPTIONS}
          className="w-full sm:w-auto"
        />
      </div>
    </div>
  );
};
