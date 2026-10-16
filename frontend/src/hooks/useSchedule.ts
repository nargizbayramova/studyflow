import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import { studyBlockKeys } from "@/api/studyBlocks";
import { useWorkspace } from "@/context/WorkspaceContext";
import { BlockStatus, ScheduleResponse, StudyBlock } from "@/types";

export const scheduleKeys = {
  all: ["schedule"] as const,
  bySemester: (semester?: string) => [...scheduleKeys.all, semester] as const,
};

export function useSchedule() {
  const { workspace } = useWorkspace();
  const queryClient = useQueryClient();
  const [overloadWarning, setOverloadWarning] = useState(false);
  const [lastGenerated, setLastGenerated] = useState<ScheduleResponse | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const scheduleQuery = useQuery({
    queryKey: scheduleKeys.bySemester(workspace),
    queryFn: () =>
      apiClient<ScheduleResponse>("/schedule", {
        params: workspace ? { semester: workspace } : undefined,
      }),
  });

  const generateMutation = useMutation({
    mutationFn: () =>
      apiClient<ScheduleResponse>("/schedule/generate", {
        method: "POST",
        params: workspace ? { semester: workspace } : undefined,
      }),
    onMutate: () => setActionError(null),
    onSuccess: (data) => {
      setOverloadWarning(data.overload_warning);
      setLastGenerated(data);
      queryClient.setQueryData(scheduleKeys.bySemester(workspace), data);
      queryClient.invalidateQueries({ queryKey: studyBlockKeys.lists() });
    },
    onError: (err: unknown) => {
      setActionError(err instanceof Error ? err.message : "Failed to generate AI schedule");
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: BlockStatus }) =>
      apiClient<StudyBlock>(`/study-blocks/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: scheduleKeys.all });
      queryClient.invalidateQueries({ queryKey: studyBlockKeys.lists() });
    },
    onError: (err: unknown) => {
      setActionError(err instanceof Error ? err.message : "Failed to update study block");
    },
  });

  const toggleBlockStatus = async (block: StudyBlock) => {
    const nextStatus: BlockStatus = block.status === "completed" ? "planned" : "completed";
    await toggleMutation.mutateAsync({ id: block.id, status: nextStatus });
  };

  const queryError =
    scheduleQuery.error instanceof Error ? scheduleQuery.error.message : null;

  return {
    blocks: scheduleQuery.data?.study_blocks ?? [],
    overloadWarning: overloadWarning || (scheduleQuery.data?.overload_warning ?? false),
    lastGenerated,
    clearLastGenerated: () => setLastGenerated(null),
    isGenerating: generateMutation.isPending,
    error: actionError || queryError,
    fetchSchedule: scheduleQuery.refetch,
    generateSchedule: () => generateMutation.mutateAsync(),
    toggleBlockStatus,
  };
}
