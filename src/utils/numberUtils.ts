import {getFormatLocale, getDeviceLocaleInfo} from './locale';

const LAKH_CURRENCIES = new Set([
  'INR', 'BDT', 'NPR', 'PKR', 'LKR',
]);

const LAKH_COUNTRY_CODES = new Set([
  'IN', 'BD', 'NP', 'PK', 'LK',
]);

/**
 * Returns the correct locale for currency formatting.
 * Prevents Indian lakh/crore grouping from leaking into non-South-Asian currencies.
 *
 * The lakh/crore pattern (1,24,000) is baked into the numbering system of
 * South Asian LANGUAGES (hi, bn, ta, mr, pa, ne, etc.), not just country codes.
 * So "hi-US" still gives lakh grouping. We must use "en-US" as the fallback
 * to guarantee international grouping (groups of 3).
 */
const getEffectiveLocaleForCurrency = (currencyCode?: string): string => {
  const deviceLocale = getFormatLocale();
  if (!currencyCode) return deviceLocale;

  const {countryCode} = getDeviceLocaleInfo();
  const isLakhLocale = LAKH_COUNTRY_CODES.has(countryCode);
  const isLakhCurrency = LAKH_CURRENCIES.has(currencyCode.toUpperCase());

  if (isLakhLocale && !isLakhCurrency) {
    return 'en-US';
  }

  return deviceLocale;
};

const CURRENCY_DECIMALS: Record<string, number> = {
  JPY: 0,
  KRW: 0,
  VND: 0,
  IDR: 0,
  CLP: 0,
  COP: 0,
  HUF: 0,
  ISK: 0,
  PYG: 0,
  RWF: 0,
  UGX: 0,
  VUV: 0,
  XAF: 0,
  XOF: 0,
  XPF: 0,
  DJF: 0,
  GNF: 0,
  KMF: 0,
  MGA: 0,
  PKR: 0,
  IRR: 0,
  IQD: 0,
  LBP: 0,
  MMK: 0,
  SOS: 0,
  SYP: 0,
  TZS: 0,
  UZS: 0,
  YER: 0,
  ZMK: 0,
  ZWL: 0,
  AFN: 0,
  ALL: 0,
  AMD: 0,
  BHD: 3,
  KWD: 3,
  OMR: 3,
  TND: 3,
  LYD: 3,
  JOD: 3,
};

const numberFormatCache = new Map<string, Intl.NumberFormat>();

const getNumberFormatter = (
  locale: string,
  options: Intl.NumberFormatOptions,
): Intl.NumberFormat => {
  const cacheKey = `${locale}|${JSON.stringify(options)}`;
  let formatter = numberFormatCache.get(cacheKey);
  if (!formatter) {
    formatter = new Intl.NumberFormat(locale, options);
    numberFormatCache.set(cacheKey, formatter);
  }
  return formatter;
};

export const getCurrencyDecimals = (currencyCode?: string): number => {
  if (!currencyCode) return 2;
  return CURRENCY_DECIMALS[currencyCode.toUpperCase()] ?? 2;
};

/**
 * Formats a plain number with locale-aware grouping.
 * Uses device locale by default (respects user's OS number format preference).
 */
export const formatNumber = (
  amount: number,
  options: {
    locale?: string;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
    useGrouping?: boolean;
  } = {},
): string => {
  const {
    locale = getFormatLocale(),
    minimumFractionDigits = 0,
    maximumFractionDigits = 2,
    useGrouping = true,
  } = options;

  try {
    const formatter = getNumberFormatter(locale, {
      minimumFractionDigits,
      maximumFractionDigits,
      useGrouping,
    });
    return formatter.format(amount);
  } catch {
    return amount.toLocaleString();
  }
};

/**
 * Formats an amount with locale-aware grouping and currency-specific decimals.
 * Does NOT include symbol — use formatAmountWithSymbol for full currency display.
 */
export const formatCurrency = (amount: number, currencyCode?: string, locale?: string): string => {
  const effectiveLocale = locale ?? getEffectiveLocaleForCurrency(currencyCode);
  const maxDecimals = getCurrencyDecimals(currencyCode);

  if (!Number.isFinite(amount)) return '0';

  const isWholeNumber = Number.isInteger(amount);
  const minDecimals = maxDecimals === 3
    ? 3
    : isWholeNumber ? 0 : Math.min(2, maxDecimals);

  try {
    const formatter = getNumberFormatter(effectiveLocale, {
      minimumFractionDigits: minDecimals,
      maximumFractionDigits: maxDecimals,
      useGrouping: true,
    });
    return formatter.format(amount);
  } catch {
    if (isWholeNumber) {
      return amount.toString().replaceAll(/\B(?=(\d{3})+(?!\d))/g, ',');
    }
    return amount.toFixed(maxDecimals).replaceAll(/\B(?=(\d{3})+(?!\d))/g, ',');
  }
};

