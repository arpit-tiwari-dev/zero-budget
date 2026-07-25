import useThemeColors from '../../hooks/useThemeColors';
import {useAppDispatch, useAppSelector} from '../../redux/hooks';
import {selectCurrencySymbol} from '../../redux/slice/currencyDataSlice';
import {RouteProp, useFocusEffect} from '@react-navigation/native';
import {ExpenseData as Expense} from '../../watermelondb/services';
import {useCallback, useMemo} from 'react';
import {fetchExpensesByCategory, selectFilteredExpenses} from '../../redux/slice/expenseDataSlice';
export type CategoryTransactionRouteProp = RouteProp<
  {
    CategoryTransactionScreen: {
      categoryId: string;
      categoryName: string;
      categoryColor: string;
      categoryIcon?: string;
      yearMonth: string;
      monthLabel: string;
    };
  },
  'CategoryTransactionScreen'
>;

const useCategoryTransaction = (route: CategoryTransactionRouteProp) => {
  const dispatch = useAppDispatch();
  const transactions = (useAppSelector(selectFilteredExpenses) ?? []) as Expense[];
  const colors = useThemeColors();
  const currencySymbol = useAppSelector(selectCurrencySymbol);

  const {
    categoryId = '',
    categoryName = '',
    categoryColor = '#808080',
    categoryIcon,
    yearMonth = '',
    monthLabel = '',
  } = route.params ?? {};

  useFocusEffect(
    useCallback(() => {
      dispatch(fetchExpensesByCategory({categoryId, yearMonth}));
    }, [dispatch, categoryId, yearMonth]),
  );

  const totalAmount = useMemo(
    () => transactions.reduce((sum: number, t: Expense) => sum + t.amount, 0),
    [transactions],
  );

  return {
    colors,
    currencySymbol,
    transactions,
    totalAmount,
    categoryName,
    categoryColor,
    categoryIcon,
    monthLabel,
    categoryId,
    yearMonth,
  };
};

export default useCategoryTransaction;
