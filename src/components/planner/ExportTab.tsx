'use client';

import React from 'react';
import { Printer, Download, FileSpreadsheet } from 'lucide-react';
import type {
  StoredEvent,
  BudgetCategory,
  Expense,
  TimelineTask,
  Vendor,
  AIBlueprint,
} from '@/schemas';
import { formatINR, spendByCategory } from '@/lib/budget';
import { formatDisplayDate } from '@/lib/dates';
import { buildCsvString, downloadCsvFile } from '@/lib/csv';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface ExportTabProps {
  event: StoredEvent;
  blueprint: AIBlueprint | null;
  categories: BudgetCategory[];
  expenses: Expense[];
  tasks: TimelineTask[];
  vendors: Vendor[];
}

export function ExportTab({
  event,
  blueprint,
  categories,
  expenses,
  tasks,
  vendors,
}: ExportTabProps) {
  const categorySpends = spendByCategory(expenses);

  const handlePrint = () => {
    window.print();
  };

  // Export Budget to CSV
  const handleExportBudgetCsv = () => {
    const headers = [
      'Category',
      'Percentage (%)',
      'Estimated (INR)',
      'Actual Spent (INR)',
      'Balance (INR)',
      'Status',
    ];
    const rows: (string | number)[][] = categories.map((cat) => {
      const spent = categorySpends[cat.id] ?? 0;
      const balance = cat.estimatedAmount - spent;
      const status = spent > cat.estimatedAmount ? 'OVER BUDGET' : 'WITHIN BUDGET';
      return [cat.name, cat.percentage, cat.estimatedAmount, spent, balance, status];
    });

    // Summary row
    const totalSpent = Object.values(categorySpends).reduce((s, v) => s + v, 0);
    const totalBalance = event.totalBudget - totalSpent;
    rows.push([
      'TOTAL EVENT BUDGET',
      100,
      event.totalBudget,
      totalSpent,
      totalBalance,
      totalSpent > event.totalBudget ? 'OVER BUDGET' : 'WITHIN BUDGET',
    ]);

    const csvContent = buildCsvString(headers, rows);
    downloadCsvFile(`${event.name.replace(/[^a-z0-9]/gi, '_')}_Budget.csv`, csvContent);
  };

  // Export Tasks to CSV
  const handleExportTasksCsv = () => {
    const headers = [
      'Task Title',
      'Category',
      'Due Date',
      'Days Before Event',
      'Priority',
      'Status',
    ];
    const rows = tasks.map((t) => [
      t.title,
      t.category || '',
      t.dueDate,
      t.daysBeforeEvent,
      t.priority.toUpperCase(),
      t.completed ? 'COMPLETED' : 'PENDING',
    ]);

    const csvContent = buildCsvString(headers, rows);
    downloadCsvFile(`${event.name.replace(/[^a-z0-9]/gi, '_')}_Timeline_Tasks.csv`, csvContent);
  };

  // Export Vendors to CSV
  const handleExportVendorsCsv = () => {
    const headers = [
      'Category',
      'Vendor Name',
      'Contact Info',
      'Quoted Amount (INR)',
      'Status',
      'Notes',
    ];
    const rows = vendors.map((v) => [
      v.category,
      v.name || '',
      v.contact || '',
      v.quote !== undefined ? v.quote : '',
      v.status.toUpperCase(),
      v.notes || '',
    ]);

    const csvContent = buildCsvString(headers, rows);
    downloadCsvFile(`${event.name.replace(/[^a-z0-9]/gi, '_')}_Vendors.csv`, csvContent);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Action Banner (hidden in print) */}
      <Card className="no-print bg-white/80 dark:bg-stone-900/80 border-sand-200 dark:border-stone-800 shadow-soft">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-forest-50 dark:bg-forest-950/60 flex items-center justify-center text-forest-700 dark:text-forest-400">
                  <Printer className="w-4 h-4" />
                </div>
                <h2 className="text-lg font-bold text-forest-950 dark:text-forest-100">
                  Export & Print Celebration Plan
                </h2>
              </div>
              <p className="text-xs text-stone-600 dark:text-stone-400 mt-1">
                Print physical checklists for family coordinators or export structured CSVs to Excel
                / Google Sheets.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="primary" onClick={handlePrint} className="text-xs gap-1.5 shadow-sm">
                <Printer className="w-4 h-4" /> Print Plan
              </Button>
              <Button variant="outline" onClick={handleExportBudgetCsv} className="text-xs gap-1.5">
                <FileSpreadsheet className="w-4 h-4 text-forest-600" /> Budget CSV
              </Button>
              <Button variant="outline" onClick={handleExportTasksCsv} className="text-xs gap-1.5">
                <Download className="w-4 h-4 text-emerald-600" /> Tasks CSV
              </Button>
              <Button
                variant="outline"
                onClick={handleExportVendorsCsv}
                className="text-xs gap-1.5"
              >
                <Download className="w-4 h-4 text-amber-600" /> Vendors CSV
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Printable Master Document */}
      <div className="p-8 bg-white dark:bg-stone-900 border border-sand-200 dark:border-stone-800 rounded-2xl shadow-soft space-y-8 print:p-0 print:border-none print:shadow-none print:bg-white">
        {/* Printable Header */}
        <div className="border-b border-sand-200 dark:border-stone-800 pb-6 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-widest text-forest-700 dark:text-forest-400">
              Utsava • AI Celebration Blueprint
            </span>
            <span className="text-xs text-stone-400">
              Generated on {new Date().toLocaleDateString('en-IN')}
            </span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-forest-950 dark:text-forest-100">
            {event.name}
          </h1>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-3 text-xs text-stone-600 dark:text-stone-300">
            <div className="p-3 rounded-xl bg-sand-50/70 dark:bg-stone-800/40 border border-sand-200/60 dark:border-stone-800">
              <span className="text-stone-400 block text-[10px] uppercase font-semibold">
                Celebration Date
              </span>
              <strong className="text-stone-900 dark:text-stone-100 font-bold">
                {formatDisplayDate(event.date)}
              </strong>
            </div>
            <div className="p-3 rounded-xl bg-sand-50/70 dark:bg-stone-800/40 border border-sand-200/60 dark:border-stone-800">
              <span className="text-stone-400 block text-[10px] uppercase font-semibold">
                Location
              </span>
              <strong className="text-stone-900 dark:text-stone-100 font-bold">{event.city}</strong>
            </div>
            <div className="p-3 rounded-xl bg-sand-50/70 dark:bg-stone-800/40 border border-sand-200/60 dark:border-stone-800">
              <span className="text-stone-400 block text-[10px] uppercase font-semibold">
                Guest Count
              </span>
              <strong className="text-stone-900 dark:text-stone-100 font-bold">
                {event.guestCount} Guests
              </strong>
            </div>
            <div className="p-3 rounded-xl bg-sand-50/70 dark:bg-stone-800/40 border border-sand-200/60 dark:border-stone-800">
              <span className="text-stone-400 block text-[10px] uppercase font-semibold">
                Total Planned Budget
              </span>
              <strong className="text-forest-800 dark:text-forest-300 font-extrabold">
                {formatINR(event.totalBudget)}
              </strong>
            </div>
          </div>
        </div>

        {/* Theme & Styling Section */}
        {blueprint && (
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-forest-900 dark:text-forest-300 border-b border-sand-200 dark:border-stone-800 pb-1.5">
              1. Theme & Styling Blueprint
            </h3>
            <div className="text-xs space-y-1.5 text-stone-700 dark:text-stone-300">
              <p>
                <strong>Main Theme:</strong> {blueprint.themeAndDecor.mainTheme}
              </p>
              <p className="leading-relaxed text-stone-600 dark:text-stone-400">
                {blueprint.themeAndDecor.description}
              </p>
              <p>
                <strong>Color Palette:</strong> {blueprint.themeAndDecor.colorPalette.join(', ')}
              </p>
            </div>
          </div>
        )}

        {/* Budget Allocation Table */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-forest-900 dark:text-forest-300 border-b border-sand-200 dark:border-stone-800 pb-1.5">
            2. Budget Allocation & Spend (INR)
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left min-w-[500px]">
              <thead>
                <tr className="border-b border-sand-200 dark:border-stone-800 text-stone-500 text-[10px] uppercase font-semibold">
                  <th className="py-2.5">Category</th>
                  <th className="py-2.5 text-right">Target (%)</th>
                  <th className="py-2.5 text-right">Target Amount</th>
                  <th className="py-2.5 text-right">Actual Spent</th>
                  <th className="py-2.5 text-right">Variance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sand-100 dark:divide-stone-800">
                {categories.map((c) => {
                  const spent = categorySpends[c.id] ?? 0;
                  const diff = c.estimatedAmount - spent;
                  return (
                    <tr key={c.id}>
                      <td className="py-2.5 font-medium text-stone-900 dark:text-stone-100">
                        {c.name}
                      </td>
                      <td className="py-2.5 text-right text-stone-600 dark:text-stone-400">
                        {c.percentage}%
                      </td>
                      <td className="py-2.5 text-right text-stone-700 dark:text-stone-300">
                        {formatINR(c.estimatedAmount)}
                      </td>
                      <td className="py-2.5 text-right font-medium text-stone-900 dark:text-stone-100">
                        {formatINR(spent)}
                      </td>
                      <td
                        className={`py-2.5 text-right font-semibold ${diff < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-700 dark:text-emerald-400'}`}
                      >
                        {diff < 0 ? `-${formatINR(Math.abs(diff))}` : formatINR(diff)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Milestone Timeline Checklist */}
        <div className="space-y-3 page-break">
          <h3 className="text-xs font-bold uppercase tracking-wider text-forest-900 dark:text-forest-300 border-b border-sand-200 dark:border-stone-800 pb-1.5">
            3. Preparation Milestone Checklist
          </h3>
          <div className="space-y-2 text-xs">
            {tasks.map((t) => (
              <div
                key={t.id}
                className="flex items-start gap-2.5 py-1.5 border-b border-sand-50 dark:border-stone-800/40"
              >
                <span className="w-4 h-4 rounded border border-sand-400 dark:border-stone-600 inline-flex items-center justify-center mt-0.5 text-[10px] text-forest-700 dark:text-forest-400">
                  {t.completed ? '✓' : ''}
                </span>
                <div className="flex-1">
                  <span
                    className={`font-semibold ${t.completed ? 'line-through text-stone-400' : 'text-stone-900 dark:text-stone-100'}`}
                  >
                    {t.title}
                  </span>
                  <span className="text-[11px] text-stone-400 ml-2">
                    (Due: {formatDisplayDate(t.dueDate)} • {t.priority.toUpperCase()} priority)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Vendor Checklist */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-forest-900 dark:text-forest-300 border-b border-sand-200 dark:border-stone-800 pb-1.5">
            4. Vendor Status & Contacts
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left min-w-[500px]">
              <thead>
                <tr className="border-b border-sand-200 dark:border-stone-800 text-stone-500 text-[10px] uppercase font-semibold">
                  <th className="py-2.5">Category</th>
                  <th className="py-2.5">Vendor Name</th>
                  <th className="py-2.5">Contact</th>
                  <th className="py-2.5 text-right">Quote</th>
                  <th className="py-2.5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sand-100 dark:divide-stone-800">
                {vendors.map((v) => (
                  <tr key={v.id}>
                    <td className="py-2.5 font-medium text-stone-900 dark:text-stone-100">
                      {v.category}
                    </td>
                    <td className="py-2.5 text-stone-700 dark:text-stone-300">{v.name || '—'}</td>
                    <td className="py-2.5 text-stone-700 dark:text-stone-300">
                      {v.contact || '—'}
                    </td>
                    <td className="py-2.5 text-right font-medium text-stone-900 dark:text-stone-100">
                      {v.quote !== undefined ? formatINR(v.quote) : '—'}
                    </td>
                    <td className="py-2.5 text-right uppercase text-[10px] font-bold text-forest-800 dark:text-forest-400">
                      {v.status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
