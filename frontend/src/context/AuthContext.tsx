import React, { createContext, useContext, useEffect } from "react";
import { useLogin, useLogout, useMe } from "@/api/auth";
import { getAuthToken } from "@/api/client";
import { User } from "@/types";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: { username: string; password: string }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const token = getAuthToken();
  const { data: user, isLoading: isUserLoading, refetch } = useMe();
  const loginMutation = useLogin();
  const logoutFn = useLogout();

  useEffect(() => {
    const handleUnauthorized = () => {
      logoutFn();
    };
    window.addEventListener("auth:unauthorized", handleUnauthorized);
    return () => window.removeEventListener("auth:unauthorized", handleUnauthorized);
  }, [logoutFn]);

  const login = async (credentials: { username: string; password: string }) => {
    await loginMutation.mutateAsync(credentials);
    await refetch();
  };

  const logout = () => {
    logoutFn();
  };

  const isAuthenticated = !!token && !!user;
  const isLoading = !!token && isUserLoading;

  return (
    <AuthContext.Provider
      value={{
        user: user || null,
        isLoading,
        isAuthenticated,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
