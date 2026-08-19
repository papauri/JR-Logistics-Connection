import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateReference(prefix: string): string {
  const year = new Date().getFullYear();
  const randomStr = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `${prefix}-${year}-${randomStr}`;
}

/**
 * Formats a number with comma separators (e.g. 1,450.00 or 280,000)
 */
export function formatNumber(amount: number | string | undefined | null, decimals: number = 2): string {
  if (amount === undefined || amount === null || amount === '') return '0.00';
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '0.00';
  return num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Formats a currency amount with currency symbol and comma separators
 */
export function formatCurrency(
  amount: number | string | undefined | null,
  currency: string = 'EUR',
  decimals?: number
): string {
  const symbol = currency === 'EUR' || currency === '€'
    ? '€'
    : currency === 'USD' || currency === '$'
    ? '$'
    : currency === 'GBP' || currency === '£'
    ? '£'
    : currency === 'MWK' || currency === 'MK'
    ? 'MK'
    : currency;

  if (amount === undefined || amount === null || amount === '') {
    return `${symbol} 0.00`;
  }
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) {
    return `${symbol} 0.00`;
  }

  const resolvedDecimals = decimals !== undefined
    ? decimals
    : (currency.toUpperCase().includes('MWK') || currency.toUpperCase().includes('MK')) && num % 1 === 0
    ? 0
    : 2;

  const formattedNum = num.toLocaleString('en-US', {
    minimumFractionDigits: resolvedDecimals,
    maximumFractionDigits: resolvedDecimals,
  });

  return `${symbol} ${formattedNum}`;
}
