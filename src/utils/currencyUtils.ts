/**
 * Currency Configuration and Formatting Utilities
 * 
 * This module provides currency formatting functionality with support for localization.
 * Default currency is set to Ghana Cedi (GHS) but can be easily changed for localization.
 */

export interface CurrencyConfig {
  code: string; // ISO 4217 currency code (e.g., 'GHS', 'USD', 'EUR')
  locale: string; // BCP 47 locale code (e.g., 'en-GH', 'en-US')
  symbol?: string; // Optional custom symbol override
}

// Default currency configuration - Ghana Cedi
const DEFAULT_CURRENCY: CurrencyConfig = {
  code: 'GHS',
  locale: 'en-GH',
};

// Currency configuration - can be changed for localization
let currentCurrency: CurrencyConfig = DEFAULT_CURRENCY;

/**
 * Get the current currency configuration
 */
export function getCurrencyConfig(): CurrencyConfig {
  return currentCurrency;
}

/**
 * Set the currency configuration
 * This can be used for localization or user preferences
 * 
 * @example
 * setCurrency({ code: 'USD', locale: 'en-US' });
 */
export function setCurrency(config: CurrencyConfig): void {
  currentCurrency = config;
}

/**
 * Reset currency to default (GHS)
 */
export function resetCurrency(): void {
  currentCurrency = DEFAULT_CURRENCY;
}

/**
 * Format a number as currency using the current currency configuration
 * 
 * @param value - The numeric value to format
 * @param options - Optional Intl.NumberFormatOptions to override defaults
 * @returns Formatted currency string (e.g., "GH₵ 100.00" or "N/A" if value is null/undefined)
 * 
 * @example
 * formatCurrency(100.50); // "GH₵ 100.50"
 * formatCurrency(null); // "N/A"
 */
export function formatCurrency(value?: number | null, options?: Intl.NumberFormatOptions): string {
  if (value === null || value === undefined) {
    return 'N/A';
  }

  const config = getCurrencyConfig();
  
  return new Intl.NumberFormat(config.locale, {
    style: 'currency',
    currency: config.code,
    ...options,
  }).format(value);
}

/**
 * Parse a currency string to a number
 * 
 * @param value - The currency string to parse
 * @returns The numeric value or null if parsing fails
 * 
 * @example
 * parseCurrency("GH₵ 100.50"); // 100.50
 */
export function parseCurrency(value: string): number | null {
  if (!value || typeof value !== 'string') {
    return null;
  }

  // Remove currency symbols and whitespace
  const cleaned = value.replace(/[^\d.-]/g, '');
  const parsed = parseFloat(cleaned);
  
  if (Number.isNaN(parsed)) {
    return null;
  }
  
  return parsed;
}

/**
 * Get currency symbol for the current currency
 * 
 * @returns Currency symbol (e.g., "GH₵" for GHS)
 */
export function getCurrencySymbol(): string {
  // Get symbol from formatted value of 0
  const formatted = formatCurrency(0, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  // Extract symbol (everything before the number)
  const match = formatted.match(/^[^\d\s]+/);
  return match ? match[0].trim() : getCurrencyConfig().code;
}

