import React, { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ToastProvider } from "@/context/ToastContext";
import { AuthProvider } from "@/context/AuthContext";
import { WorkspaceProvider } from "@/context/WorkspaceContext";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import { Spinner } from "@/components/common/Spinner";

const LoginPage = lazy(() => import("@/features/auth/LoginPage").then((m) => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import("@/features/auth/RegisterPage").then((m) => ({ default: m.RegisterPage })));
const DashboardPage = lazy(() => import("@/features/dashboard/DashboardPage").then((m) => ({ default: m.DashboardPage })));
const CoursesPage = lazy(() => import("@/features/courses/CoursesPage").then((m) => ({ default: m.CoursesPage })));
const CourseDetailPage = lazy(() => import("@/features/courses/CourseDetailPage").then((m) => ({ default: m.CourseDetailPage })));
const TasksPage = lazy(() => import("@/features/tasks/TasksPage").then((m) => ({ default: m.TasksPage })));
const CalendarPage = lazy(() => import("@/features/calendar/CalendarPage").then((m) => ({ default: m.CalendarPage })));
const AvailabilityPage = lazy(() => import("@/features/availability/AvailabilityPage").then((m) => ({ default: m.AvailabilityPage })));
const ProfilePage = lazy(() => import("@/features/profile/ProfilePage").then((m) => ({ default: m.ProfilePage })));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 minutes
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ToastProvider>
          <AuthProvider>
            <WorkspaceProvider>
              <Suspense
                fallback={
                  <div className="h-64 flex items-center justify-center">
                    <Spinner size="lg" />
                  </div>
                }
              >
                <Routes>
                  {/* Public Auth Routes */}
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />

                  {/* Protected App Routes */}
                  <Route element={<ProtectedRoute />}>
                    <Route element={<AppLayout />}>
                      <Route path="/" element={<DashboardPage />} />
                      <Route path="/courses" element={<CoursesPage />} />
                      <Route path="/courses/:id" element={<CourseDetailPage />} />
                      <Route path="/tasks" element={<TasksPage />} />
                      <Route path="/calendar" element={<CalendarPage />} />
                      <Route path="/availability" element={<AvailabilityPage />} />
                      <Route path="/profile" element={<ProfilePage />} />
                    </Route>
                  </Route>

                  {/* Fallback */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Suspense>
            </WorkspaceProvider>
          </AuthProvider>
        </ToastProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};
export default App;
