import React from "react";
import { Task, TaskCreatePayload } from "@/features/tasks/types";
import { Course } from "@/features/courses/types";
import { Modal } from "@/shared/ui/Modal";
import { TaskForm } from "./TaskForm";

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: TaskCreatePayload) => Promise<void>;
  onDelete?: (id: number) => Promise<void>;
  initialData?: Task | null;
  courses: Course[];
  defaultCourseId?: number;
}

// Modal unmounts its children when closed, so TaskForm state resets on every open.
export const TaskModal: React.FC<TaskModalProps> = ({ isOpen, onClose, initialData, ...rest }) => (
  <Modal isOpen={isOpen} onClose={onClose} title={initialData ? "Edit task" : "Add task"}>
    <TaskForm initialData={initialData} onClose={onClose} {...rest} />
  </Modal>
);
