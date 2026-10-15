import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "./client";
import { AvailabilitySlot, SlotCreatePayload, SlotUpdatePayload } from "@/types";

export const availabilityKeys = {
  all: ["availability"] as const,
  list: () => [...availabilityKeys.all, "list"] as const,
  detail: (id: number) => [...availabilityKeys.all, "detail", id] as const,
};

export function useAvailabilitySlots() {
  return useQuery({
    queryKey: availabilityKeys.list(),
    queryFn: () => apiClient<AvailabilitySlot[]>("/availability"),
  });
}

export function useCreateSlot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (newSlot: SlotCreatePayload) =>
      apiClient<AvailabilitySlot>("/availability", {
        method: "POST",
        body: JSON.stringify(newSlot),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: availabilityKeys.list() });
    },
  });
}

export function useUpdateSlot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: SlotUpdatePayload }) =>
      apiClient<AvailabilitySlot>(`/availability/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: availabilityKeys.list() });
    },
  });
}

export function useDeleteSlot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      apiClient<void>(`/availability/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: availabilityKeys.list() });
    },
  });
}
