import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import { studyBlockKeys } from "@/api/studyBlocks";
import { useWorkspace } from "@/context/WorkspaceContext";
import { BlockStatus, ScheduleResponse, StudyBlock } from "@/types";

const REBALANCE_STORAGE_KEY = "studyflow_rebalance_prompt";
const REBALANCE_EVENT = "schedule:rebalance-prompt";

export function notifyRebalanceNeeded(reason: string): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(REBALANCE_STORAGE_KEY, reason);
  window.dispatchEvent(new CustomEvent(REBALANCE_EVENT, { detail: reason }));
}

export function clearRebalanceNeeded(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(REBALANCE_STORAGE_KEY);
  window.dispatchEvent(new CustomEvent(REBALANCE_EVENT, { detail: null }));
}

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
  const [rebalancePrompt, setRebalancePrompt] = useState<string | null>(() =>
    typeof window !== "undefined" ? sessionStorage.getItem(REBALANCE_STORAGE_KEY) : null
  );

  useEffect(() => {
    const handler = (e: Event) => {
      const custom = e as CustomEvent<string | null>;
      setRebalancePrompt(custom.detail ?? null);
    };
    window.addEventListener(REBALANCE_EVENT, handler);
    return () => window.removeEventListener(REBALANCE_EVENT, handler);
  }, []);

  const scheduleQuery = useQuery({
    queryKey: scheduleKeys.bySemester(workspace),
    queryFn: () =>
      apiClient<ScheduleResponse>("/schedule", {
        params: workspace ? { semester: workspace } : undefined,
      }),
  });

  const handleScheduleSuccess = (data: ScheduleResponse) => {
    setOverloadWarning(data.overload_warning);
    setLastGenerated(data);
    clearRebalanceNeeded();
    queryClient.setQueryData(scheduleKeys.bySemester(workspace), data);
    queryClient.invalidateQueries({ queryKey: studyBlockKeys.lists() });
  };

  const generateMutation = useMutation({
    mutationFn: () =>
      apiClient<ScheduleResponse>("/schedule/generate", {
        method: "POST",
        params: {
          tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
          ...(workspace ? { semester: workspace } : {}),
        },
      }),
    onMutate: () => setActionError(null),
    onSuccess: handleScheduleSuccess,
    onError: (err: unknown) => {
      setActionError(err instanceof Error ? err.message : "Failed to generate AI schedule");
    },
  });

  const rebalanceMutation = useMutation({
    mutationFn: () =>
      apiClient<ScheduleResponse>("/schedule/rebalance", {
        method: "POST",
        params: {
          tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
          ...(workspace ? { semester: workspace } : {}),
        },
      }),
    onMutate: () => setActionError(null),
    onSuccess: handleScheduleSuccess,
    onError: (err: unknown) => {
      setActionError(err instanceof Error ? err.message : "Failed to rebalance schedule");
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: BlockStatus | "pending" }) =>
      apiClient<StudyBlock>(`/schedule/blocks/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }),
    onSuccess: (_, { status }) => {
      if (status === "missed") {
        notifyRebalanceNeeded(
          "Session marked as missed — rebalance your schedule to redistribute remaining hours."
        );
      }
      queryClient.invalidateQueries({ queryKey: scheduleKeys.all });
      queryClient.invalidateQueries({ queryKey: studyBlockKeys.lists() });
    },
    onError: (err: unknown) => {
      setActionError(err instanceof Error ? err.message : "Failed to update study block");
    },
  });

  const updateBlockStatus = async (block: StudyBlock, status: BlockStatus | "pending") => {
    await statusMutation.mutateAsync({ id: block.id, status });
  };

  const toggleBlockStatus = async (block: StudyBlock) => {
    const nextStatus: BlockStatus = block.status === "completed" ? "planned" : "completed";
    await updateBlockStatus(block, nextStatus);
  };

  const queryError =
    scheduleQuery.error instanceof Error ? scheduleQuery.error.message : null;

  return {
    blocks: scheduleQuery.data?.study_blocks ?? [],
    overloadWarning: overloadWarning || (scheduleQuery.data?.overload_warning ?? false),
    lastGenerated,
    clearLastGenerated: () => setLastGenerated(null),
    isGenerating: generateMutation.isPending,
    isRebalancing: rebalanceMutation.isPending,
    rebalancePrompt,
    dismissRebalancePrompt: clearRebalanceNeeded,
    error: actionError || queryError,
    fetchSchedule: scheduleQuery.refetch,
    generateSchedule: () => generateMutation.mutateAsync(),
    rebalanceSchedule: () => rebalanceMutation.mutateAsync(),
    updateBlockStatus,
    toggleBlockStatus,
  };
}
