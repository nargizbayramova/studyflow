import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/shared/api/client";
import { notifyRebalanceNeeded } from "@/features/calendar/hooks/useSchedule";
import { Task, TaskCreatePayload, TaskFilters, TaskUpdatePayload } from "@/features/tasks/types";

export const taskKeys = {
  all: ["tasks"] as const,
  lists: () => [...taskKeys.all, "list"] as const,
  list: (filters?: TaskFilters) => [...taskKeys.lists(), filters] as const,
  details: () => [...taskKeys.all, "detail"] as const,
  detail: (id: number) => [...taskKeys.details(), id] as const,
};

export function useTasks(filters?: TaskFilters, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: taskKeys.list(filters),
    queryFn: () =>
      apiClient<Task[]>("/tasks", {
        params: filters as Record<string, string | number | boolean>,
      }),
    enabled: options?.enabled,
  });
}

export function useTask(id: number) {
  return useQuery({
    queryKey: taskKeys.detail(id),
    queryFn: () => apiClient<Task>(`/tasks/${id}`),
    enabled: !!id,
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (newTask: TaskCreatePayload) =>
      apiClient<Task>("/tasks", {
        method: "POST",
        body: JSON.stringify(newTask),
      }),
    onSuccess: () => {
      notifyRebalanceNeeded(
        "New task deadline added — rebalance your schedule to allocate study sessions."
      );
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: TaskUpdatePayload }) =>
      apiClient<Task>(`/tasks/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: (_, { id, data }) => {
      if (data.status && data.status !== "completed") {
        notifyRebalanceNeeded(
          "Task reopened as incomplete — rebalance your schedule to fit remaining effort."
        );
      } else if (data.due_date || data.estimated_hours) {
        notifyRebalanceNeeded(
          "Task deadline or effort updated — rebalance your schedule to adjust study blocks."
        );
      }
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(id) });
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      apiClient<void>(`/tasks/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
    },
  });
}

export function usePrioritizeTasks() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (semester?: string) =>
      apiClient<Task[]>("/tasks/prioritize", {
        method: "POST",
        params: semester ? { semester } : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
    },
  });

  return {
    ...mutation,
    prioritizeTasks: mutation.mutateAsync,
    isPrioritizing: mutation.isPending,
  };
}
