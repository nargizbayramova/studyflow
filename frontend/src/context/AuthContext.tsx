import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();
  const location = useLocation();
  const [token, setToken] = useState<string | null>(() => getAuthToken());

  const isAuthPage = location.pathname === "/login" || location.pathname === "/register";
  const shouldFetchMe = Boolean(token && !isAuthPage);

  const { data: user, isLoading: isUserLoading, isError } = useMe({ enabled: shouldFetchMe });
  const loginMutation = useLogin();
  const logoutFn = useLogout();

  const logout = useCallback(() => {
    setToken(null);
    logoutFn();
    navigate("/login", { replace: true });
  }, [logoutFn, navigate]);

  useEffect(() => {
    const handleUnauthorized = () => {
      logout();
    };
    window.addEventListener("auth:unauthorized", handleUnauthorized);
    return () => window.removeEventListener("auth:unauthorized", handleUnauthorized);
  }, [logout]);

  const login = async (credentials: { username: string; password: string }) => {
    const res = await loginMutation.mutateAsync(credentials);
    setToken(res.access_token);
  };

  const isAuthenticated = Boolean(token && user);
  const isLoading = Boolean(token && !user && !isError && !isAuthPage) || Boolean(token && isUserLoading && !isAuthPage);

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
