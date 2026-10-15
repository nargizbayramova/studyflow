import React, { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  Trash2,
} from "lucide-react";
import { useStudyBlocks, useCreateStudyBlock, useUpdateStudyBlock, useDeleteStudyBlock } from "@/api/studyBlocks";
import { useTasks } from "@/api/tasks";
import { useCourses } from "@/api/courses";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/common/Button";
import { Modal } from "@/components/common/Modal";
import { Input } from "@/components/common/Input";
import { Spinner } from "@/components/common/Spinner";
import { BlockStatus, StudyBlock } from "@/types";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export const CalendarPage: React.FC = () => {
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
    const mon = new Date(d.setDate(diff));
    mon.setHours(0, 0, 0, 0);
    return mon;
  });

  const { data: studyBlocks = [], isLoading } = useStudyBlocks();
  const { data: tasks = [] } = useTasks();
  const { data: courses = [] } = useCourses();

  const createBlock = useCreateStudyBlock();
  const updateBlock = useUpdateStudyBlock();
  const deleteBlock = useDeleteStudyBlock();

  const [selectedBlock, setSelectedBlock] = useState<StudyBlock | null>(null);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Form states for manual study block schedule
  const [taskId, setTaskId] = useState<number>(0);
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");

  const handlePrevWeek = () => {
    const next = new Date(currentWeekStart);
    next.setDate(next.getDate() - 7);
    setCurrentWeekStart(next);
  };

  const handleNextWeek = () => {
    const next = new Date(currentWeekStart);
    next.setDate(next.getDate() + 7);
    setCurrentWeekStart(next);
  };

  const handleOpenSchedule = () => {
    if (tasks.length > 0) setTaskId(tasks[0].id);
    const now = new Date();
    now.setMinutes(0, 0, 0);
    setStartAt(now.toISOString().slice(0, 16));
    const later = new Date(now.getTime() + 2 * 3600000);
    setEndAt(later.toISOString().slice(0, 16));
    setModalError(null);
    setIsScheduleOpen(true);
  };

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    try {
      await createBlock.mutateAsync({
        task_id: Number(taskId),
        start_at: new Date(startAt).toISOString(),
        end_at: new Date(endAt).toISOString(),
      });
      setIsScheduleOpen(false);
      setModalError(null);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setModalError(err.message);
      } else {
        setModalError("Failed to schedule study session");
      }
    }
  };

  const handleToggleStatus = async (block: StudyBlock, newStatus: BlockStatus) => {
    await updateBlock.mutateAsync({
      id: block.id,
      data: { status: newStatus },
    });
    setSelectedBlock(null);
  };

  const handleDeleteBlock = async (id: number) => {
    await deleteBlock.mutateAsync(id);
    setSelectedBlock(null);
  };

  const getTask = (tId: number) => tasks.find((t) => t.id === tId);
  const getCourse = (cId: number) => courses.find((c) => c.id === cId);

  // Generate 7 days of the current week
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(currentWeekStart);
    date.setDate(date.getDate() + i);
    return date;
  });

  return (
    <div className="space-y-8">
      <Header
        title="Weekly Study Timetable"
        subtitle="AI-balanced study sessions distributed around your deadlines."
        actions={
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
              <button
                onClick={handlePrevWeek}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-semibold px-2 text-slate-700">
                {weekDays[0].toLocaleDateString(undefined, { month: "short", day: "numeric" })} –{" "}
                {weekDays[6].toLocaleDateString(undefined, { month: "short", day: "numeric" })}
              </span>
              <button
                onClick={handleNextWeek}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <Button size="sm" onClick={handleOpenSchedule} disabled={tasks.length === 0}>
              <Plus className="w-4 h-4" /> Schedule Session
            </Button>
          </div>
        }
      />

      {/* Week Grid */}
      {isLoading ? (
        <Spinner className="py-20" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
          {weekDays.map((dayDate, i) => {
            const isToday = new Date().toDateString() === dayDate.toDateString();
            const dayBlocks = studyBlocks.filter((b) => {
              const bDate = new Date(b.start_at);
              return bDate.toDateString() === dayDate.toDateString();
            });

            return (
              <div
                key={i}
                className={`flex flex-col rounded-2xl border transition-colors ${
                  isToday
                    ? "bg-indigo-50/40 border-primary-300 ring-1 ring-primary-300"
                    : "bg-white border-slate-200/80"
                } p-3.5 min-h-[420px]`}
              >
                <div className="pb-3 mb-3 border-b border-slate-100 text-center">
                  <p className="text-xs font-semibold text-slate-500 uppercase">{DAYS[i].slice(0, 3)}</p>
                  <p
                    className={`text-lg font-bold mt-0.5 inline-block w-8 h-8 rounded-full leading-8 ${
                      isToday ? "bg-primary-600 text-white shadow-sm" : "text-slate-800"
                    }`}
                  >
                    {dayDate.getDate()}
                  </p>
                </div>

                <div className="flex-1 space-y-2.5 overflow-y-auto">
                  {dayBlocks.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-center">
                      <p className="text-xs text-slate-300">No sessions</p>
                    </div>
                  ) : (
                    dayBlocks.map((block) => {
                      const task = getTask(block.task_id);
                      const course = task ? getCourse(task.course_id) : undefined;
                      const sTime = new Date(block.start_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      });
                      const eTime = new Date(block.end_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      });

                      return (
                        <div
                          key={block.id}
                          onClick={() => setSelectedBlock(block)}
                          className="p-2.5 rounded-xl border border-slate-200/70 hover:shadow-md transition-all cursor-pointer bg-white text-left relative overflow-hidden group"
                        >
                          <div
                            className="absolute top-0 left-0 bottom-0 w-1"
                            style={{ backgroundColor: course?.color || "#4F46E5" }}
                          />
                          <p className="text-xs font-bold text-slate-800 truncate pl-1.5">
                            {task?.title || "Study Session"}
                          </p>
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-1 pl-1.5">
                            <Clock className="w-3 h-3" />
                            <span>
                              {sTime} - {eTime}
                            </span>
                          </div>
                          {block.status === "completed" && (
                            <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold text-emerald-600 mt-1.5 pl-1.5">
                              <CheckCircle2 className="w-2.5 h-2.5" /> Completed
                            </span>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Block Detail & Reschedule Modal */}
      {selectedBlock && (
        <Modal
          isOpen={!!selectedBlock}
          onClose={() => setSelectedBlock(null)}
          title="Study Session Details"
          description="Review session timing or mark as completed/missed."
        >
          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase">Deliverable</p>
              <h4 className="text-base font-bold text-slate-900 mt-0.5">
                {getTask(selectedBlock.task_id)?.title || "Task"}
              </h4>
            </div>

            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
              <div>
                <span className="text-xs text-slate-400">Start Time</span>
                <p className="text-sm font-semibold text-slate-800 mt-0.5">
                  {new Date(selectedBlock.start_at).toLocaleString([], {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <div>
                <span className="text-xs text-slate-400">End Time</span>
                <p className="text-sm font-semibold text-slate-800 mt-0.5">
                  {new Date(selectedBlock.end_at).toLocaleString([], {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>

            <div className="pt-2">
              <span className="block text-xs font-semibold text-slate-400 uppercase mb-2">
                Session Status
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={selectedBlock.status === "completed" ? "primary" : "outline"}
                  onClick={() => handleToggleStatus(selectedBlock, "completed")}
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Completed
                </Button>
                <Button
                  size="sm"
                  variant={selectedBlock.status === "missed" ? "danger" : "outline"}
                  onClick={() => handleToggleStatus(selectedBlock, "missed")}
                >
                  <AlertCircle className="w-4 h-4 text-rose-500" /> Missed
                </Button>
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-slate-100">
              <Button
                variant="ghost"
                size="sm"
                className="text-rose-600 hover:bg-rose-50"
                onClick={() => handleDeleteBlock(selectedBlock.id)}
              >
                <Trash2 className="w-4 h-4" /> Delete Session
              </Button>
              <Button size="sm" variant="outline" onClick={() => setSelectedBlock(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Manual Schedule Modal */}
      <Modal
        isOpen={isScheduleOpen}
        onClose={() => {
          setIsScheduleOpen(false);
          setModalError(null);
        }}
        title="Schedule Study Session"
        description="Select a deliverable and block your study window."
      >
        <form onSubmit={handleScheduleSubmit} className="space-y-4">
          {modalError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200/70 text-rose-700 text-xs font-medium">
              {modalError}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Task</label>
            <select
              value={taskId}
              onChange={(e) => setTaskId(Number(e.target.value))}
              required
              className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-white"
            >
              {tasks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start Time"
              type="datetime-local"
              required
              value={startAt}
              onChange={(e) => setStartAt(e.target.value)}
            />
            <Input
              label="End Time"
              type="datetime-local"
              required
              value={endAt}
              onChange={(e) => setEndAt(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsScheduleOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={createBlock.isPending}>
              Schedule
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
