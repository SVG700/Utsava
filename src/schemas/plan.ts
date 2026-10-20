import { z } from 'zod';

// ─── Budget Category Schema ──────────────────────────────────────
export const budgetCategorySchema = z.object({
  id: z.string(),
  name: z.string(),
  percentage: z.number().min(0).max(100),
  estimatedAmount: z.number().min(0),
  actualAmount: z.number().min(0),
});

export type BudgetCategory = z.infer<typeof budgetCategorySchema>;

// ─── Expense Schema ─────────────────────────────────────────────
export const expenseSchema = z.object({
  id: z.string().min(1),
  categoryId: z.string(),
  description: z.string().min(1).max(200),
  amount: z.number().min(0),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  notes: z.string().max(500).optional().default(''),
});

export type Expense = z.infer<typeof expenseSchema>;

// ─── Timeline Task Schema ───────────────────────────────────────
export const TASK_PRIORITIES = ['high', 'medium', 'low'] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export const timelineTaskSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(200),
  description: z.string().max(500).optional().default(''),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  daysBeforeEvent: z.number().int(),
  priority: z.enum(TASK_PRIORITIES),
  completed: z.boolean(),
  category: z.string().optional().default(''),
});

export type TimelineTask = z.infer<typeof timelineTaskSchema>;

// ─── Vendor Schema ──────────────────────────────────────────────
export const VENDOR_STATUSES = ['not-started', 'shortlisted', 'booked'] as const;
export type VendorStatus = (typeof VENDOR_STATUSES)[number];

export const vendorSchema = z.object({
  id: z.string().min(1),
  category: z.string(),
  budgetCategoryId: z.string().optional(),
  name: z.string().max(200).optional().default(''),
  contact: z.string().max(200).optional().default(''),
  quote: z.number().min(0).optional(),
  status: z.enum(VENDOR_STATUSES),
  notes: z.string().max(500).optional().default(''),
  suggestedByAI: z.boolean().optional().default(false),
});

export type Vendor = z.infer<typeof vendorSchema>;
