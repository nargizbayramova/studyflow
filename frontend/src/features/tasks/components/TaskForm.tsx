import React from "react";
import { Task, TaskCreatePayload } from "@/features/tasks/types";
import { Course } from "@/features/courses/types";
import { Input } from "@/shared/ui/Input";
import { Button } from "@/shared/ui/Button";
import { Select } from "@/shared/ui/Select";
import { useTaskForm } from "../hooks/useTaskForm";
import { TASK_PRIORITY_OPTIONS, TASK_STATUS_OPTIONS, TASK_TYPE_OPTIONS } from "../utils/taskForm";

interface Props {
  initialData?: Task | null;
  courses: Course[];
  defaultCourseId?: number;
  onSubmit: (data: TaskCreatePayload) => Promise<void>;
  onDelete?: (id: number) => Promise<void>;
  onClose: () => void;
}

const LABEL = "text-[13px] font-semibold text-[#252735]";

export const TaskForm: React.FC<Props> = (props) => {
  const { initialData, courses, onDelete, onClose } = props;
  const { values: v, set, loading, error, submit, remove } = useTaskForm(props);

  return (
    <form onSubmit={submit} className="flex flex-col gap-3.5">
      {error && <div className="p-2.5 rounded-lg bg-rose-50 text-rose-700 text-xs font-medium">{error}</div>}

      <Input label="Task title" required placeholder="Problem set 4" value={v.title} onChange={(e) => set("title", e.target.value)} />

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className={LABEL}>Course</label>
          <Select
            value={v.courseId ? String(v.courseId) : ""}
            onChange={(val) => set("courseId", val ? Number(val) : 0)}
            options={[
              { value: "", label: "Select course" },
              ...courses.map((c) => ({ value: String(c.id), label: `${c.code} - ${c.title}` })),
            ]}
            className="w-full"
            buttonClassName="h-[46px] text-sm font-normal"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={LABEL}>Task type</label>
          <Select
            value={v.type}
            onChange={(val) => set("type", val)}
            options={TASK_TYPE_OPTIONS}
            className="w-full"
            buttonClassName="h-[46px] text-sm font-normal"
          />
        </div>
      </div>

      <Input label="Due date & time" type="datetime-local" required value={v.dueDate} onChange={(e) => set("dueDate", e.target.value)} />

      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Estimated effort (hours)"
          type="number"
          step="0.5"
          min="0.5"
          required
          value={v.estimatedHours}
          onChange={(e) => set("estimatedHours", Number(e.target.value))}
        />
        <Input
          label="Weight (% of final grade)"
          type="number"
          min="0"
          max="100"
          value={v.weightPercent}
          onChange={(e) => set("weightPercent", Number(e.target.value))}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className={LABEL}>Priority</label>
          <Select value={v.priority} onChange={(val) => set("priority", val)} options={TASK_PRIORITY_OPTIONS} className="w-full" buttonClassName="h-10 text-xs font-medium" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={LABEL}>Status</label>
          <Select value={v.status} onChange={(val) => set("status", val)} options={TASK_STATUS_OPTIONS} className="w-full" buttonClassName="h-10 text-xs font-medium" />
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-[#E5E6EB]">
        {initialData && onDelete ? (
          <button type="button" onClick={remove} className="text-xs text-rose-600 hover:underline cursor-pointer">
            Delete task
          </button>
        ) : (
          <div />
        )}
        <div className="flex items-center gap-2.5">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" isLoading={loading} className="bg-[#5553B7] hover:bg-[#48469F]">
            {initialData ? "Save changes" : "Create task"}
          </Button>
        </div>
      </div>
    </form>
  );
};
