import {formatDate} from '../../utils/dateUtils';
import useThemeColors from '../../hooks/useThemeColors';
import {useAppDispatch, useAppSelector} from '../../redux/hooks';
import {selectCurrencySymbol} from '../../redux/slice/currencyDataSlice';
import {RouteProp, useFocusEffect} from '@react-navigation/native';
import {ExpenseData as Expense} from '../../watermelondb/services';
import {useCallback, useMemo} from 'react';
import {fetchEverydayExpenses, selectFilteredExpenses} from '../../redux/slice/expenseDataSlice';
export type EverydayTransactionRouteProp = RouteProp<
  {
    EverydayTransaction: {
      dayTransactions: Array<Expense>;
      isDate: string;
    };
  },
  'EverydayTransaction'
>;

const useEverydayTransaction = (route: EverydayTransactionRouteProp) => {
  const dispatch = useAppDispatch();
  const allEverydayTransactions = (useAppSelector(selectFilteredExpenses) ?? []) as Expense[];
  const expenseDate = route.params?.isDate ?? '';
  const formattedDate = formatDate(expenseDate, 'MMM Do YY');
  const formattedDateDisplay = formatDate(expenseDate, 'MMM Do YY');
  const colors = useThemeColors();
  const currencySymbol = useAppSelector(selectCurrencySymbol);

  useFocusEffect(
    useCallback(() => {
      dispatch(fetchEverydayExpenses(expenseDate));
    }, [dispatch, expenseDate]),
  );

  const totalAmountForTheDay = useMemo(
    () => (allEverydayTransactions ?? []).reduce((sum: number, transaction: Expense) => sum + transaction.amount, 0),
    [allEverydayTransactions],
  );

  return {
    formatDate: formattedDateDisplay,
    formattedDate,
    colors,
    currencySymbol,
    expenseDate,
    allEverydayTransactions,
    totalAmountForTheDay,
  };
};

export default useEverydayTransaction;
