import { describe, it, expect } from 'vitest';
import { budgetCsv, exportFileName, tasksCsv, vendorsCsv } from '@/lib/planExports';
import type { StoredEvent } from '@/schemas';

const event = { name: "Aditi's 6th Birthday", totalBudget: 40_000 } as StoredEvent;
const BOM = String.fromCharCode(0xfeff);
const BOM_PATTERN = new RegExp(`^${BOM}`);
const lines = (content: string) => content.replace(BOM_PATTERN, '').split('\r\n');

describe('exportFileName', () => {
  it('replaces unsafe characters', () => {
    expect(exportFileName("Aditi's 6th Birthday", 'Budget')).toBe(
      'Aditi_s_6th_Birthday_Budget.csv',
    );
  });
});

describe('budgetCsv', () => {
  it('writes one row per category plus a total row with over-budget status', () => {
    const { content, filename } = budgetCsv(
      event,
      [{ id: 'cat-food', name: 'Food', percentage: 100, estimatedAmount: 40_000, actualAmount: 0 }],
      [
        {
          id: 'e1',
          categoryId: 'cat-food',
          description: 'Cake',
          amount: 45_000,
          date: '2026-10-01',
          notes: '',
        },
      ],
    );
    const [header, food, total] = lines(content);
    expect(filename).toBe('Aditi_s_6th_Birthday_Budget.csv');
    expect(header).toContain('Actual Spent (INR)');
    expect(food).toContain('OVER BUDGET');
    expect(total).toContain('TOTAL EVENT BUDGET');
    expect(total).toContain('-5000');
  });
});

describe('tasksCsv and vendorsCsv', () => {
  it('exports task status and priority', () => {
    const { content } = tasksCsv(event, [
      {
        id: 't1',
        title: 'Book hall',
        description: '',
        dueDate: '2026-11-01',
        daysBeforeEvent: 40,
        priority: 'high',
        completed: true,
        category: 'Venue',
      },
    ]);
    expect(lines(content)[1]).toContain('HIGH');
    expect(lines(content)[1]).toContain('COMPLETED');
  });

  it('leaves the quote blank when none was recorded', () => {
    const { content } = vendorsCsv(event, [
      {
        id: 'v1',
        category: 'Caterer',
        name: '',
        contact: '',
        status: 'not-started',
        notes: '',
        suggestedByAI: true,
      },
    ]);
    expect(lines(content)[1]).toContain('NOT-STARTED');
    expect(lines(content)).toHaveLength(2);
  });
});

describe('BOM handling', () => {
  it('prefixes exports with a UTF-8 BOM so Excel shows ₹ and Indic text correctly', () => {
    const { content } = tasksCsv(event, []);
    expect(content.startsWith(BOM)).toBe(true);
    expect(lines(content)[0].startsWith(BOM)).toBe(false);
  });
});
