import {TouchableOpacity, View} from 'react-native';
import React, {useCallback, useMemo, memo} from 'react';
import {useTranslation} from 'react-i18next';
import Icon from '../atoms/Icons';
import {navigate} from '../../utils/navigationUtils';
import {DebtorData as Debtor, DebtData as DebtDocType} from '../../watermelondb/services';
import PrimaryText from '../atoms/PrimaryText';
import {Colors} from '../../hooks/useThemeColors';
import useFormatAmount from '../../hooks/useFormatAmount';
import {FlashList} from '@shopify/flash-list';
import {gs} from '../../styles/globalStyles';

interface Debt extends DebtDocType {
  debtor?: {type?: string};
}

interface DebtorListProps {
  colors: Colors;
  debtors: Array<Debtor>;
  allDebts: Array<Debt>;
  ListHeaderComponent?: React.ComponentType<any> | React.ReactElement | null;
}

const DebtorList: React.FC<DebtorListProps> = ({colors, debtors, allDebts, ListHeaderComponent}) => {
  const {t} = useTranslation();
  const formatAmount = useFormatAmount();
  const handleDebtor = useCallback((debtorId: string, debtorName: string, debtorType: string) => {
    navigate('IndividualDebtsScreen', {debtorId, debtorName, debtorType});
  }, []);

  const debtTotalsByDebtor = useMemo(() => {
    const totalsMap = new Map<string, number>();

    allDebts.forEach((debt: Debt) => {
      const debtorId = debt.debtorId;
      if (!debtorId) return;

      const current = totalsMap.get(debtorId) ?? 0;
      const delta = debt.type === 'Borrow' ? debt.amount : -debt.amount;
      totalsMap.set(debtorId, current + delta);
    });

    return totalsMap;
  }, [allDebts]);

  const getDebtTotal = useCallback(
    (debtorId: string): number => {
      return debtTotalsByDebtor.get(debtorId) ?? 0;
    },
    [debtTotalsByDebtor],
  );

  const getAmountColor = useCallback(
    (debtorId: string): string => {
      const totalDebt = getDebtTotal(debtorId);
      if (totalDebt < 0) {
        return colors.accentGreen;
      } else if (totalDebt > 0) {
        return colors.accentOrange;
      }
      return colors.primaryText;
    },
    [colors, getDebtTotal],
  );

  const renderDebtorItem = useCallback(
    ({item: debtor}: {item: Debtor}) => {
      const debtorId = String(debtor.id);
      const totalDebt = getDebtTotal(debtorId);
      const amountColor = getAmountColor(debtorId);
      let debtLabel = t('debts.settled');
      if (totalDebt > 0) debtLabel = t('debts.youOwe');
      else if (totalDebt < 0) debtLabel = t('debts.owesYou');

      return (
        <TouchableOpacity
          onPress={() => handleDebtor(debtorId, debtor.title, debtor.type)}
          activeOpacity={0.7}
          style={[gs.mx16, gs.py12, gs.rowCenter, {borderBottomWidth: 0.5, borderBottomColor: colors.secondaryAccent}]}>
          <View
            style={[
              gs.size36,
              gs.rounded50,
              gs.center,
              {backgroundColor: (debtor.color ?? colors.primaryText) + '18'},
            ]}>
            <Icon name={debtor.icon || 'user'} size={18} color={debtor.color || colors.primaryText} />
          </View>

          <View style={[gs.flex1, gs.ml12]}>
            <PrimaryText size={14} weight="semibold" numberOfLines={1}>
              {debtor.title}
            </PrimaryText>
            <PrimaryText size={11} color={colors.secondaryText}>
              {debtLabel}
            </PrimaryText>
          </View>

          <View style={[gs.itemsEnd, gs.mr3]}>
            <PrimaryText size={14} weight="bold" color={amountColor} variant="number">
              {formatAmount(Math.abs(totalDebt))}
            </PrimaryText>
          </View>

          <Icon name="chevron-right" size={16} color={colors.secondaryText} />
        </TouchableOpacity>
      );
    },
    [colors, formatAmount, getDebtTotal, getAmountColor, handleDebtor],
  );

  const ListEmpty = useCallback(() => (
    <View style={[gs.center, gs.mt30p]}>
      <View style={[gs.size50, gs.roundedFull, gs.center, {backgroundColor: colors.secondaryAccent}]}>
        <Icon name="users" size={22} color={colors.secondaryText} />
      </View>
      <PrimaryText size={13} color={colors.secondaryText} style={gs.mt10}>
        {t('debts.noOneHereYet')}
      </PrimaryText>
    </View>
  ), [colors]);

  return (
    <View style={gs.flex1}>
      <FlashList
        data={debtors}
        renderItem={renderDebtorItem}
        keyExtractor={item => String(item.id)}
        ListHeaderComponent={ListHeaderComponent}
        ListEmptyComponent={ListEmpty}
        contentContainerStyle={gs.pb100}
      />
    </View>
  );
};

export default memo(DebtorList);
