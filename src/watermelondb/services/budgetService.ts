import {Q} from '@nozbe/watermelondb';
import {database} from '../database';
import Budget from '../models/Budget';

export interface BudgetData {
  id: string;
  userId: string;
  amount: number;
  month: string;
  budgetType: string;
}

export const upsertBudget = async (
  userId: string,
  amount: number,
  month: string,
): Promise<string> => {
  let budgetId = '';
  const isRecurring = month.startsWith('recurring:');

  await database.write(async () => {
    const monthQuery = isRecurring
      ? Q.or(Q.where('month', 'recurring'), Q.where('month', Q.like('recurring:%')))
      : Q.where('month', month);

    const existing = await database
      .get<Budget>('budgets')
      .query(
        Q.where('user_id', userId),
        monthQuery,
        Q.where('budget_type', 'monthly'),
      )
      .fetch();

    if (existing.length > 0) {
      await existing[0].update(b => {
        b.amount = amount;
        b.month = month;
      });
      budgetId = existing[0].id;
    } else {
      const budget = await database.get<Budget>('budgets').create(b => {
        b.userId = userId;
        b.categoryId = '';
        b.amount = amount;
        b.month = month;
        b.budgetType = 'monthly';
      });
      budgetId = budget.id;
    }
  });
  return budgetId;
};

export const updateBudget = async (
  budgetId: string,
  updates: {amount?: number; month?: string},
): Promise<void> => {
  await database.write(async () => {
    const budget = await database.get<Budget>('budgets').find(budgetId);
    await budget.update(b => {
      if (updates.amount !== undefined) {
        b.amount = updates.amount;
      }
      if (updates.month !== undefined) {
        b.month = updates.month;
      }
    });
  });
};

export const deleteBudget = async (budgetId: string): Promise<void> => {
  await database.write(async () => {
    const budget = await database.get<Budget>('budgets').find(budgetId);
    await budget.destroyPermanently();
  });
};

export const getBudgetsByMonth = async (
  userId: string,
  yearMonth: string,
): Promise<BudgetData[]> => {
  const budgets = await database
    .get<Budget>('budgets')
    .query(
      Q.where('user_id', userId),
      Q.or(
        Q.where('month', yearMonth),
        Q.where('month', 'recurring'),
        Q.where('month', Q.like('recurring:%')),
      ),
    )
    .fetch();

  const filtered = budgets.filter(b => {
    if (b.month === 'recurring') {return true;}
    if (!b.month.startsWith('recurring:')) {return true;}
    const startMonth = b.month.slice('recurring:'.length);
    return yearMonth >= startMonth;
  });

  return filtered.map(b => ({
    id: b.id,
    userId: b.userId,
    amount: b.amount,
    month: b.month,
    budgetType: b.budgetType,
  }));
};

