import React, { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "@/features/auth/components/ProtectedRoute";
import { AppLayout } from "@/app/layout/AppLayout";
import { Spinner } from "@/shared/ui/Spinner";

// Route-level code splitting: each page ships as its own chunk.
const page = <K extends string>(load: () => Promise<Record<K, React.ComponentType>>, name: K) =>
  lazy(() => load().then((m) => ({ default: m[name] })));

const LoginPage = page(() => import("@/features/auth/LoginPage"), "LoginPage");
const RegisterPage = page(() => import("@/features/auth/RegisterPage"), "RegisterPage");
const DashboardPage = page(() => import("@/features/dashboard/DashboardPage"), "DashboardPage");
const CoursesPage = page(() => import("@/features/courses/CoursesPage"), "CoursesPage");
const CourseDetailPage = page(() => import("@/features/courses/CourseDetailPage"), "CourseDetailPage");
const TasksPage = page(() => import("@/features/tasks/TasksPage"), "TasksPage");
const CalendarPage = page(() => import("@/features/calendar/CalendarPage"), "CalendarPage");
const AvailabilityPage = page(() => import("@/features/availability/AvailabilityPage"), "AvailabilityPage");
const ProfilePage = page(() => import("@/features/profile/ProfilePage"), "ProfilePage");

export const AppRoutes: React.FC = () => (
  <Suspense
    fallback={
      <div className="h-64 flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    }
  >
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

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

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </Suspense>
);
