import {ScrollView, TextInput, View} from 'react-native';
import React, {useCallback, useEffect, useMemo, useState, memo} from 'react';
import type {RouteProp} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';
import type {HomeStackParamList} from '../../navigation/types';
import PrimaryView from '../atoms/PrimaryView';
import AppHeader from '../atoms/AppHeader';
import CustomInput from '../atoms/CustomInput';
import PrimaryText from '../atoms/PrimaryText';
import Icon from '../atoms/Icons';
import CategoryContainer from './CategoryContainer';
import PrimaryButton from '../atoms/PrimaryButton';
import useThemeColors from '../../hooks/useThemeColors';
import useFormatAmount from '../../hooks/useFormatAmount';
import {goBack, navigate} from '../../utils/navigationUtils';
import {selectCurrencySymbol} from '../../redux/slice/currencyDataSlice';
import {selectUserId} from '../../redux/slice/userIdSlice';
import {fetchCategories, selectActiveCategories} from '../../redux/slice/categoryDataSlice';
import {createExpense, updateExpenseById, getAllExpensesByDate, type CategoryData as CategoryDocType} from '../../watermelondb/services';
import {fetchExpensesByMonth, invalidateExpenseCache} from '../../redux/slice/expenseDataSlice';
import {fetchBudgetsByMonth, selectCurrentBudget} from '../../redux/slice/budgetDataSlice';
import DatePicker from '../atoms/DatePicker';
import {getISODateTime, formatDate} from '../../utils/dateUtils';
import {ensureYearInCache} from '../../utils/availableYearsCache';
import {expenseAmountSchema, expenseDescriptionSchema, expenseSchema} from '../../utils/validationSchema';
import {useAppDispatch, useAppSelector} from '../../redux/hooks';
import {gs} from '../../styles/globalStyles';

interface ExpenseEntryProps {
  type: string;
  route?: RouteProp<HomeStackParamList, 'UpdateTransactionScreen'>;
}

