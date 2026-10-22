/**
 * Builds the CSV exports offered on the Export tab. Pure functions that return the
 * file name and content; triggering the download is left to the caller.
 */

import type { BudgetCategory, Expense, StoredEvent, TimelineTask, Vendor } from '@/schemas';
import { spendByCategory } from './budget';
import { buildCsvString } from './csv';

/** A ready-to-download CSV file. */
export interface CsvExport {
  filename: string;
  content: string;
}

const statusFor = (spent: number, limit: number) =>
  spent > limit ? 'OVER BUDGET' : 'WITHIN BUDGET';

/** File name safe for every OS, derived from the event name. */
export function exportFileName(eventName: string, suffix: string): string {
  return `${eventName.replace(/[^a-z0-9]/gi, '_')}_${suffix}.csv`;
}

/** Category allocations vs actual spend, with a total row. */
export function budgetCsv(
  event: StoredEvent,
  categories: BudgetCategory[],
  expenses: Expense[],
): CsvExport {
  const spends = spendByCategory(expenses);
  const rows: (string | number)[][] = categories.map((cat) => {
    const spent = spends[cat.id] ?? 0;
    return [
      cat.name,
      cat.percentage,
      cat.estimatedAmount,
      spent,
      cat.estimatedAmount - spent,
      statusFor(spent, cat.estimatedAmount),
    ];
  });

  const totalSpent = Object.values(spends).reduce((sum, value) => sum + value, 0);
  rows.push([
    'TOTAL EVENT BUDGET',
    100,
    event.totalBudget,
    totalSpent,
    event.totalBudget - totalSpent,
    statusFor(totalSpent, event.totalBudget),
  ]);

  return {
    filename: exportFileName(event.name, 'Budget'),
    content: buildCsvString(
      [
        'Category',
        'Percentage (%)',
        'Estimated (INR)',
        'Actual Spent (INR)',
        'Balance (INR)',
        'Status',
      ],
      rows,
    ),
  };
}

/** Milestone checklist with due dates and completion status. */
export function tasksCsv(event: StoredEvent, tasks: TimelineTask[]): CsvExport {
  return {
    filename: exportFileName(event.name, 'Timeline_Tasks'),
    content: buildCsvString(
      ['Task Title', 'Category', 'Due Date', 'Days Before Event', 'Priority', 'Status'],
      tasks.map((t) => [
        t.title,
        t.category || '',
        t.dueDate,
        t.daysBeforeEvent,
        t.priority.toUpperCase(),
        t.completed ? 'COMPLETED' : 'PENDING',
      ]),
    ),
  };
}

/** Vendor contacts, quotes and booking status. */
export function vendorsCsv(event: StoredEvent, vendors: Vendor[]): CsvExport {
  return {
    filename: exportFileName(event.name, 'Vendors'),
    content: buildCsvString(
      ['Category', 'Vendor Name', 'Contact Info', 'Quoted Amount (INR)', 'Status', 'Notes'],
      vendors.map((v) => [
        v.category,
        v.name || '',
        v.contact || '',
        v.quote !== undefined ? v.quote : '',
        v.status.toUpperCase(),
        v.notes || '',
      ]),
    ),
  };
}
