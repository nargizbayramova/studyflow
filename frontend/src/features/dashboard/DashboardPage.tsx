import React from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  ArrowRight,
  Calendar,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useCourses } from "@/api/courses";
import { useTasks, useUpdateTask } from "@/api/tasks";
import { useStudyBlocks } from "@/api/studyBlocks";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/common/Card";
import { Badge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import { Spinner } from "@/components/common/Spinner";

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { data: courses = [], isLoading: loadingCourses } = useCourses();
  const { data: tasks = [], isLoading: loadingTasks } = useTasks();
  const { data: studyBlocks = [] } = useStudyBlocks();
  const updateTask = useUpdateTask();

  const pendingTasks = tasks.filter((t) => t.status !== "completed");
  const completedTasks = tasks.filter((t) => t.status === "completed");
  const upcomingTasks = [...pendingTasks].sort(
    (a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
  );

  const totalPlannedHours = studyBlocks
    .filter((b) => b.status === "planned")
    .reduce((acc, b) => {
      const dur = (new Date(b.end_at).getTime() - new Date(b.start_at).getTime()) / 3600000;
      return acc + dur;
    }, 0);

  const handleToggleTask = (task: typeof tasks[0]) => {
    updateTask.mutate({
      id: task.id,
      data: {
        status: task.status === "completed" ? "pending" : "completed",
      },
    });
  };

  const getCourse = (courseId: number) => courses.find((c) => c.id === courseId);

  return (
    <div className="space-y-8">
      <Header
        title={`Welcome back, ${user?.full_name?.split(" ")[0] || "Student"} 👋`}
        subtitle="Here is what's on your academic agenda today."
        actions={
          <div className="flex gap-2.5">
            <Link to="/tasks">
              <Button size="sm" variant="outline">
                <Plus className="w-4 h-4" /> Add Task
              </Button>
            </Link>
            <Link to="/calendar">
              <Button size="sm">
                <Calendar className="w-4 h-4" /> View Calendar
              </Button>
            </Link>
          </div>
        }
      />

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-primary-600 flex items-center justify-center">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Courses</p>
            <p className="text-2xl font-bold text-slate-900 mt-0.5">
              {loadingCourses ? "—" : courses.length}
            </p>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Pending Tasks</p>
            <p className="text-2xl font-bold text-slate-900 mt-0.5">
              {loadingTasks ? "—" : pendingTasks.length}
            </p>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Completed</p>
            <p className="text-2xl font-bold text-slate-900 mt-0.5">
              {loadingTasks ? "—" : completedTasks.length}
            </p>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Planned Study</p>
            <p className="text-2xl font-bold text-slate-900 mt-0.5">
              {totalPlannedHours.toFixed(1)} hrs
            </p>
          </div>
        </Card>
      </div>

      {/* Main Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Prioritized Task Checklist */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-base font-bold text-slate-900">Upcoming Deadlines</h3>
                <p className="text-xs text-slate-500">Sorted by due date urgency</p>
              </div>
              <Link
                to="/tasks"
                className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1"
              >
                View all <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {loadingTasks ? (
              <Spinner className="py-8" />
            ) : upcomingTasks.length === 0 ? (
              <div className="text-center py-10 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="text-sm font-medium text-slate-700">All caught up!</p>
                <p className="text-xs text-slate-400 mt-0.5">No pending deadlines on your plate.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {upcomingTasks.slice(0, 5).map((task) => {
                  const course = getCourse(task.course_id);
                  const dueDate = new Date(task.due_date);
                  return (
                    <div
                      key={task.id}
                      className="py-3.5 flex items-center justify-between gap-4 group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <button
                          onClick={() => handleToggleTask(task)}
                          className="w-5 h-5 rounded-md border border-slate-300 hover:border-primary-500 flex items-center justify-center text-white transition-colors"
                        >
                          {task.status === "completed" && (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          )}
                        </button>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-800 truncate">
                            {task.title}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {course && (
                              <span
                                className="text-[11px] font-semibold px-2 py-0.5 rounded-md text-white"
                                style={{ backgroundColor: course.color }}
                              >
                                {course.code}
                              </span>
                            )}
                            <span className="text-xs text-slate-400">
                              Due {dueDate.toLocaleDateString()} at{" "}
                              {dueDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge
                          variant={
                            task.priority === "high"
                              ? "danger"
                              : task.priority === "medium"
                              ? "warning"
                              : "neutral"
                          }
                          size="sm"
                        >
                          {task.priority}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Right Column: Enrolled Courses Overview */}
        <div className="space-y-6">
          <Card>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-base font-bold text-slate-900">Enrolled Courses</h3>
                <p className="text-xs text-slate-500">Current Semester</p>
              </div>
              <Link
                to="/courses"
                className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1"
              >
                Manage <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {loadingCourses ? (
              <Spinner className="py-8" />
            ) : courses.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-slate-500">No courses added yet.</p>
                <Link to="/courses" className="mt-2 inline-block">
                  <Button size="sm">Add Course</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3.5">
                {courses.slice(0, 4).map((c) => {
                  const courseTasks = tasks.filter((t) => t.course_id === c.id);
                  const completed = courseTasks.filter((t) => t.status === "completed").length;
                  const percent =
                    courseTasks.length > 0 ? Math.round((completed / courseTasks.length) * 100) : 0;

                  return (
                    <div
                      key={c.id}
                      className="p-3.5 rounded-xl border border-slate-100 hover:border-slate-200 bg-slate-50/50 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: c.color }}
                          />
                          <span className="text-sm font-bold text-slate-800">{c.code}</span>
                        </div>
                        <span className="text-xs font-semibold text-slate-600">{percent}%</span>
                      </div>
                      <p className="text-xs text-slate-500 truncate mb-2.5">{c.title}</p>
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${percent}%`, backgroundColor: c.color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};
