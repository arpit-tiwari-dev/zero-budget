import {RefreshControlProps, View} from 'react-native';
import {TouchableOpacity} from 'react-native-gesture-handler';
import React, {useCallback, useMemo, useRef, memo} from 'react';
import {useTranslation} from 'react-i18next';
import Animated, {SharedValue, useAnimatedStyle, interpolate} from 'react-native-reanimated';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import type {SwipeableMethods} from 'react-native-gesture-handler/ReanimatedSwipeable';
import {DebtData as Debt} from '../../watermelondb/services';
import PrimaryText from '../atoms/PrimaryText';
import Icon from '../atoms/Icons';
import {formatDate, formatCalendar} from '../../utils/dateUtils';
import {Colors} from '../../hooks/useThemeColors';
import useFormatAmount from '../../hooks/useFormatAmount';
import {FlashList} from '@shopify/flash-list';
import {gs} from '../../styles/globalStyles';

interface DebtListProps {
  colors: Colors;
  handleEditDebt: (debtId: string, description: string, amount: number, date: string, type: string) => void;
  handleDeleteDebt: (debtId: string) => void;
  individualDebts: Array<Debt>;
  ListHeaderComponent?: React.ComponentType<any> | React.ReactElement | null;
  refreshControl?: React.ReactElement<RefreshControlProps>;
  tutorialSwipeRef?: React.RefObject<SwipeableMethods | null>;
}

interface GroupedDebt {
  date: string;
  debts: Array<Debt>;
  label: string;
}

const ACTION_WIDTH = 50;
const EDGE_INSET = 16;

const SwipeAction = ({
  progress,
  iconName,
  iconColor,
  backgroundColor,
  side,
  onPress,
}: {
  progress: SharedValue<number>;
  iconName: string;
  iconColor: string;
  backgroundColor: string;
  side: 'left' | 'right';
  onPress: () => void;
}) => {
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.6, 1], [0, 0.8, 1]),
    transform: [{scale: interpolate(progress.value, [0, 1], [0.6, 1])}],
  }));

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[
        gs.center,
        {
          flex: 1,
          width: ACTION_WIDTH + EDGE_INSET,
          paddingLeft: side === 'left' ? EDGE_INSET : 0,
          paddingRight: side === 'right' ? EDGE_INSET : 0,
        },
      ]}>
      <Animated.View style={[gs.size40, gs.roundedFull, gs.center, animatedStyle, {backgroundColor}]}>
        <Icon name={iconName} size={18} color={iconColor} />
      </Animated.View>
    </TouchableOpacity>
  );
};

const DebtRow = memo(({
  debt,
  colors,
  onEdit,
  onDelete,
  openSwipeableRef,
  tutorialSwipeRef,
}: {
  debt: Debt;
  colors: Colors;
  onEdit: (debt: Debt) => void;
  onDelete: (debtId: string) => void;
  openSwipeableRef: React.RefObject<{close: () => void} | null>;
  tutorialSwipeRef?: React.RefObject<SwipeableMethods | null>;
}) => {
  const swipeableRef = useRef<SwipeableMethods | null>(null);
  const formatAmount = useFormatAmount();

  const combinedRef = tutorialSwipeRef ?? swipeableRef;

  const handleSwipeWillOpen = useCallback(() => {
    if (openSwipeableRef.current && openSwipeableRef.current !== combinedRef.current) {
      openSwipeableRef.current.close();
    }
    openSwipeableRef.current = combinedRef.current;
  }, [openSwipeableRef, combinedRef]);

  return (
    <View style={gs.mb5}>
      <ReanimatedSwipeable
        ref={combinedRef}
        renderLeftActions={(progress, _translation, swipeableMethods) => (
          <SwipeAction
            progress={progress}
            iconName="pencil"
            iconColor={colors.accentGreen}
            backgroundColor={colors.lightAccent}
            side="left"
            onPress={() => {
              onEdit(debt);
              swipeableMethods.close();
            }}
          />
        )}
        renderRightActions={(progress, _translation, swipeableMethods) => (
          <SwipeAction
            progress={progress}
            iconName="trash-2"
            iconColor={colors.accentOrange}
            backgroundColor={colors.lightAccent}
            side="right"
            onPress={() => {
              onDelete(String(debt.id));
              swipeableMethods.close();
            }}
          />
        )}
        onSwipeableWillOpen={handleSwipeWillOpen}
        friction={2}
        overshootLeft={false}
        overshootRight={false}
        overshootFriction={8}>
        <View
          style={[
            gs.rounded12,
            gs.rowBetweenCenter,
            gs.px14,
            gs.py10,
            gs.mx16,
            {backgroundColor: colors.containerColor},
          ]}>
          <View style={[gs.flex1, gs.gap2]}>
            <PrimaryText weight="medium" numberOfLines={1}>
              {debt.description}
            </PrimaryText>
            <PrimaryText size={11} color={colors.secondaryText}>
              {formatDate(debt.date, 'Do MMM YYYY')}
            </PrimaryText>
          </View>
          <View style={gs.ml10}>
            <PrimaryText size={14} weight="semibold" variant="number">
              {formatAmount(debt.amount)}
            </PrimaryText>
          </View>
        </View>
      </ReanimatedSwipeable>
    </View>
  );
});

