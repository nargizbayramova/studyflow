import React from "react";
import { Search, ArrowDownWideNarrow } from "lucide-react";
import { Course, TaskPriority, TaskStatus, TaskType } from "@/types";

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
      <div className="flex flex-wrap items-center gap-2.5">
        <select
          value={selectedCourseId || ""}
          onChange={(e) => onCourseChange(e.target.value ? Number(e.target.value) : undefined)}
          className="h-9 px-3 rounded-lg border border-[#E5E6EB] text-xs font-medium text-[#252735] bg-white hover:bg-slate-50 focus:outline-none focus:border-[#5553B7] cursor-pointer"
        >
          <option value="">All courses</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.code}
            </option>
          ))}
        </select>

        <select
          value={selectedType || ""}
          onChange={(e) => onTypeChange((e.target.value as TaskType) || undefined)}
          className="h-9 px-3 rounded-lg border border-[#E5E6EB] text-xs font-medium text-[#252735] bg-white hover:bg-slate-50 focus:outline-none focus:border-[#5553B7] cursor-pointer"
        >
          <option value="">All types</option>
          <option value="assignment">Assignment</option>
          <option value="exam">Exam</option>
          <option value="quiz">Quiz</option>
          <option value="project_milestone">Project milestone</option>
        </select>

        <select
          value={selectedStatus || ""}
          onChange={(e) => onStatusChange((e.target.value as TaskStatus) || undefined)}
          className="h-9 px-3 rounded-lg border border-[#E5E6EB] text-xs font-medium text-[#252735] bg-white hover:bg-slate-50 focus:outline-none focus:border-[#5553B7] cursor-pointer"
        >
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="in_progress">In progress</option>
          <option value="completed">Completed</option>
        </select>

        <select
          value={selectedPriority || ""}
          onChange={(e) => onPriorityChange((e.target.value as TaskPriority) || undefined)}
          className="h-9 px-3 rounded-lg border border-[#E5E6EB] text-xs font-medium text-[#252735] bg-white hover:bg-slate-50 focus:outline-none focus:border-[#5553B7] cursor-pointer"
        >
          <option value="">All priorities</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>
    </div>
  );
};
