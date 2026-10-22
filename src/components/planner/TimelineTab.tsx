'use client';

import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Clock, Plus } from 'lucide-react';
import type { StoredEvent, TimelineTask } from '@/schemas';
import { calculateDueDate, formatDisplayDate, getTodayString } from '@/lib/dates';
import { filterTasks, isTaskOverdue, summarizeTasks, type TaskFilters } from '@/lib/timeline';
import { useUndo } from '@/hooks/useUndo';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { UndoToast } from '@/components/ui/UndoToast';
import { TimelineToolbar } from './timeline/TimelineToolbar';
import { TaskItem } from './timeline/TaskItem';
import { TaskFormModal, type TaskFormValues } from './timeline/TaskFormModal';

interface TimelineTabProps {
  event: StoredEvent;
  tasks: TimelineTask[];
  onUpdateTasks: (tasks: TimelineTask[]) => void;
}

const UNDO_WINDOW_MS = 8000;

/** Smart Timeline tab: filterable milestone list with add/edit/delete and undo. */
export function TimelineTab({ event, tasks, onUpdateTasks }: TimelineTabProps) {
  const today = getTodayString();
  const [filters, setFilters] = useState<TaskFilters>({
    status: 'all',
    priority: 'all',
    query: '',
  });
  // `session` increments on every open so the form re-initialises from the task.
  const [form, setForm] = useState<{
    open: boolean;
    task: TimelineTask | null;
    session: number;
  }>({ open: false, task: null, session: 0 });
  const [taskToDelete, setTaskToDelete] = useState<TimelineTask | null>(null);
  const undo = useUndo<TimelineTask>(UNDO_WINDOW_MS);

  const visibleTasks = filterTasks(tasks, filters, today);
  const summary = summarizeTasks(tasks, today);

  const openForm = (task: TimelineTask | null) =>
    setForm((prev) => ({ open: true, task, session: prev.session + 1 }));
  const closeForm = () => setForm((prev) => ({ ...prev, open: false }));

  const handleToggleCompleted = (taskId: string) => {
    onUpdateTasks(tasks.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t)));
  };

  const handleSave = (values: TaskFormValues) => {
    const dueDate = calculateDueDate(event.date, values.daysBeforeEvent);
    const editing = form.task;
    if (editing) {
      onUpdateTasks(
        tasks.map((t) =>
          t.id === editing.id ? { ...t, ...values, dueDate, source: 'user' as const } : t,
        ),
      );
    } else {
      onUpdateTasks([
        ...tasks,
        { id: uuidv4(), ...values, dueDate, completed: false, source: 'user' as const },
      ]);
    }
    closeForm();
  };

  const handleConfirmDelete = () => {
    if (!taskToDelete) return;
    onUpdateTasks(tasks.filter((t) => t.id !== taskToDelete.id));
    undo.offer(taskToDelete);
    setTaskToDelete(null);
  };

  const handleUndoDelete = () => {
    if (!undo.item) return;
    onUpdateTasks([...tasks, undo.item]);
    undo.dismiss();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <TimelineToolbar
        eventDate={event.date}
        summary={summary}
        filters={filters}
        onFiltersChange={setFilters}
        onAddTask={() => openForm(null)}
      />

      {visibleTasks.length === 0 ? (
        <Card className="text-center py-14 border-dashed bg-sand-50/30 dark:bg-stone-900/30">
          <Clock className="w-10 h-10 text-stone-300 dark:text-stone-600 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-stone-700 dark:text-stone-300">
            {tasks.length === 0 ? 'No timeline tasks yet.' : 'No tasks match your selected filter.'}
          </h3>
          <p className="text-xs text-stone-400 max-w-sm mx-auto mt-1 mb-4">
            Tasks can be auto-generated from your celebration blueprint or added manually.
          </p>
          <Button size="sm" variant="outline" onClick={() => openForm(null)}>
            <Plus className="w-3.5 h-3.5 mr-1" /> Add Milestone Task
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {visibleTasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              overdue={isTaskOverdue(task, today)}
              onToggleCompleted={handleToggleCompleted}
              onEdit={openForm}
              onDelete={setTaskToDelete}
            />
          ))}
        </div>
      )}

      <TaskFormModal
        key={form.session}
        isOpen={form.open}
        task={form.task}
        eventDate={event.date}
        onClose={closeForm}
        onSave={handleSave}
      />

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
            <Button variant="danger" size="sm" onClick={handleConfirmDelete}>
              Delete Task
            </Button>
          </div>
        </div>
      </Modal>

      {undo.item && (
        <UndoToast onUndo={handleUndoDelete}>
          Task &ldquo;{undo.item.title}&rdquo; deleted
        </UndoToast>
      )}
    </div>
  );
}
