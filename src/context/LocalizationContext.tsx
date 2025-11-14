"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CurrencyConfig, setCurrency, getCurrencyConfig, resetCurrency } from '@/utils/currencyUtils';

interface LocalizationContextType {
  currency: CurrencyConfig;
  setCurrencyConfig: (config: CurrencyConfig) => void;
  resetCurrencyConfig: () => void;
}

const LocalizationContext = createContext<LocalizationContextType | undefined>(undefined);

interface LocalizationProviderProps {
  children: ReactNode;
  defaultCurrency?: CurrencyConfig;
}

/**
 * Localization Provider
 * 
 * Provides currency and localization configuration throughout the application.
 * Default currency is Ghana Cedi (GHS) but can be changed via user preferences.
 * 
 * @example
 * <LocalizationProvider>
 *   <App />
 * </LocalizationProvider>
 */
export function LocalizationProvider({ children, defaultCurrency }: LocalizationProviderProps) {
  // Initialize with default currency (GHS) or provided default
  const [currency, setCurrencyState] = useState<CurrencyConfig>(
    defaultCurrency || getCurrencyConfig()
  );

  // Update currency utility when state changes
  useEffect(() => {
    setCurrency(currency);
  }, [currency]);

  // Initialize currency on mount
  useEffect(() => {
    if (defaultCurrency) {
      setCurrency(defaultCurrency);
      setCurrencyState(defaultCurrency);
    }
    // Load currency from localStorage if available (for future user preferences)
    const savedCurrency = localStorage.getItem('app_currency');
    if (savedCurrency) {
      try {
        const parsed = JSON.parse(savedCurrency) as CurrencyConfig;
        setCurrency(parsed);
        setCurrencyState(parsed);
      } catch (error) {
        console.error('Failed to parse saved currency:', error);
        // Fall back to default
        resetCurrency();
        setCurrencyState(getCurrencyConfig());
      }
    }
  }, [defaultCurrency]);

  const setCurrencyConfig = (config: CurrencyConfig) => {
    setCurrency(config);
    setCurrencyState(config);
    // Save to localStorage for persistence (for future user preferences)
    try {
      localStorage.setItem('app_currency', JSON.stringify(config));
    } catch (error) {
      console.error('Failed to save currency to localStorage:', error);
    }
  };

  const resetCurrencyConfig = () => {
    resetCurrency();
    setCurrencyState(getCurrencyConfig());
    // Clear from localStorage
    try {
      localStorage.removeItem('app_currency');
    } catch (error) {
      console.error('Failed to remove currency from localStorage:', error);
    }
  };

  return (
    <LocalizationContext.Provider
      value={{
        currency,
        setCurrencyConfig,
        resetCurrencyConfig,
      }}
    >
      {children}
    </LocalizationContext.Provider>
  );
}

/**
 * Hook to access localization context
 * 
 * @example
 * const { currency, setCurrencyConfig } = useLocalization();
 * setCurrencyConfig({ code: 'USD', locale: 'en-US' });
 */
export function useLocalization(): LocalizationContextType {
  const context = useContext(LocalizationContext);
  if (context === undefined) {
    // If context is not available, return default currency
    return {
      currency: getCurrencyConfig(),
      setCurrencyConfig: (config: CurrencyConfig) => {
        setCurrency(config);
      },
      resetCurrencyConfig: () => {
        resetCurrency();
      },
    };
  }
  return context;
}

