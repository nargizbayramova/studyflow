import React from "react";
import { Modal } from "@/shared/ui/Modal";
import { CourseForm, CourseFormProps } from "./CourseForm";

interface CourseModalProps extends CourseFormProps {
  isOpen: boolean;
}

// Modal unmounts its children when closed, so CourseForm state resets on every open.
export const CourseModal: React.FC<CourseModalProps> = ({ isOpen, onClose, initialData, ...rest }) => (
  <Modal isOpen={isOpen} onClose={onClose} title={initialData ? "Edit course" : "Add course"}>
    <CourseForm onClose={onClose} initialData={initialData} {...rest} />
  </Modal>
);
