import {useTranslation} from 'react-i18next';
import {selectUserName, setUserName} from '../../redux/slice/userNameSlice';
import {selectUserId} from '../../redux/slice/userIdSlice';
import {
  selectCurrencyId,
  selectCurrencyName,
  selectCurrencySymbol,
  setCurrencyData,
} from '../../redux/slice/currencyDataSlice';
import {useCallback} from 'react';
import {useFocusEffect} from '@react-navigation/native';
import {getAppVersion} from '../../utils/getVersion';
import {useTheme, ThemeMode} from '../../context/ThemeContext';
import {useDialog} from '../../context/DialogContext';
import StorageService from '../../utils/asyncStorageService';
import {updateUserById, updateCurrencyById, deleteAllData} from '../../watermelondb/services';
import {upsertBudget, deleteBudget} from '../../watermelondb/services/budgetService';
import {Linking, Platform} from 'react-native';
import {setIsOnboarded} from '../../redux/slice/isOnboardedSlice';
import {fetchAllData, selectAllData} from '../../redux/slice/allDataSlice';
import {fetchBudgetsByMonth, selectCurrentBudget} from '../../redux/slice/budgetDataSlice';
import {selectMonthIndex, selectYear} from '../../redux/slice/monthSelectionSlice';
import {getMonthNumber, getMonthNames} from '../../utils/dateUtils';
import {useAppDispatch, useAppSelector} from '../../redux/hooks';

