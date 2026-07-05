import {useSelector} from 'react-redux';
import {selectCurrencyCode, selectCurrencySymbol} from '../redux/slice/currencyDataSlice';
import {formatAmountWithSymbol, formatCurrency} from '../utils/numberUtils';

/**
 * Hook that returns a locale-aware currency formatting function.
 * Handles symbol placement, grouping, and decimal precision automatically.
 *
 * Usage:
 *   const formatAmount = useFormatAmount();
 *   <Text>{formatAmount(12400)}</Text>
 *   // en-US + USD → "$12,400"
 *   // ru-RU + RUB → "12 400 ₽"
 *   // en-IN + INR → "₹12,400"
 */
const useFormatAmount = () => {
  const currencyCode = useSelector(selectCurrencyCode);
  const currencySymbol = useSelector(selectCurrencySymbol);

  const formatAmount = (amount: number): string => {
    if (currencyCode) {
      return formatAmountWithSymbol(amount, currencyCode);
    }
    // Fallback if currencyCode not yet loaded
    return `${currencySymbol}${formatCurrency(amount)}`;
  };

  return formatAmount;
};

export default useFormatAmount;
