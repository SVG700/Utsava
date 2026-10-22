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
import { downloadCsvFile } from '@/lib/csv';
import { budgetCsv, tasksCsv, vendorsCsv, type CsvExport } from '@/lib/planExports';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PrintablePlan } from './export/PrintablePlan';

interface ExportTabProps {
  event: StoredEvent;
  blueprint: AIBlueprint | null;
  categories: BudgetCategory[];
  expenses: Expense[];
  tasks: TimelineTask[];
  vendors: Vendor[];
}

/** Export & Print tab: CSV downloads and a printable coordinator summary. */
export function ExportTab({
  event,
  blueprint,
  categories,
  expenses,
  tasks,
  vendors,
}: ExportTabProps) {
  const download = ({ filename, content }: CsvExport) => downloadCsvFile(filename, content);

  return (
    <div className="space-y-8">
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
              <Button
                variant="primary"
                onClick={() => window.print()}
                className="text-xs gap-1.5 shadow-sm"
              >
                <Printer className="w-4 h-4" /> Print Plan
              </Button>
              <Button
                variant="outline"
                onClick={() => download(budgetCsv(event, categories, expenses))}
                className="text-xs gap-1.5"
              >
                <FileSpreadsheet className="w-4 h-4 text-forest-600" /> Budget CSV
              </Button>
              <Button
                variant="outline"
                onClick={() => download(tasksCsv(event, tasks))}
                className="text-xs gap-1.5"
              >
                <Download className="w-4 h-4 text-emerald-600" /> Tasks CSV
              </Button>
              <Button
                variant="outline"
                onClick={() => download(vendorsCsv(event, vendors))}
                className="text-xs gap-1.5"
              >
                <Download className="w-4 h-4 text-amber-600" /> Vendors CSV
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <PrintablePlan
        event={event}
        blueprint={blueprint}
        categories={categories}
        expenses={expenses}
        tasks={tasks}
        vendors={vendors}
      />
    </div>
  );
}
