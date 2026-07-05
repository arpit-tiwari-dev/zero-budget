import StorageService from './asyncStorageService';
import {getAvailableExpenseYears} from '../watermelondb/services';

const CACHE_KEY = 'available-expense-years';

const ensureCurrentYear = (years: number[]): number[] => {
  const currentYear = new Date().getFullYear();
  if (!years.includes(currentYear)) {
    return [...years, currentYear].sort((a, b) => a - b);
  }
  return years;
};

export const getCachedYears = (): number[] => {
  const raw = StorageService.getItemSync(CACHE_KEY);
  if (raw) {
    try {
      return ensureCurrentYear(JSON.parse(raw));
    } catch {
      return [new Date().getFullYear()];
    }
  }
  return [new Date().getFullYear()];
};

const setCachedYears = (years: number[]): void => {
  StorageService.setItemSync(CACHE_KEY, JSON.stringify(years));
};

export const loadAvailableYears = async (userId: string): Promise<number[]> => {
  const cached = getCachedYears();
  if (cached.length > 1) {
    return cached;
  }
  const years = await getAvailableExpenseYears(userId);
  const withCurrent = ensureCurrentYear(years);
  setCachedYears(withCurrent);
  return withCurrent;
};

export const ensureYearInCache = (year: number): number[] => {
  const cached = getCachedYears();
  if (!cached.includes(year)) {
    const updated = [...cached, year].sort((a, b) => a - b);
    setCachedYears(updated);
    return updated;
  }
  return cached;
};

export const refreshYearsCache = async (userId: string): Promise<number[]> => {
  const years = await getAvailableExpenseYears(userId);
  const withCurrent = ensureCurrentYear(years);
  setCachedYears(withCurrent);
  return withCurrent;
};