const ExpenseEntry: React.FC<ExpenseEntryProps> = ({type, route}) => {
  const {t} = useTranslation();
  const expenseData = route?.params;
  const isAddButton = type === 'Add';
  const [hasInteracted, setHasInteracted] = useState(false);
  const categories = useAppSelector(selectActiveCategories);
  const [selectedCategories, setSelectedCategories] = useState<CategoryDocType[]>(
    isAddButton
      ? []
      : categories?.filter((category: CategoryDocType) => category?.name === expenseData?.category?.name) ?? [],
  );

  const [createdAt, setCreatedAt] = useState(isAddButton ? getISODateTime() : expenseData?.expenseDate ?? getISODateTime());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [expenseTitle, setExpenseTitle] = useState(isAddButton ? '' : expenseData?.expenseTitle ?? '');
  const [expenseDescription, setExpenseDescription] = useState(isAddButton ? '' : expenseData?.expenseDescription ?? '');
  const [expenseAmount, setExpenseAmount] = useState(isAddButton ? '' : String(expenseData?.expenseAmount ?? ''));

  const expenseAmountError = hasInteracted
    ? expenseAmountSchema?.safeParse(Number(expenseAmount)).error?.issues || []
    : [];

  const isValid =
    expenseSchema.safeParse(expenseTitle).success &&
    expenseDescriptionSchema.safeParse(expenseDescription).success &&
    expenseAmountSchema.safeParse(Number(expenseAmount)).success;

  const userId = useAppSelector(selectUserId);
  const currencySymbol = useAppSelector(selectCurrencySymbol);
  const dispatch = useAppDispatch();

  const colors = useThemeColors();
  const formatAmount = useFormatAmount();
  const currentBudget = useAppSelector(selectCurrentBudget);

  const expenseYearMonth = formatDate(createdAt, 'YYYY-MM');
  const expenseDateStr = formatDate(createdAt, 'YYYY-MM-DD');

  useEffect(() => {
    dispatch(fetchCategories());
    dispatch(fetchBudgetsByMonth(expenseYearMonth));
  }, [dispatch, expenseYearMonth]);

  const [daySpend, setDaySpend] = useState(0);
  useEffect(() => {
    let cancelled = false;
    getAllExpensesByDate(userId, expenseDateStr).then(expenses => {
      if (!cancelled) {
        setDaySpend(expenses.reduce((sum, e) => sum + e.amount, 0));
      }
    });
    return () => { cancelled = true; };
  }, [userId, expenseDateStr]);

  const dailyBudgetInfo = useMemo(() => {
    if (!currentBudget) {return null;}

    const [yearStr, monthStr] = expenseYearMonth.split('-');
    const year = Number.parseInt(yearStr, 10);
    const month = Number.parseInt(monthStr, 10);
    const daysInMonth = new Date(year, month, 0).getDate();
    const dailyBudget = currentBudget.amount / daysInMonth;
    const enteredAmount = Number.parseFloat(expenseAmount) || 0;
    const dailyRemaining = dailyBudget - daySpend - enteredAmount;

    return {dailyBudget, dailyRemaining, exceeded: dailyRemaining <= 0};
  }, [currentBudget, expenseYearMonth, daySpend, expenseAmount]);

  const handleAddCategory = useCallback(() => {
    navigate('AddCategoryScreen');
  }, []);

  const handleTextInputFocus = useCallback(() => {
    setHasInteracted(true);
  }, []);

  const handleAddExpense = useCallback(async () => {
    if (!isValid || selectedCategories.length === 0) {
      return;
    }
    const categoryId = selectedCategories[0].id;
    try {
      await createExpense(userId, expenseTitle, Number(expenseAmount), expenseDescription, categoryId, createdAt);

      const yearMonth = formatDate(createdAt, 'YYYY-MM');
      const year = Number.parseInt(formatDate(createdAt, 'YYYY'), 10);
      ensureYearInCache(year);
      dispatch(invalidateExpenseCache());
      await dispatch(fetchExpensesByMonth(yearMonth));
      goBack();
    } catch (error) {
      if (__DEV__) {
        console.error('Error creating expense:', error);
      }
    }
  }, [isValid, selectedCategories, userId, expenseTitle, expenseAmount, expenseDescription, createdAt, dispatch]);

  const handleUpdateExpense = useCallback(async () => {
    if (!isValid || selectedCategories.length === 0 || !expenseData?.expenseId) {
      return;
    }
    const categoryId = selectedCategories[0].id;
    try {
      await updateExpenseById(
        expenseData.expenseId,
        categoryId,
        expenseTitle,
        Number(expenseAmount),
        expenseDescription,
        createdAt,
      );

      const yearMonth = formatDate(createdAt, 'YYYY-MM');
      const year = Number.parseInt(formatDate(createdAt, 'YYYY'), 10);
      ensureYearInCache(year);
      dispatch(invalidateExpenseCache());
      await dispatch(fetchExpensesByMonth(yearMonth));
      goBack();
    } catch (error) {
      if (__DEV__) {
        console.error('Error updating expense:', error);
      }
    }
  }, [
    isValid,
    selectedCategories,
    expenseData?.expenseId,
    expenseTitle,
    expenseAmount,
    expenseDescription,
    createdAt,
    dispatch,
  ]);

  const toggleCategorySelection = useCallback(
    (category: CategoryDocType) => {
      if (selectedCategories.includes(category)) {
        setSelectedCategories([]);
      } else {
        setSelectedCategories([category]);
      }
    },
    [selectedCategories],
  );

  return (
    <PrimaryView colors={colors} dismissKeyboardOnTouch>
      <View style={[gs.mb20, gs.mt20]}>
        <AppHeader onPress={() => goBack()} colors={colors} text={isAddButton ? t('transaction.addTitle') : t('transaction.editTitle')} />
      </View>

      <CustomInput
        colors={colors}
        input={expenseTitle}
        setInput={setExpenseTitle}
        placeholder={t('transaction.titlePlaceholder')}
        label={t('transaction.titleLabel')}
        schema={expenseSchema}
      />
      <CustomInput
        colors={colors}
        input={expenseDescription}
        setInput={setExpenseDescription}
        placeholder={t('transaction.descriptionPlaceholder')}
        label={t('transaction.descriptionLabel')}
        schema={expenseDescriptionSchema}
      />

      <PrimaryText size={12} color={colors.secondaryText} style={gs.mb5}>{t('transaction.amountLabel')}</PrimaryText>
      <View
        style={[
          gs.h48,
          gs.itemsCenter,
          gs.rounded12,
          gs.pl10,
          gs.justifyStart,
          gs.row,
          {
            backgroundColor: colors.secondaryAccent,
            marginBottom: expenseAmountError.length > 0 ? 5 : 15,
          },
        ]}>
        <PrimaryText size={15} variant="number" color={colors.secondaryText}>{currencySymbol}</PrimaryText>
        <TextInput
          style={[gs.px15, gs.h48, gs.wFull, gs.numMedium, gs.noFontPadding, {color: colors.primaryText}]}
          value={expenseAmount}
          onChangeText={setExpenseAmount}
          placeholder={'0'}
          onChange={handleTextInputFocus}
          placeholderTextColor={colors.secondaryText}
          keyboardType="numeric"
        />
      </View>
      {expenseAmountError.length > 0 && (
        <View style={gs.mb10}>
          {expenseAmountError.map((error: {message: string}) => (
            <View key={error.message}>
              <PrimaryText size={12} color={colors.accentRed}>
                {error.message}
              </PrimaryText>
            </View>
          ))}
        </View>
      )}

      {dailyBudgetInfo ? (
        <View style={[gs.rowCenter, gs.gap6, gs.mb10]}>
          <Icon
            name="target"
            size={13}
            color={dailyBudgetInfo.exceeded ? colors.accentOrange : colors.accentGreen}
          />
          <PrimaryText size={11} variant="number" color={colors.secondaryText}>
            {t('transaction.dailyBudget', {amount: formatAmount(Math.round(dailyBudgetInfo.dailyBudget))})}
          </PrimaryText>
          <PrimaryText size={11} color={colors.secondaryText}>·</PrimaryText>
          <PrimaryText
            size={11}
            variant="number"
            color={dailyBudgetInfo.exceeded ? colors.accentOrange : colors.accentGreen}>
            {dailyBudgetInfo.exceeded
              ? t('transaction.dailyExceeded', {amount: formatAmount(Math.round(Math.abs(dailyBudgetInfo.dailyRemaining)))})
              : t('transaction.dailyRemaining', {amount: formatAmount(Math.round(dailyBudgetInfo.dailyRemaining))})}
          </PrimaryText>
        </View>
      ) : null}

      <DatePicker
        setShowDatePicker={setShowDatePicker}
        createdAt={createdAt}
        showDatePicker={showDatePicker}
        setCreatedAt={setCreatedAt}
        label={t('transaction.dateLabel')}
      />

      <PrimaryText size={12} color={colors.secondaryText} style={gs.mb8}>{t('transaction.categoryLabel')}</PrimaryText>
      <ScrollView showsVerticalScrollIndicator={false}>
        <CategoryContainer
          categories={categories}
          colors={colors}
          toggleCategorySelection={toggleCategorySelection}
          selectedCategories={selectedCategories}
        />
        <PrimaryButton
          onPress={handleAddCategory}
          colors={colors}
          buttonTitle={t('transaction.addCategoryButton')}
          variant="ghost"
          size="sm"
          fullWidth={false}
        />
      </ScrollView>
      <View style={gs.mt5}>
        <PrimaryButton
          onPress={isAddButton ? handleAddExpense : handleUpdateExpense}
          colors={colors}
          buttonTitle={isAddButton ? t('common.add') : t('common.update')}
          disabled={!isValid || selectedCategories.length === 0}
        />
      </View>
    </PrimaryView>
  );
};

export default memo(ExpenseEntry);
