import {ScrollView, TouchableOpacity, View} from 'react-native';
import React, {useCallback, useMemo} from 'react';
import {useTranslation} from 'react-i18next';
import {PieChart} from 'react-native-svg-charts';
import HeaderContainer from '../../components/molecules/HeaderContainer';
import {getFirstDayOfMonth, formatDate, getMonthIndex, getMonthNumber} from '../../utils/dateUtils';
import {navigate} from '../../utils/navigationUtils';
import useReports from './useReports';
import PrimaryView from '../../components/atoms/PrimaryView';
import PrimaryText from '../../components/atoms/PrimaryText';
import PieChartLabels from '../../components/atoms/PieChartLabels';
import {ExpenseData as Expense} from '../../watermelondb/services';
import EmptyState from '../../components/atoms/EmptyState';
import useFormatAmount from '../../hooks/useFormatAmount';
import {SheetManager} from 'react-native-actions-sheet';
import Icon from '../../components/atoms/Icons';
import DailyBudgetRow from '../../components/atoms/DailyBudgetRow';
import {gs} from '../../styles/globalStyles';
import {hexToRgba} from '../../utils/colorUtils';

const ReportsScreen = () => {
  const {
    colors,
    selectedYear,
    selectedMonth,
    filteredTransactions,
    dayNames,
    availableYears,
    handleMonthYearSelect,
    totalAmountForMonth,
    daysInMonth,
    todayTotal,
    isCurrentMonth,
    currentBudget,
    currencySymbol,
    handleBudgetSave,
    handleBudgetRemove,
  } = useReports();
  const {t} = useTranslation();
  const formatAmount = useFormatAmount();

  const budgetMonthLabel = `${selectedMonth} ${selectedYear}`;
  let dailyBudget = 0;
  let dailyLeft = 0;
  if (currentBudget && daysInMonth > 0) {
    if (isCurrentMonth) {
      const currentDay = new Date().getDate();
      const remainingBudget = currentBudget.amount - totalAmountForMonth; // can be negative
      const remainingDays = Math.max(daysInMonth - currentDay, 1); // avoid div-by-zero; if 0 use 1
      dailyBudget = remainingBudget / remainingDays;
      dailyLeft = dailyBudget - todayTotal;
    } else {
      // For non-current months use simple per-day average (no live recalculation)
      dailyBudget = currentBudget.amount / daysInMonth;
      dailyLeft = dailyBudget - todayTotal;
    }
  }
  const budgetExceeded = currentBudget ? totalAmountForMonth > currentBudget.amount : false;

  const openBudgetSheet = useCallback(() => {
    void SheetManager.show('budget-sheet', {
      payload: {
        currentAmount: currentBudget?.amount,
        currencySymbol,
        isRecurring: currentBudget?.month.startsWith('recurring') ?? false,
        monthLabel: budgetMonthLabel,
        onSave: handleBudgetSave,
        onRemove: handleBudgetRemove,
      },
    });
  }, [currentBudget, currencySymbol, budgetMonthLabel, handleBudgetSave, handleBudgetRemove]);

  const openMonthPicker = useCallback(() => {
    const monthIndex = getMonthIndex(selectedMonth);
    void SheetManager.show('month-year-picker-sheet', {
      payload: {
        selectedMonth: monthIndex,
        selectedYear,
        availableYears,
        onSelect: (monthIdx: number, year: number) => {
          handleMonthYearSelect(monthIdx, year);
        },
      },
    });
  }, [selectedMonth, selectedYear, availableYears, handleMonthYearSelect]);

  const yearMonth = useMemo(
    () => `${selectedYear}-${getMonthNumber(selectedMonth)}`,
    [selectedYear, selectedMonth],
  );

  const pieChartData = useMemo(() => {
    const categoryMap = new Map<string, {category: any; amount: number}>();

    filteredTransactions?.forEach((transaction: any) => {
      const {amount, category} = transaction;
      const categoryName = category?.name ?? t('common.unknown');
      const categoryColor = category?.color ?? '#808080';

      if (categoryMap.has(categoryName)) {
        const existing = categoryMap.get(categoryName)!;
        existing.amount += amount;
      } else {
        categoryMap.set(categoryName, {
          category: {name: categoryName, color: categoryColor, ...category},
          amount,
        });
      }
    });

    return Array.from(categoryMap.values()).map(item => ({
      key: item.category.name,
      value: item.amount,
      svg: {fill: item.category.color ?? '#808080', onPress: () => {}},
      label: `${item.category.name}: ${formatAmount(item.amount)}`,
      categoryId: item.category.id,
      categoryIcon: item.category.icon,
    }));
  }, [filteredTransactions, formatAmount]);

  const handleCategoryPress = useCallback(
    (categoryId: string, categoryName: string, categoryColor: string, categoryIcon?: string) => {
      navigate('CategoryTransactionScreen', {
        categoryId,
        categoryName,
        categoryColor,
        categoryIcon,
        yearMonth,
        monthLabel: `${selectedMonth} ${selectedYear}`,
      });
    },
    [yearMonth, selectedMonth, selectedYear],
  );

  const renderPieChart = useCallback(() => {
    return (
      <View>
        <PieChart style={gs.h200} data={pieChartData} />
        <PieChartLabels
          slices={pieChartData}
          colors={colors}
          onCategoryPress={handleCategoryPress}
        />
      </View>
    );
  }, [pieChartData, colors, handleCategoryPress]);

  const {transactionsByDay, maxDayAmount} = useMemo(() => {
    const byDay = new Map<string, {total: number; count: number}>();
    let maxAmount = 0;

    filteredTransactions?.forEach((transaction: Expense) => {
      const dateKey = formatDate(transaction.date, 'YYYY-MM-DD');
      const current = byDay.get(dateKey) ?? {total: 0, count: 0};
      current.total += transaction.amount;
      current.count += 1;
      byDay.set(dateKey, current);

      if (current.total > maxAmount) {
        maxAmount = current.total;
      }
    });

    return {transactionsByDay: byDay, maxDayAmount: maxAmount};
  }, [filteredTransactions]);

  const getHeatmapColor = useCallback(
    (amount: number, hasTransactions: boolean): string => {
      if (!hasTransactions || amount === 0) {
        return colors.secondaryAccent;
      }

      const ratio = maxDayAmount > 0 ? amount / maxDayAmount : 0;

      if (ratio >= 0.75) {
        return hexToRgba(colors.accentGreen, 1);
      } else if (ratio >= 0.5) {
        return hexToRgba(colors.accentGreen, 0.75);
      } else if (ratio >= 0.25) {
        return hexToRgba(colors.accentGreen, 0.5);
      } else {
        return hexToRgba(colors.accentGreen, 0.3);
      }
    },
    [colors.accentGreen, colors.secondaryAccent, maxDayAmount],
  );

  const calendarData = useMemo(() => {
    const firstDayOfMonth = getFirstDayOfMonth(selectedYear, selectedMonth);
    const monthNum = getMonthNumber(selectedMonth);

    const blanks = new Array(firstDayOfMonth).fill(0);
    const days = Array.from({length: daysInMonth}, (_, i) => i + 1);

    return [...blanks, ...days].map((day, index) => {
      if (day === 0) {
        return {day: 0, index, dateKey: '', total: 0, hasTransactions: false};
      }

      const dayPadded = String(day).padStart(2, '0');
      const dateKey = `${selectedYear}-${monthNum}-${dayPadded}`;
      const dayData = transactionsByDay.get(dateKey);

      return {
        day,
        index,
        dateKey,
        total: dayData?.total ?? 0,
        hasTransactions: (dayData?.count ?? 0) > 0,
      };
    });
  }, [selectedYear, selectedMonth, daysInMonth, transactionsByDay]);

  const renderCalendar = useCallback(() => {
    const monthIndex = getMonthIndex(selectedMonth);

    return calendarData.map(({day, index, dateKey, total, hasTransactions}) => {
      if (day === 0) {
        return <View key={`blank-${index}`} style={[gs.h34, gs.center, {width: '13.5%', margin: 0.5}]} />;
      }

      const backgroundColor = getHeatmapColor(total, hasTransactions);
      const selectedDate = new Date(selectedYear, monthIndex, day);
      const isDate = formatDate(selectedDate, 'YYYY-MM-DD');

      return (
        <TouchableOpacity
          key={dateKey}
          style={[
            gs.h34,
            gs.center,
            gs.rounded4,
            gs.border1,
            {
              width: '13.5%',
              margin: 0.5,
              backgroundColor,
              borderColor: hasTransactions ? colors.accentGreen : colors.secondaryContainerColor,
            },
          ]}
          onPress={() => navigate('EverydayTransactionScreen', {isDate})}>
          <PrimaryText
            size={12}
            weight={hasTransactions ? 'semibold' : 'regular'}
            color={hasTransactions ? colors.buttonText : colors.primaryText}
            variant="number">
            {day}
          </PrimaryText>
        </TouchableOpacity>
      );
    });
  }, [calendarData, selectedMonth, selectedYear, colors, getHeatmapColor]);

  return (
    <PrimaryView colors={colors} useBottomPadding={false}>
      <HeaderContainer headerText={t('reports.title')} />
      <View style={[gs.row, gs.wFull, gs.justifyBetween, gs.gap6, gs.mt10]}>
        <TouchableOpacity
          onPress={openMonthPicker}
          activeOpacity={0.7}
          style={[gs.rowCenter, gs.gap4, gs.px12, gs.py10, gs.rounded8, {backgroundColor: colors.accentGreen}]}>
          <PrimaryText size={13} weight="semibold" color={colors.buttonText}>
            {selectedMonth} {selectedYear}
          </PrimaryText>
          <Icon name="chevron-down" size={14} color={colors.buttonText} />
        </TouchableOpacity>
        <View style={[gs.flex1, gs.px12, gs.py10, gs.rounded8, {backgroundColor: colors.secondaryAccent}]}>
          <PrimaryText size={11} color={colors.secondaryText}>{t('reports.total')}</PrimaryText>
          <PrimaryText size={14} weight="semibold" variant="number" numberOfLines={1}>
            {formatAmount(totalAmountForMonth)}
          </PrimaryText>
        </View>
        <View style={[gs.flex1, gs.px12, gs.py10, gs.rounded8, {backgroundColor: colors.secondaryAccent}]}>
          <PrimaryText size={11} color={colors.secondaryText}>{t('reports.avgPerDay')}</PrimaryText>
          <PrimaryText size={14} weight="semibold" variant="number" numberOfLines={1}>
            {formatAmount(totalAmountForMonth / daysInMonth)}
          </PrimaryText>
        </View>
      </View>

      {currentBudget ? (
        <TouchableOpacity
          onPress={openBudgetSheet}
          activeOpacity={0.7}
          style={[gs.px12, gs.py10, gs.rounded8, gs.mt6, {backgroundColor: colors.secondaryAccent}]}>
          <View style={gs.rowBetweenCenter}>
            <PrimaryText size={13} weight="semibold" variant="number" color={budgetExceeded ? colors.accentOrange : colors.primaryText} numberOfLines={1}>
              {formatAmount(Math.max(currentBudget.amount - totalAmountForMonth, 0))} {t('home.remaining')}
            </PrimaryText>
            <PrimaryText size={11} variant="number" color={colors.secondaryText} numberOfLines={1}>
              {formatAmount(totalAmountForMonth)} / {formatAmount(currentBudget.amount)}
            </PrimaryText>
          </View>
          <View style={[gs.rounded4, gs.h4, gs.mt8, {backgroundColor: colors.secondaryContainerColor}]}>
            <View
              style={[
                gs.rounded4,
                gs.h4,
                {
                  width: `${Math.min((totalAmountForMonth / currentBudget.amount) * 100, 100)}%`,
                  backgroundColor: budgetExceeded ? colors.accentOrange : colors.accentGreen,
                },
              ]}
            />
          </View>
          <View style={gs.mt6}>
            <DailyBudgetRow dailyBudget={dailyBudget} dailyLeft={dailyLeft} isCurrentMonth={isCurrentMonth} colors={colors} formatAmount={formatAmount} t={t} />
          </View>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          onPress={openBudgetSheet}
          activeOpacity={0.7}
          style={[gs.rowCenter, gs.gap6, gs.px12, gs.py10, gs.rounded8, gs.mt6, {backgroundColor: colors.secondaryAccent}]}>
          <Icon name="target" size={14} color={colors.secondaryText} />
          <PrimaryText size={12} color={colors.secondaryText}>{t('reports.setBudget')}</PrimaryText>
        </TouchableOpacity>
      )}

      <ScrollView showsVerticalScrollIndicator={false}>
        {filteredTransactions.length === 0 ? (
          <EmptyState colors={colors} type={'Insights'} style={gs.mt20} />
        ) : (
          <>
            <View style={[gs.row, gs.wrap, gs.mt15]}>
              {dayNames.map(day => (
                <View key={day} style={[gs.h34, gs.center, {width: '13.5%', margin: 0.5}]}>
                  <PrimaryText size={13}>{day}</PrimaryText>
                </View>
              ))}
            </View>
            <View style={[gs.row, gs.wrap]}>{renderCalendar()}</View>

            <View style={[gs.rowCenter, gs.justifyCenter, gs.mt10, gs.mb10, gs.gap4]}>
              <PrimaryText size={11} color={colors.secondaryText}>{t('reports.less')}</PrimaryText>
              {[0.1, 0.3, 0.5, 0.75, 1].map((opacity, i) => (
                <View
                  key={`legend-${i}`}
                  style={[
                    gs.size16,
                    gs.rounded3,
                    gs.border1,
                    {backgroundColor: hexToRgba(colors.accentGreen, opacity), borderColor: colors.secondaryContainerColor},
                  ]}
                />
              ))}
              <PrimaryText size={11} color={colors.secondaryText}>{t('reports.more')}</PrimaryText>
            </View>

            <View style={[gs.mt20, gs.mb20]}>{renderPieChart()}</View>
          </>
        )}
      </ScrollView>
    </PrimaryView>
  );
};

export default ReportsScreen;
