import React, { useState } from "react";
import {
  CalendarClock,
  CheckCircle2,
  Clock,
  Plus,
  Trash2,
  Sparkles,
  Tag,
  Check,
} from "lucide-react";
import { PartyPlan, TimelineItem } from "../types";

interface TimelinePrepViewProps {
  plan: PartyPlan;
  onUpdatePlan: (updated: PartyPlan) => void;
  onOpenAgentWithPrompt: (promptText: string) => void;
}

const TIMEFRAMES = [
  "3 Days Before",
  "1 Day Before",
  "Morning of Party",
  "2 Hours Before",
  "Party Kickoff",
];

const TASK_CATEGORIES = ["Shopping", "Prep", "Decor", "Bar", "Host Duties"];

export const TimelinePrepView: React.FC<TimelinePrepViewProps> = ({
  plan,
  onUpdatePlan,
  onOpenAgentWithPrompt,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTaskTimeframe, setNewTaskTimeframe] = useState("1 Day Before");
  const [newTaskText, setNewTaskText] = useState("");
  const [newTaskCategory, setNewTaskCategory] = useState("Prep");
  const [filterCategory, setFilterCategory] = useState<string>("all");

  const totalTasks = plan.timeline.length;
  const completedTasks = plan.timeline.filter((t) => t.isCompleted).length;
  const completionPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const handleToggleTask = (taskId: string) => {
    const updated = plan.timeline.map((t) => (t.id === taskId ? { ...t, isCompleted: !t.isCompleted } : t));
    onUpdatePlan({
      ...plan,
      timeline: updated,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleDeleteTask = (taskId: string) => {
    const updated = plan.timeline.filter((t) => t.id !== taskId);
    onUpdatePlan({
      ...plan,
      timeline: updated,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;

    const newItem: TimelineItem = {
      id: `task-${Date.now()}`,
      timeframe: newTaskTimeframe,
      task: newTaskText.trim(),
      category: newTaskCategory,
      isCompleted: false,
    };

    onUpdatePlan({
      ...plan,
      timeline: [...plan.timeline, newItem],
      updatedAt: new Date().toISOString(),
    });

    setNewTaskText("");
    setShowAddForm(false);
  };

  // Group timeline by timeframe
  const groupedTasks: Record<string, TimelineItem[]> = {};
  TIMEFRAMES.forEach((tf) => {
    groupedTasks[tf] = [];
  });

  plan.timeline.forEach((item) => {
    if (filterCategory !== "all" && item.category !== filterCategory) return;
    if (!groupedTasks[item.timeframe]) {
      groupedTasks[item.timeframe] = [];
    }
    groupedTasks[item.timeframe].push(item);
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-800">
          <div>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
              EVENT RUN-OF-SHOW & PREPARATION
            </span>
            <h2 className="text-xl font-bold text-white font-['Outfit'] mt-1">
              Host Preparation Schedule
            </h2>
            <p className="text-xs sm:text-sm text-stone-400 mt-0.5">
              Follow this step-by-step timeline to guarantee everything is ready before the first doorbell rings.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              id="add-prep-task-btn"
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-all shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>Add Prep Task</span>
            </button>
          </div>
        </div>

        {/* Progress Bar & Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-4">
          <div className="flex items-center gap-3 flex-1 max-w-md">
            <div className="text-xs text-stone-300 font-semibold shrink-0">
              Prep Progress: {completedTasks}/{totalTasks} ({completionPercent}%)
            </div>
            <div className="w-full bg-stone-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${completionPercent}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-stone-400">Category:</span>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="bg-stone-800 border border-stone-700 text-stone-200 rounded-lg px-2.5 py-1"
            >
              <option value="all">All Categories</option>
              {TASK_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Add Task Form */}
      {showAddForm && (
        <form
          onSubmit={handleAddTask}
          className="p-4 rounded-xl bg-stone-900 border border-amber-500/40 space-y-3 animate-in fade-in"
        >
          <h3 className="text-sm font-bold text-amber-300">Add Timeline Milestone Task</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] text-stone-400 mb-1">Timeframe</label>
              <select
                value={newTaskTimeframe}
                onChange={(e) => setNewTaskTimeframe(e.target.value)}
                className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-1.5 text-xs text-stone-100"
              >
                {TIMEFRAMES.map((tf) => (
                  <option key={tf} value={tf}>
                    {tf}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] text-stone-400 mb-1">Category</label>
              <select
                value={newTaskCategory}
                onChange={(e) => setNewTaskCategory(e.target.value)}
                className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-1.5 text-xs text-stone-100"
              >
                {TASK_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-1 flex items-end">
              <button
                type="submit"
                className="w-full py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs shadow-xs"
              >
                Save Milestone Task
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[11px] text-stone-400 mb-1">Task Description *</label>
            <input
              type="text"
              required
              value={newTaskText}
              onChange={(e) => setNewTaskText(e.target.value)}
              placeholder="e.g. Set ice buckets out, chill prosecco, cue Spotify playlist"
              className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-1.5 text-xs sm:text-sm text-stone-100"
            />
          </div>
        </form>
      )}

      {/* Timeline Steps Cards */}
      <div className="space-y-4">
        {Object.entries(groupedTasks).map(([timeframe, tasks]) => {
          if (tasks.length === 0 && filterCategory !== "all") return null;

          return (
            <div
              key={timeframe}
              className="bg-stone-900 border border-stone-800 rounded-2xl overflow-hidden shadow-xs"
            >
              <div className="px-4 sm:px-6 py-3 bg-stone-850 border-b border-stone-800/80 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span className="font-bold text-sm sm:text-base text-white font-['Outfit']">
                    {timeframe}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-stone-800 text-stone-400 font-mono">
                    {tasks.filter((t) => t.isCompleted).length}/{tasks.length} done
                  </span>
                </div>
              </div>

              <div className="divide-y divide-stone-800/60 p-2 sm:p-3 space-y-1">
                {tasks.length === 0 ? (
                  <div className="p-3 text-xs text-stone-500 text-center">
                    No tasks scheduled for this timeframe.
                  </div>
                ) : (
                  tasks.map((task) => (
                    <div
                      key={task.id}
                      className={`p-3 rounded-xl flex items-center justify-between gap-3 transition-colors ${
                        task.isCompleted ? "bg-stone-900/40 text-stone-500" : "hover:bg-stone-850 text-stone-200"
                      }`}
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <button
                          id={`toggle-task-${task.id}`}
                          onClick={() => handleToggleTask(task.id)}
                          className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center transition-colors shrink-0 ${
                            task.isCompleted
                              ? "bg-emerald-600 border-emerald-500 text-white"
                              : "border-stone-600 bg-stone-800 hover:border-amber-400"
                          }`}
                        >
                          {task.isCompleted && <Check className="w-3.5 h-3.5" />}
                        </button>

                        <div>
                          <p
                            className={`text-xs sm:text-sm font-medium ${
                              task.isCompleted ? "line-through text-stone-500" : "text-stone-100"
                            }`}
                          >
                            {task.task}
                          </p>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-stone-800 text-stone-400 border border-stone-700/60 inline-block mt-1">
                            {task.category}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="p-1 rounded text-stone-500 hover:text-red-400 hover:bg-stone-800 transition-colors"
                        title="Delete task"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
