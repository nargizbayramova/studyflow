import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient, getAuthToken, removeAuthToken, setAuthToken } from "@/shared/api/client";
import { AuthToken, User } from "@/features/auth/types";

export const authKeys = {
  all: ["auth"] as const,
  me: () => [...authKeys.all, "me"] as const,
};

export function useMe(options?: { enabled?: boolean }) {
  const token = getAuthToken();
  return useQuery({
    queryKey: authKeys.me(),
    queryFn: () => apiClient<User>("/auth/me"),
    retry: false,
    enabled: options?.enabled !== undefined ? options.enabled : Boolean(token),
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      const formData = new URLSearchParams();
      formData.append("grant_type", "password");
      formData.append("username", credentials.username);
      formData.append("password", credentials.password);

      const res = await apiClient<AuthToken>("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData.toString(),
      });
      setAuthToken(res.access_token);
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authKeys.me() });
    },
  });
}

export function useRegister() {
  return useMutation({
    mutationFn: (data: { email: string; password: string; full_name: string }) =>
      apiClient<User>("/auth/register", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  });
}

export function useUpdateMe() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { full_name?: string; password?: string }) =>
      apiClient<User>("/auth/me", {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authKeys.me() });
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return () => {
    removeAuthToken();
    queryClient.clear();
  };
}
