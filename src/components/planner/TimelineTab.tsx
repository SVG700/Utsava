'use client';

import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  Calendar,
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  Edit2,
  Clock,
  AlertTriangle,
  Search,
  CheckCheck,
} from 'lucide-react';
import type { StoredEvent, TimelineTask, TaskPriority } from '@/schemas';
import {
  formatDisplayDate,
  calculateDueDate,
  isOverdue,
  sortTasks,
  getTodayString,
} from '@/lib/dates';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';

interface TimelineTabProps {
  event: StoredEvent;
  tasks: TimelineTask[];
  onUpdateTasks: (tasks: TimelineTask[]) => void;
}

export function TimelineTab({ event, tasks, onUpdateTasks }: TimelineTabProps) {
  const today = getTodayString();

  // Filters
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed' | 'overdue'>(
    'all',
  );
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Task Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<TimelineTask | null>(null);
  const [undoTask, setUndoTask] = useState<TimelineTask | null>(null);
  const undoTaskTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    daysBeforeEvent: 30,
    priority: 'medium' as TaskPriority,
    category: '',
  });

  // Toggle completed
  const handleToggleCompleted = (taskId: string) => {
    const updated = tasks.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t));
    onUpdateTasks(updated);
  };

  // Open Add Modal
  const handleOpenAdd = () => {
    setEditingTaskId(null);
    setTaskForm({
      title: '',
      description: '',
      daysBeforeEvent: 30,
      priority: 'medium',
      category: '',
    });
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (task: TimelineTask) => {
    setEditingTaskId(task.id);
    setTaskForm({
      title: task.title,
      description: task.description || '',
      daysBeforeEvent: task.daysBeforeEvent,
      priority: task.priority,
      category: task.category || '',
    });
    setIsModalOpen(true);
  };

  // Delete Task with confirmation and undo
  const handleRequestDeleteTask = (task: TimelineTask) => {
    setTaskToDelete(task);
  };

  const handleConfirmDeleteTask = () => {
    if (!taskToDelete) return;
    const t = taskToDelete;
    onUpdateTasks(tasks.filter((item) => item.id !== t.id));
    setTaskToDelete(null);
    setUndoTask(t);

    if (undoTaskTimeoutRef.current) clearTimeout(undoTaskTimeoutRef.current);
    undoTaskTimeoutRef.current = setTimeout(() => {
      setUndoTask(null);
    }, 8000);
  };

  const handleUndoDeleteTask = () => {
    if (!undoTask) return;
    onUpdateTasks([...tasks, undoTask]);
    setUndoTask(null);
    if (undoTaskTimeoutRef.current) clearTimeout(undoTaskTimeoutRef.current);
  };

  // Save Task (Add or Edit)
  const handleSaveTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskForm.title.trim()) return;

    const days = Number(taskForm.daysBeforeEvent) || 0;
    const computedDueDate = calculateDueDate(event.date, days);

    if (editingTaskId) {
      const updated = tasks.map((t) =>
        t.id === editingTaskId
          ? {
              ...t,
              title: taskForm.title.trim(),
              description: taskForm.description.trim(),
              daysBeforeEvent: days,
              dueDate: computedDueDate,
              priority: taskForm.priority,
              category: taskForm.category.trim(),
              source: 'user' as const,
            }
          : t,
      );
      onUpdateTasks(updated);
    } else {
      const newTask: TimelineTask = {
        id: uuidv4(),
        title: taskForm.title.trim(),
        description: taskForm.description.trim(),
        daysBeforeEvent: days,
        dueDate: computedDueDate,
        priority: taskForm.priority,
        completed: false,
        category: taskForm.category.trim(),
        source: 'user' as const,
      };
      onUpdateTasks([...tasks, newTask]);
    }
    setIsModalOpen(false);
  };

  // Sorted tasks
  const sorted = sortTasks(tasks);

  // Filtered tasks
  const filteredTasks = sorted.filter((task) => {
    const overdue = !task.completed && isOverdue(task.dueDate, today);

    // Status filter
    if (statusFilter === 'pending' && task.completed) return false;
    if (statusFilter === 'completed' && !task.completed) return false;
    if (statusFilter === 'overdue' && !overdue) return false;

    // Priority filter
    if (priorityFilter !== 'all' && task.priority !== priorityFilter) return false;

    // Search query
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchTitle = task.title.toLowerCase().includes(q);
      const matchDesc = task.description?.toLowerCase().includes(q);
      const matchCat = task.category?.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchCat) return false;
    }

    return true;
  });

  const completedCount = tasks.filter((t) => t.completed).length;
  const overdueCount = tasks.filter((t) => !t.completed && isOverdue(t.dueDate, today)).length;
  const completionPercentage =
    tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Timeline Controls Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-forest-50 dark:bg-forest-950/60 flex items-center justify-center text-forest-700 dark:text-forest-400">
                  <Clock className="w-4 h-4" />
                </div>
                <h2 className="text-lg font-bold text-forest-950 dark:text-forest-100">
                  Smart Preparation Timeline
                </h2>
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                Milestones automatically synchronized relative to your celebration date (
                {formatDisplayDate(event.date)}).
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-sand-50 dark:bg-stone-800/60 border border-sand-200 dark:border-stone-800 text-xs font-medium text-stone-600 dark:text-stone-300">
                <CheckCheck className="w-3.5 h-3.5 text-forest-600" />
                <span>{completionPercentage}% complete</span>
              </div>
              <Button
                size="sm"
                variant="primary"
                onClick={handleOpenAdd}
                className="gap-1.5 text-xs"
              >
                <Plus className="w-3.5 h-3.5" /> Add Task
              </Button>
            </div>
          </div>

          {/* Filters & Status Badges */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mt-6 pt-5 border-t border-sand-100 dark:border-stone-800/80">
            {/* Status Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              {[
                { id: 'all', label: `All (${tasks.length})` },
                { id: 'pending', label: `Pending (${tasks.length - completedCount})` },
                { id: 'completed', label: `Completed (${completedCount})` },
                { id: 'overdue', label: `Overdue (${overdueCount})` },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  aria-pressed={statusFilter === tab.id}
                  onClick={() => setStatusFilter(tab.id as typeof statusFilter)}
                  className={`px-3 py-1.5 rounded-full font-medium transition-all cursor-pointer ${
                    statusFilter === tab.id
                      ? tab.id === 'overdue' && overdueCount > 0
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'bg-forest-900 text-white shadow-xs dark:bg-forest-600'
                      : 'bg-sand-100/80 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-sand-200/80 dark:hover:bg-stone-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Priority & Search */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 rounded-xl border border-sand-300 dark:border-stone-800 bg-white dark:bg-stone-900 text-xs w-40 sm:w-48 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-forest-600"
                />
              </div>

              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl border border-sand-300 dark:border-stone-800 bg-white dark:bg-stone-900 text-xs font-medium text-stone-700 dark:text-stone-300 focus:outline-none focus:ring-2 focus:ring-forest-600"
              >
                <option value="all">All Priorities</option>
                <option value="high">High Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="low">Low Priority</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Task List */}
      {filteredTasks.length === 0 ? (
        <Card className="text-center py-14 border-dashed bg-sand-50/30 dark:bg-stone-900/30">
          <Clock className="w-10 h-10 text-stone-300 dark:text-stone-600 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-stone-700 dark:text-stone-300">
            {tasks.length === 0 ? 'No timeline tasks yet.' : 'No tasks match your selected filter.'}
          </h3>
          <p className="text-xs text-stone-400 max-w-sm mx-auto mt-1 mb-4">
            Tasks can be auto-generated from your celebration blueprint or added manually.
          </p>
          <Button size="sm" variant="outline" onClick={handleOpenAdd}>
            <Plus className="w-3.5 h-3.5 mr-1" /> Add Milestone Task
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((task) => {
            const overdue = !task.completed && isOverdue(task.dueDate, today);

            return (
              <div
                key={task.id}
                className={`p-4 rounded-2xl border transition-all flex items-start gap-3.5 ${
                  task.completed
                    ? 'bg-sand-50/40 dark:bg-stone-900/30 border-sand-200 dark:border-stone-800/80 opacity-70'
                    : overdue
                      ? 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/60 shadow-soft'
                      : 'bg-white dark:bg-stone-900 border-sand-200 dark:border-stone-800 hover:border-forest-300 dark:hover:border-forest-700 shadow-soft'
                }`}
              >
                {/* Complete checkbox button */}
                <button
                  type="button"
                  onClick={() => handleToggleCompleted(task.id)}
                  className="mt-0.5 text-stone-400 hover:text-forest-700 dark:hover:text-forest-400 transition-colors cursor-pointer shrink-0"
                  aria-label={task.completed ? 'Mark incomplete' : 'Mark complete'}
                  title={`Mark task as ${task.completed ? 'incomplete' : 'complete'}: ${task.title}`}
                >
                  {task.completed ? (
                    <CheckCircle2 className="w-5 h-5 text-forest-700 dark:text-forest-400 fill-forest-50 dark:fill-forest-950/60" />
                  ) : (
                    <Circle className="w-5 h-5 hover:text-forest-700 dark:hover:text-forest-400" />
                  )}
                </button>

                {/* Content */}
                <div className="flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3
                      className={`font-semibold text-sm ${
                        task.completed
                          ? 'line-through text-stone-400 dark:text-stone-500'
                          : 'text-stone-900 dark:text-stone-100'
                      }`}
                    >
                      {task.title}
                    </h3>

                    <Badge
                      variant={
                        task.priority === 'high'
                          ? 'danger'
                          : task.priority === 'medium'
                            ? 'warning'
                            : 'default'
                      }
                      className="text-[10px]"
                    >
                      {task.priority}
                    </Badge>

                    {overdue && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 flex items-center gap-1">
                        <AlertTriangle className="w-2.5 h-2.5" /> Overdue
                      </span>
                    )}

                    {task.category && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-sand-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 font-medium">
                        {task.category}
                      </span>
                    )}
                  </div>

                  {task.description && (
                    <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed pt-0.5">
                      {task.description}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-4 text-[11px] text-stone-500 pt-1.5">
                    <span className="flex items-center gap-1 font-medium">
                      <Calendar className="w-3 h-3 text-stone-400" />
                      Due: {formatDisplayDate(task.dueDate)}
                    </span>
                    <span className="text-stone-400">•</span>
                    <span>
                      {task.daysBeforeEvent === 0
                        ? 'On Celebration Day'
                        : `${task.daysBeforeEvent} days before event`}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(task)}
                    className="p-1.5 text-stone-400 hover:text-forest-700 dark:hover:text-forest-400 rounded-lg hover:bg-forest-50 dark:hover:bg-forest-950/40 transition-colors"
                    title={`Edit task: ${task.title}`}
                    aria-label={`Edit task: ${task.title}`}
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleRequestDeleteTask(task)}
                    className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                    title={`Delete task: ${task.title}`}
                    aria-label={`Delete task: ${task.title}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Task Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTaskId ? 'Edit Timeline Task' : 'Add Milestone Task'}
        description="Due date is dynamically derived from your event date based on days before the event."
      >
        <form onSubmit={handleSaveTask} className="space-y-4">
          <Input
            label="Task Title"
            required
            placeholder="e.g. Confirm Mehendi Artist, Finalize banquet guest list"
            value={taskForm.title}
            onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-stone-700 dark:text-stone-300">
              Description (Optional)
            </label>
            <textarea
              rows={2}
              className="w-full px-3 py-2 rounded-xl border border-sand-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-forest-600"
              placeholder="Action items, specific deliverables, contact notes..."
              value={taskForm.description}
              onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Input
                label="Days Before Event"
                type="number"
                required
                min={0}
                max={365}
                value={taskForm.daysBeforeEvent}
                onChange={(e) =>
                  setTaskForm({ ...taskForm, daysBeforeEvent: Number(e.target.value) })
                }
                helperText={`Computed due date: ${calculateDueDate(event.date, Number(taskForm.daysBeforeEvent) || 0)}`}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1.5">
                Priority
              </label>
              <select
                value={taskForm.priority}
                onChange={(e) =>
                  setTaskForm({ ...taskForm, priority: e.target.value as TaskPriority })
                }
                className="w-full px-3 py-2.5 rounded-xl border border-sand-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-forest-600"
              >
                <option value="high">High Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="low">Low Priority</option>
              </select>
            </div>
          </div>

          <Input
            label="Category (Optional)"
            placeholder="e.g. Venue, Catering, Decor, Invitations"
            value={taskForm.category}
            onChange={(e) => setTaskForm({ ...taskForm, category: e.target.value })}
          />

          <div className="flex justify-end gap-3 pt-3 border-t border-sand-200 dark:border-stone-800">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              {editingTaskId ? 'Update Task' : 'Add Task'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Confirm Task Deletion Modal */}
      <Modal
        isOpen={Boolean(taskToDelete)}
        onClose={() => setTaskToDelete(null)}
        title="Confirm Task Deletion"
        description="Are you sure you want to delete this task? You can immediately undo this action."
        maxWidth="sm"
      >
        <div className="space-y-4">
          {taskToDelete && (
            <div className="p-3 rounded-xl bg-sand-50 dark:bg-stone-900 border border-sand-200 dark:border-stone-800 text-xs space-y-1">
              <p className="font-semibold text-stone-900 dark:text-stone-100">
                {taskToDelete.title}
              </p>
              <p className="text-stone-500">Due: {formatDisplayDate(taskToDelete.dueDate)}</p>
            </div>
          )}
          <div className="flex justify-end gap-2.5">
            <Button variant="outline" size="sm" onClick={() => setTaskToDelete(null)}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" onClick={handleConfirmDeleteTask}>
              Delete Task
            </Button>
          </div>
        </div>
      </Modal>

      {/* Floating Undo Notification for Deleted Task */}
      {undoTask && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-stone-900 dark:bg-stone-100 text-stone-100 dark:text-stone-900 px-4 py-3 rounded-2xl shadow-xl border border-stone-800 dark:border-stone-200 animate-in fade-in slide-in-from-bottom-2">
          <span className="text-xs font-medium">Task &ldquo;{undoTask.title}&rdquo; deleted</span>
          <button
            onClick={handleUndoDeleteTask}
            className="text-xs font-bold text-emerald-400 dark:text-emerald-700 hover:underline cursor-pointer"
          >
            Undo
          </button>
        </div>
      )}
    </div>
  );
}
