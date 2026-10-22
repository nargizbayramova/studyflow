import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/shared/api/client";
import { StudyBlock, StudyBlockCreatePayload, StudyBlockFilters, StudyBlockUpdatePayload } from "@/features/calendar/types";

export const studyBlockKeys = {
  all: ["study-blocks"] as const,
  lists: () => [...studyBlockKeys.all, "list"] as const,
  list: (filters?: StudyBlockFilters) => [...studyBlockKeys.lists(), filters] as const,
  details: () => [...studyBlockKeys.all, "detail"] as const,
  detail: (id: number) => [...studyBlockKeys.details(), id] as const,
};

export function useStudyBlocks(filters?: StudyBlockFilters) {
  return useQuery({
    queryKey: studyBlockKeys.list(filters),
    queryFn: () =>
      apiClient<StudyBlock[]>("/study-blocks", {
        params: filters as Record<string, string | number | boolean>,
      }),
  });
}

export function useStudyBlock(id: number) {
  return useQuery({
    queryKey: studyBlockKeys.detail(id),
    queryFn: () => apiClient<StudyBlock>(`/study-blocks/${id}`),
    enabled: !!id,
  });
}

export function useCreateStudyBlock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (newBlock: StudyBlockCreatePayload) =>
      apiClient<StudyBlock>("/study-blocks", {
        method: "POST",
        body: JSON.stringify(newBlock),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: studyBlockKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ["schedule"] });
    },
  });
}

export function useUpdateStudyBlock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: StudyBlockUpdatePayload }) =>
      apiClient<StudyBlock>(`/study-blocks/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: studyBlockKeys.lists() });
      queryClient.invalidateQueries({ queryKey: studyBlockKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: ["schedule"] });
    },
  });
}

export function useDeleteStudyBlock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      apiClient<void>(`/study-blocks/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: studyBlockKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ["schedule"] });
    },
  });
}