const DebtGroup = memo(({
  group,
  colors,
  handleEditDebt,
  handleDeleteDebt,
  openSwipeableRef,
  tutorialSwipeRef,
  isFirstGroup,
}: {
  group: GroupedDebt;
  colors: Colors;
  handleEditDebt: (debtId: string, description: string, amount: number, date: string, type: string) => void;
  handleDeleteDebt: (debtId: string) => void;
  openSwipeableRef: React.RefObject<{close: () => void} | null>;
  tutorialSwipeRef?: React.RefObject<SwipeableMethods | null>;
  isFirstGroup?: boolean;
}) => {
  const onEdit = useCallback((debt: Debt) => {
    handleEditDebt(String(debt.id), debt.description, debt.amount, debt.date, debt.type);
  }, [handleEditDebt]);

  const onDelete = useCallback((debtId: string) => {
    handleDeleteDebt(debtId);
  }, [handleDeleteDebt]);

  return (
    <View>
      <PrimaryText size={12} weight="semibold" color={colors.secondaryText} style={[gs.mb8, gs.mt15, gs.px16]}>
        {group.label}
      </PrimaryText>
      {group.debts.map((debt, index) => (
        <DebtRow
          key={String(debt.id)}
          debt={debt}
          colors={colors}
          onEdit={onEdit}
          onDelete={onDelete}
          openSwipeableRef={openSwipeableRef}
          tutorialSwipeRef={isFirstGroup && index === 0 ? tutorialSwipeRef : undefined}
        />
      ))}
    </View>
  );
});

const DebtList: React.FC<DebtListProps> = ({
  colors,
  handleEditDebt,
  handleDeleteDebt,
  individualDebts,
  ListHeaderComponent,
  refreshControl,
  tutorialSwipeRef,
}) => {
  const {t} = useTranslation();
  const openSwipeableRef = useRef<{close: () => void} | null>(null);

  const groupedData: GroupedDebt[] = useMemo(() => {
    const groupedExpenses = new Map<string, Array<Debt>>();

    individualDebts?.forEach(debt => {
      const date = formatDate(debt.date, 'YYYY-MM-DD');
      const currentGroup = groupedExpenses.get(date) ?? [];
      currentGroup.push(debt);
      groupedExpenses.set(date, currentGroup);
    });

    return Array.from(groupedExpenses.keys()).map(date => ({
      date,
      debts: groupedExpenses.get(date) ?? [],
      label: formatCalendar(date),
    }));
  }, [individualDebts]);

  const renderGroupItem = useCallback(
    ({item, index}: {item: GroupedDebt; index: number}) => (
      <DebtGroup
        group={item}
        colors={colors}
        handleEditDebt={handleEditDebt}
        handleDeleteDebt={handleDeleteDebt}
        openSwipeableRef={openSwipeableRef}
        tutorialSwipeRef={index === 0 ? tutorialSwipeRef : undefined}
        isFirstGroup={index === 0}
      />
    ),
    [colors, handleEditDebt, handleDeleteDebt, tutorialSwipeRef],
  );

  const ListEmpty = useCallback(() => (
    <View style={[gs.center, gs.mt30p]}>
      <View style={[gs.size50, gs.roundedFull, gs.center, {backgroundColor: colors.secondaryAccent}]}>
        <Icon name="hand-coins" size={22} color={colors.secondaryText} />
      </View>
      <PrimaryText size={13} color={colors.secondaryText} style={gs.mt10}>
        {t('debts.noEntriesYet')}
      </PrimaryText>
    </View>
  ), [colors]);

  return (
    <View style={gs.flex1}>
      <FlashList
        data={groupedData}
        renderItem={renderGroupItem}
        keyExtractor={item => item.date}
        ListHeaderComponent={ListHeaderComponent}
        ListEmptyComponent={ListEmpty}
        refreshControl={refreshControl}
        contentContainerStyle={gs.pb80}
      />
    </View>
  );
};

export default memo(DebtList);
