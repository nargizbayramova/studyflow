import React from "react";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { useAuth } from "@/features/auth/context/AuthContext";
import { useWorkspace } from "@/features/workspace/context/WorkspaceContext";
import { useCourses } from "@/features/courses/api/courses";
import { useTasks } from "@/features/tasks/api/tasks";
import { useStudyBlocks } from "@/features/calendar/api/studyBlocks";
import { useAvailabilitySlots } from "@/features/availability/api/availability";
import { Spinner } from "@/shared/ui/Spinner";
import { PlanningGuide } from "./components/PlanningGuide";
import { DashboardStats } from "./components/DashboardStats";
import { TodayStudyPlan } from "./components/TodayStudyPlan";
import { ComingUpNext } from "./components/ComingUpNext";
import { WorkloadAnalyticsPanel } from "./components/WorkloadAnalyticsPanel";
import { CourseProgressPanel } from "./components/CourseProgressPanel";

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { workspace } = useWorkspace();
  const { data: courses = [], isLoading: loadingCourses } = useCourses({ semester: workspace });
  const { data: tasks = [], isLoading: loadingTasks } = useTasks({ semester: workspace });
  const { data: studyBlocks = [], isLoading: loadingBlocks } = useStudyBlocks({ semester: workspace });
  const { data: slots = [] } = useAvailabilitySlots();

  if (loadingCourses || loadingTasks || loadingBlocks) {
    return (
      <div className="h-64 flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  const firstName = user?.full_name?.split(" ")[0] || "Student";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="flex flex-col gap-5 sm:gap-7 max-w-7xl mx-auto font-sans">
      {/* Top greeting row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl sm:text-[30px] font-normal text-[#252735] tracking-tight">
            {greeting}, {firstName}
          </h1>
          <p className="text-xs sm:text-sm text-[#747683]">
            A little focus today goes a long way. Here’s your week at a glance.
          </p>
        </div>

        <Link
          to="/tasks"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#5553B7] hover:bg-[#48469F] text-white text-sm font-semibold transition-colors shadow-sm self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add task</span>
        </Link>
      </div>

      {/* Planning guide */}
      <PlanningGuide />

      {/* 4 Stat Panels */}
      <DashboardStats tasks={tasks} courses={courses} studyBlocks={studyBlocks} />

      {/* Daily focus & upcoming deadlines */}
      <div className="flex flex-col lg:flex-row items-stretch gap-6">
        <TodayStudyPlan studyBlocks={studyBlocks} courses={courses} tasks={tasks} />
        <ComingUpNext tasks={tasks} courses={courses} />
      </div>

      {/* Visual workload analytics & high-stress week warnings (FR-14) */}
      <WorkloadAnalyticsPanel tasks={tasks} studyBlocks={studyBlocks} slots={slots} />

      {/* Course progress */}
      <CourseProgressPanel courses={courses} tasks={tasks} />
    </div>
  );
};
