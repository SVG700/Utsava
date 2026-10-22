import React from 'react';
import { AlertTriangle, Calendar, CheckCircle2, Circle, Edit2, Trash2 } from 'lucide-react';
import type { TimelineTask } from '@/schemas';
import { formatDisplayDate } from '@/lib/dates';
import { Badge } from '@/components/ui/Badge';

interface TaskItemProps {
  task: TimelineTask;
  overdue: boolean;
  onToggleCompleted: (taskId: string) => void;
  onEdit: (task: TimelineTask) => void;
  onDelete: (task: TimelineTask) => void;
}

const PRIORITY_BADGE = { high: 'danger', medium: 'warning', low: 'default' } as const;

function containerClass(task: TimelineTask, overdue: boolean): string {
  if (task.completed) {
    return 'bg-sand-50/40 dark:bg-stone-900/30 border-sand-200 dark:border-stone-800/80 opacity-70';
  }
  if (overdue) {
    return 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/60 shadow-soft';
  }
  return 'bg-white dark:bg-stone-900 border-sand-200 dark:border-stone-800 hover:border-forest-300 dark:hover:border-forest-700 shadow-soft';
}

/** One milestone row with completion toggle, metadata and edit/delete actions. */
export function TaskItem({ task, overdue, onToggleCompleted, onEdit, onDelete }: TaskItemProps) {
  return (
    <div
      className={`p-4 rounded-2xl border transition-all flex items-start gap-3.5 ${containerClass(task, overdue)}`}
    >
      <button
        type="button"
        onClick={() => onToggleCompleted(task.id)}
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
          <Badge variant={PRIORITY_BADGE[task.priority]} className="text-[10px]">
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

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onEdit(task)}
          className="p-1.5 text-stone-400 hover:text-forest-700 dark:hover:text-forest-400 rounded-lg hover:bg-forest-50 dark:hover:bg-forest-950/40 transition-colors"
          title={`Edit task: ${task.title}`}
          aria-label={`Edit task: ${task.title}`}
        >
          <Edit2 className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => onDelete(task)}
          className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
          title={`Delete task: ${task.title}`}
          aria-label={`Delete task: ${task.title}`}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