/**
 * Formats a full currency string with correct symbol placement per locale.
 * Handles prefix ($ before) vs suffix (₽ after) automatically.
 *
 * Examples:
 *   en-US + USD → "$124,000"
 *   ru-RU + RUB → "124 000 ₽"
 *   hu-HU + HUF → "124 000 Ft"
 *   en-IN + INR → "₹1,24,000"
 *   de-DE + EUR → "124.000 €"
 */
export const formatAmountWithSymbol = (
  amount: number,
  currencyCode: string,
  locale?: string,
): string => {
  const effectiveLocale = locale ?? getEffectiveLocaleForCurrency(currencyCode);

  if (!Number.isFinite(amount)) return '0';

  const maxDecimals = getCurrencyDecimals(currencyCode);
  const isWholeNumber = Number.isInteger(amount);
  const minDecimals = maxDecimals === 3
    ? 3
    : isWholeNumber ? 0 : Math.min(2, maxDecimals);

  try {
    const formatter = getNumberFormatter(effectiveLocale, {
      style: 'currency',
      currency: currencyCode,
      currencyDisplay: 'narrowSymbol',
      minimumFractionDigits: minDecimals,
      maximumFractionDigits: maxDecimals,
    });
    return formatter.format(amount);
  } catch {
    // Fallback: narrowSymbol not supported for this currency, try symbol
    try {
      const fallbackFormatter = getNumberFormatter(effectiveLocale, {
        style: 'currency',
        currency: currencyCode,
        currencyDisplay: 'symbol',
        minimumFractionDigits: minDecimals,
        maximumFractionDigits: maxDecimals,
      });
      return fallbackFormatter.format(amount);
    } catch {
      return `${currencyCode} ${formatCurrency(amount, currencyCode, effectiveLocale)}`;
    }
  }
};

/**
 * @deprecated Use formatAmountWithSymbol instead for correct locale-aware placement.
 * Kept for backward compatibility during migration.
 */
export const formatWithSymbol = (
  amount: number,
  symbol: string,
  currencyCode?: string,
  locale?: string,
): string => {
  if (currencyCode) {
    return formatAmountWithSymbol(amount, currencyCode, locale);
  }
  const formattedAmount = formatCurrency(amount, currencyCode, locale);
  return `${symbol}${formattedAmount}`;
};

export const formatCompact = (amount: number, locale?: string): string => {
  const effectiveLocale = locale ?? getFormatLocale();
  if (!Number.isFinite(amount)) return '0';

  try {
    const formatter = getNumberFormatter(effectiveLocale, {
      notation: 'compact',
      compactDisplay: 'short',
      maximumFractionDigits: 1,
    });
    return formatter.format(amount);
  } catch {
    if (Math.abs(amount) >= 1e9) return `${(amount / 1e9).toFixed(1)}B`;
    if (Math.abs(amount) >= 1e6) return `${(amount / 1e6).toFixed(1)}M`;
    if (Math.abs(amount) >= 1e3) return `${(amount / 1e3).toFixed(1)}K`;
    return amount.toString();
  }
};

export const parseCurrency = (value: string): number => {
  if (!value) return 0;
  const cleaned = value.replaceAll(/[^0-9.-]/g, '');
  const parsed = Number.parseFloat(cleaned);
  return Number.isNaN(parsed) ? 0 : parsed;
};

export const roundCurrency = (amount: number, currencyCode?: string): number => {
  const decimals = getCurrencyDecimals(currencyCode);
  const factor = Math.pow(10, decimals);
  return Math.round(amount * factor) / factor;
};

export const isValidAmount = (amount: unknown): amount is number => {
  return typeof amount === 'number' && Number.isFinite(amount) && !Number.isNaN(amount);
};

export const safeAdd = (...amounts: number[]): number => {
  const sum = amounts.reduce((acc, val) => acc + (val || 0), 0);
  return roundCurrency(sum);
};

export const safeSubtract = (a: number, b: number): number => {
  return roundCurrency((a || 0) - (b || 0));
};
