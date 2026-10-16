import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "./client";
import { Course, CourseCreatePayload, CourseUpdatePayload } from "@/types";

export const courseKeys = {
  all: ["courses"] as const,
  lists: () => [...courseKeys.all, "list"] as const,
  list: (filters?: { semester?: string; include_archived?: boolean }) =>
    [...courseKeys.lists(), filters] as const,
  details: () => [...courseKeys.all, "detail"] as const,
  detail: (id: number) => [...courseKeys.details(), id] as const,
};

export function useCourses(
  filters?: { semester?: string; include_archived?: boolean },
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: courseKeys.list(filters),
    queryFn: () =>
      apiClient<Course[]>("/courses", {
        params: filters,
      }),
    enabled: options?.enabled,
  });
}

export function useCourse(id: number) {
  return useQuery({
    queryKey: courseKeys.detail(id),
    queryFn: () => apiClient<Course>(`/courses/${id}`),
    enabled: !!id,
  });
}

export function useSemesters(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: [...courseKeys.all, "semesters"],
    queryFn: () => apiClient<string[]>("/courses/semesters"),
    enabled: options?.enabled,
  });
}

export function useCreateCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (newCourse: CourseCreatePayload) =>
      apiClient<Course>("/courses", {
        method: "POST",
        body: JSON.stringify(newCourse),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: courseKeys.lists() });
    },
  });
}

export function useUpdateCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: CourseUpdatePayload }) =>
      apiClient<Course>(`/courses/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: courseKeys.lists() });
      queryClient.invalidateQueries({ queryKey: courseKeys.detail(id) });
    },
  });
}

export function useDeleteCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      apiClient<void>(`/courses/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: courseKeys.lists() });
    },
  });
}