const useSettings = () => {
  const {t} = useTranslation();
  const userName = useAppSelector(selectUserName);
  const userId = useAppSelector(selectUserId);
  const currencyId = useAppSelector(selectCurrencyId);
  const currencyName = useAppSelector(selectCurrencyName);
  const currencySymbol = useAppSelector(selectCurrencySymbol);
  const allData = useAppSelector(selectAllData);

  const selectedMonthIndex = useAppSelector(selectMonthIndex);
  const selectedYear = useAppSelector(selectYear);
  const MONTHS = getMonthNames();
  const yearMonth = `${selectedYear}-${getMonthNumber(MONTHS[selectedMonthIndex])}`;
  const currentBudget = useAppSelector(selectCurrentBudget);

  const {colors, themeMode, setThemeMode} = useTheme();
  const {showDialog, showAlert} = useDialog();
  const appVersion = getAppVersion();

  const dispatch = useAppDispatch();

  useFocusEffect(
    useCallback(() => {
      dispatch(fetchAllData());
      dispatch(fetchBudgetsByMonth(yearMonth));
    }, [dispatch, yearMonth]),
  );

  const handleThemeSelection = useCallback(async (theme: string) => {
    try {
      await setThemeMode(theme as ThemeMode);
    } catch (error) {
      if (__DEV__) {
        console.error('Error saving theme preference:', error);
      }
    }
  }, [setThemeMode]);

  const handleNameUpdate = useCallback(async (newName: string) => {
    if (!userId) return;
    try {
      await updateUserById(userId, {username: newName});
      dispatch(setUserName(newName));
    } catch (error) {
      if (__DEV__) {
        console.error('Error updating the name:', error);
      }
    }
  }, [userId, dispatch]);

  const handleCurrencyUpdate = useCallback(
    async (currency: {code: string; name: string; symbol: string}) => {
      if (!currencyId) return;
      try {
        await updateCurrencyById(currencyId, {
          name: currency.name,
          code: currency.code,
          symbol: currency.symbol,
        });
        const updatedCurrencyData = {
          currencyId,
          currencyName: currency.name,
          currencySymbol: currency.symbol,
          currencyCode: currency.code,
        };
        dispatch(setCurrencyData(updatedCurrencyData));
      } catch (error) {
        if (__DEV__) {
          console.error('Error updating the currency:', error);
        }
      }
    },
    [currencyId, dispatch],
  );

  const handleReportBug = useCallback(() => {
    const bugSheetURL = 'https://docs.google.com/spreadsheets/d/187UDxJbFloEUkxxX29ZJnAI7HSdhAAdSbIcAByc8CDU/edit?usp=sharing';
    Linking.openURL(bugSheetURL).catch(err => {
      if (__DEV__) {
        console.error('Error opening bug report sheet:', err);
      }
    });
  }, []);

  const handleRateNow = useCallback(() => {
    const url = Platform.select({
      ios: 'https://apps.apple.com/app/zero-offline-expense-tracker/id6759560225?action=write-review',
      default: 'https://play.google.com/store/apps/details?id=com.anotherwhy.zero',
    });
    Linking.openURL(url).catch(err => {
      if (__DEV__) {
        console.error('Error opening store:', err);
      }
    });
  }, []);

  const handleGithub = useCallback(() => {
    const githubRepoURL = 'https://github.com/indranilbhuin/zero';
    Linking.openURL(githubRepoURL).catch(err => {
      if (__DEV__) {
        console.error('Error opening GitHub:', err);
      }
    });
  }, []);

  const handlePrivacyPolicy = useCallback(() => {
    const privacyPolicyURL = 'https://anotherwhy.com/products/awy-001/privacy-policy';
    Linking.openURL(privacyPolicyURL).catch(err => {
      if (__DEV__) {
        console.error('Error opening Privacy Policy:', err);
      }
    });
  }, []);

  const handleTermsAndConditions = useCallback(() => {
    const termsURL = 'https://anotherwhy.com/products/awy-001/terms';
    Linking.openURL(termsURL).catch(err => {
      if (__DEV__) {
        console.error('Error opening Terms and Conditions:', err);
      }
    });
  }, []);

  const handleDeleteAllData = useCallback(async (exportFn?: () => Promise<void>) => {
    const wantsBackup = await showDialog({
      type: 'info',
      message: t('settings.deleteBackupPrompt'),
      okLabel: t('settings.export'),
      cancelLabel: t('common.skip'),
    });
    if (wantsBackup && exportFn) {
      await exportFn();
    }

    const confirmed = await showDialog({
      type: 'warning',
      message: t('settings.deleteConfirm'),
    });
    if (!confirmed) return;

    await deleteAllData();
    StorageService.setItemSync('isOnboarded', JSON.stringify(false));
    dispatch(setIsOnboarded(false));
  }, [dispatch, showDialog, t]);

  const handleExportResult = useCallback(
    async (success: boolean) => {
      if (success) {
        await showAlert({
          type: 'success',
          message: t('settings.exportSuccess'),
        });
      } else {
        await showAlert({
          type: 'error',
          message: t('settings.exportError'),
        });
      }
    },
    [showAlert, t],
  );

  const requestStorageViaDialog = useCallback(async () => {
    const confirmed = await showDialog({
      type: 'warning',
      message: t('settings.storagePermission'),
    });
    if (confirmed) {
      Linking.openSettings();
    }
  }, [showDialog, t]);

  const handleBudgetSave = useCallback(
    async (amount: number, everyMonth: boolean) => {
      if (!userId) {return;}
      const month = everyMonth ? `recurring:${yearMonth}` : yearMonth;
      await upsertBudget(userId, amount, month);
      dispatch(fetchBudgetsByMonth(yearMonth));
    },
    [userId, yearMonth, dispatch],
  );

  const handleBudgetRemove = useCallback(async () => {
    if (!currentBudget) {return;}
    await deleteBudget(currentBudget.id);
    dispatch(fetchBudgetsByMonth(yearMonth));
  }, [currentBudget, yearMonth, dispatch]);

  return {
    appVersion,
    colors,
    handleThemeSelection,
    handleNameUpdate,
    handleCurrencyUpdate,
    selectedTheme: themeMode,
    userName,
    currencySymbol,
    currencyName,
    currentBudget,
    budgetMonthLabel: `${MONTHS[selectedMonthIndex]} ${selectedYear}`,
    handleBudgetSave,
    handleBudgetRemove,
    handleReportBug,
    handleRateNow,
    handleGithub,
    handlePrivacyPolicy,
    handleTermsAndConditions,
    handleDeleteAllData,
    allData,
    handleExportResult,
    requestStorageViaDialog,
  };
};

export default useSettings;
