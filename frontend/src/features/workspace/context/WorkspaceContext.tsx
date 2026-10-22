import React, { createContext, useContext, useState } from "react";
import { useSemesters } from "@/features/courses/api/courses";
import { useAuth } from "@/features/auth/context/AuthContext";

interface WorkspaceContextType {
  workspace: string;
  workspaces: string[];
  setWorkspace: (ws: string) => void;
  addWorkspace: (ws: string) => void;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

const STORAGE_KEY = "studyflow_workspace";
const DEFAULT_WORKSPACE = "Fall 2026";

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const { data: serverSemesters = [] } = useSemesters({ enabled: isAuthenticated });
  const [workspaceState, setWorkspaceState] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY) || DEFAULT_WORKSPACE;
  });
  const [customWorkspaces, setCustomWorkspaces] = useState<string[]>([]);

  const activeWorkspace =
    serverSemesters.length > 0 &&
    !serverSemesters.includes(workspaceState) &&
    !customWorkspaces.includes(workspaceState)
      ? serverSemesters[0]
      : workspaceState;

  const setWorkspace = (ws: string) => {
    const trimmed = ws.trim();
    if (!trimmed) return;
    if (!serverSemesters.includes(trimmed) && !customWorkspaces.includes(trimmed)) {
      setCustomWorkspaces((prev) => [...prev, trimmed]);
    }
    setWorkspaceState(trimmed);
    localStorage.setItem(STORAGE_KEY, trimmed);
  };

  const addWorkspace = (ws: string) => {
    const trimmed = ws.trim();
    if (!trimmed) return;
    if (!customWorkspaces.includes(trimmed)) {
      setCustomWorkspaces((prev) => [...prev, trimmed]);
    }
    setWorkspaceState(trimmed);
    localStorage.setItem(STORAGE_KEY, trimmed);
  };

  const allWorkspaces = Array.from(
    new Set([activeWorkspace, ...serverSemesters, ...customWorkspaces, "Spring 2027", "Fall 2025"])
  ).filter(Boolean);

  return (
    <WorkspaceContext.Provider
      value={{
        workspace: activeWorkspace,
        workspaces: allWorkspaces,
        setWorkspace,
        addWorkspace,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = (): WorkspaceContextType => {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider");
  }
  return context;
};
