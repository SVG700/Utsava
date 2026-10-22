'use client';

import React, { useState } from 'react';
import type { TaskPriority, TimelineTask } from '@/schemas';
import { calculateDueDate } from '@/lib/dates';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';

/** Editable fields of a timeline task. */
export interface TaskFormValues {
  title: string;
  description: string;
  daysBeforeEvent: number;
  priority: TaskPriority;
  category: string;
}

const EMPTY_FORM: TaskFormValues = {
  title: '',
  description: '',
  daysBeforeEvent: 30,
  priority: 'medium',
  category: '',
};

function toFormValues(task: TimelineTask | null): TaskFormValues {
  if (!task) return EMPTY_FORM;
  return {
    title: task.title,
    description: task.description || '',
    daysBeforeEvent: task.daysBeforeEvent,
    priority: task.priority,
    category: task.category || '',
  };
}

interface TaskFormModalProps {
  isOpen: boolean;
  /** Task being edited, or null when adding a new task. */
  task: TimelineTask | null;
  eventDate: string;
  onClose: () => void;
  onSave: (values: TaskFormValues) => void;
}

const fieldClass =
  'w-full px-3 rounded-xl border border-sand-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-forest-600';

/**
 * Add/edit dialog for a milestone task. Give it a new `key` each time it opens so
 * the form re-initialises from the task being edited.
 */
export function TaskFormModal({ isOpen, task, eventDate, onClose, onSave }: TaskFormModalProps) {
  const [form, setForm] = useState<TaskFormValues>(() => toFormValues(task));
  const update = <K extends keyof TaskFormValues>(key: K, value: TaskFormValues[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    onSave({
      title: form.title.trim(),
      description: form.description.trim(),
      daysBeforeEvent: Number(form.daysBeforeEvent) || 0,
      priority: form.priority,
      category: form.category.trim(),
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={task ? 'Edit Timeline Task' : 'Add Milestone Task'}
      description="Due date is dynamically derived from your event date based on days before the event."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Task Title"
          required
          placeholder="e.g. Confirm Mehendi Artist, Finalize banquet guest list"
          value={form.title}
          onChange={(e) => update('title', e.target.value)}
        />

        <div className="space-y-1.5">
          <label
            htmlFor="task-description"
            className="block text-xs font-medium text-stone-700 dark:text-stone-300"
          >
            Description (Optional)
          </label>
          <textarea
            id="task-description"
            rows={2}
            className={`${fieldClass} py-2 placeholder:text-stone-400`}
            placeholder="Action items, specific deliverables, contact notes..."
            value={form.description}
            onChange={(e) => update('description', e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Days Before Event"
            type="number"
            required
            min={0}
            max={365}
            value={form.daysBeforeEvent}
            onChange={(e) => update('daysBeforeEvent', Number(e.target.value))}
            helperText={`Computed due date: ${calculateDueDate(eventDate, Number(form.daysBeforeEvent) || 0)}`}
          />

          <div>
            <label
              htmlFor="task-priority"
              className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1.5"
            >
              Priority
            </label>
            <select
              id="task-priority"
              value={form.priority}
              onChange={(e) => update('priority', e.target.value as TaskPriority)}
              className={`${fieldClass} py-2.5`}
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
          value={form.category}
          onChange={(e) => update('category', e.target.value)}
        />

        <div className="flex justify-end gap-3 pt-3 border-t border-sand-200 dark:border-stone-800">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary">
            {task ? 'Update Task' : 'Add Task'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
