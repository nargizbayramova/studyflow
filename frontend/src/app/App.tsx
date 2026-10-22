import React from "react";
import { AppProviders } from "@/app/providers";
import { AppRoutes } from "@/app/routes";
import { ErrorBoundary } from "@/shared/ui/ErrorBoundary";

export const App: React.FC = () => (
  <ErrorBoundary>
    <AppProviders>
      <AppRoutes />
    </AppProviders>
  </ErrorBoundary>
);

export default App;
