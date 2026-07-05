import {z} from 'zod';

const userSchema = z.object({
  username: z.string(),
  email: z.string(),
});

const categorySchema = z.object({
  name: z.string(),
  icon: z.string().optional(),
  color: z.string().optional(),
});

const expenseSchema = z.object({
  title: z.string(),
  amount: z.number(),
  description: z.string().optional(),
  category: z.object({name: z.string()}),
  date: z.string(),
});

const currencySchema = z.object({
  code: z.string(),
  symbol: z.string(),
  name: z.string(),
});

const debtorSchema = z.object({
  title: z.string(),
  icon: z.string().optional(),
  type: z.string().optional(),
  color: z.string().optional(),
});

const debtSchema = z.object({
  amount: z.number(),
  description: z.string(),
  debtor: z.object({title: z.string()}),
  date: z.string(),
  type: z.string(),
});

const exportDataSchema = z.object({
  users: z.array(userSchema).min(1),
  categories: z.array(categorySchema),
  expenses: z.array(expenseSchema),
  currencies: z.array(currencySchema),
  debtors: z.array(debtorSchema),
  debts: z.array(debtSchema),
});

const exportEnvelopeSchema = z.object({
  key: z.string(),
  version: z.number().optional(),
  data: exportDataSchema,
});

export interface ValidationResult {
  success: boolean;
  error?: string;
}

/**
 * Validates the structure of an import file before processing.
 * Returns a typed result to avoid exceptions during import.
 */
export const validateExportEnvelope = (json: unknown): ValidationResult => {
  const result = exportEnvelopeSchema.safeParse(json);
  if (result.success) {
    return {success: true};
  }

  const firstIssue = result.error.issues[0];
  const path = firstIssue?.path?.join('.') || '';
  const message = firstIssue?.message || 'Unknown validation error';
  return {
    success: false,
    error: path ? `Invalid field "${path}": ${message}` : message,
  };
};
