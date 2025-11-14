# Currency & Localization System

## Overview

The application uses Ghana Cedi (GHS) as the default currency, with support for easy localization and currency changes in the future.

## Default Currency

- **Currency Code**: `GHS` (Ghana Cedi)
- **Locale**: `en-GH` (English - Ghana)
- **Symbol**: `GH₵` (automatically formatted by Intl.NumberFormat)

## Usage

### Formatting Currency

Use the `formatCurrency` utility function to format numbers as currency:

```typescript
import { formatCurrency } from '@/utils/currencyUtils';

// Format a number
formatCurrency(100.50); // "GH₵ 100.50"
formatCurrency(1000);   // "GH₵ 1,000.00"
formatCurrency(null);   // "N/A"

// With custom options
formatCurrency(100.50, { minimumFractionDigits: 0 }); // "GH₵ 101"
```

### Getting Currency Configuration

```typescript
import { getCurrencyConfig } from '@/utils/currencyUtils';

const config = getCurrencyConfig();
// { code: 'GHS', locale: 'en-GH' }
```

### Changing Currency (for Localization)

To change the currency for localization or user preferences:

```typescript
import { setCurrency } from '@/utils/currencyUtils';

// Change to USD
setCurrency({ code: 'USD', locale: 'en-US' });

// Change to EUR
setCurrency({ code: 'EUR', locale: 'en-GB' });

// Change back to GHS
setCurrency({ code: 'GHS', locale: 'en-GH' });
```

### Using Localization Context (React Components)

The `LocalizationProvider` is already set up in the root layout. You can access currency configuration in React components:

```typescript
import { useLocalization } from '@/context/LocalizationContext';

function MyComponent() {
  const { currency, setCurrencyConfig, resetCurrencyConfig } = useLocalization();

  // Access current currency
  console.log(currency.code); // 'GHS'
  console.log(currency.locale); // 'en-GH'

  // Change currency (saves to localStorage)
  const handleChangeCurrency = () => {
    setCurrencyConfig({ code: 'USD', locale: 'en-US' });
  };

  // Reset to default (GHS)
  const handleResetCurrency = () => {
    resetCurrencyConfig();
  };

  return (
    <div>
      <p>Current currency: {currency.code}</p>
      <button onClick={handleChangeCurrency}>Change to USD</button>
      <button onClick={handleResetCurrency}>Reset to GHS</button>
    </div>
  );
}
```

## Implementation Details

### Currency Utility (`src/utils/currencyUtils.ts`)

- Provides `formatCurrency()` function for formatting numbers
- Provides `setCurrency()` function for changing currency
- Provides `getCurrencyConfig()` function for getting current currency
- Provides `resetCurrency()` function for resetting to default (GHS)
- Uses `Intl.NumberFormat` for locale-aware formatting

### Localization Context (`src/context/LocalizationContext.tsx`)

- React Context for currency and localization configuration
- Persists currency preference to `localStorage` (for future user preferences)
- Provides `useLocalization()` hook for accessing currency configuration
- Automatically initialized with GHS as default

### Current Usage

Currency formatting is currently used in:

1. **Inventory Items Table** (`src/components/inventory/InventoryItemsTable.tsx`)
   - Displays cost per unit

2. **Inventory Transactions Table** (`src/components/inventory/InventoryTransactionsTable.tsx`)
   - Displays transaction costs

3. **Inventory Item Detail Page** (`src/app/(admin)/farms/[id]/inventory/[itemId]/page.tsx`)
   - Displays cost per unit in item details

## Future Enhancements

### User Preferences

The system is designed to support user preferences in the future:

1. **User Profile Settings**: Allow users to set their preferred currency
2. **Farm-Level Settings**: Allow different currencies per farm
3. **Multi-Currency Support**: Support multiple currencies with conversion rates
4. **Date/Time Localization**: Extend to support date/time formatting
5. **Language Localization**: Add support for multiple languages

### Implementation Steps

1. Add currency preference to user profile/farm settings
2. Load currency from user/farm settings on app initialization
3. Update `LocalizationProvider` to load from user preferences
4. Add currency selection UI in settings page
5. Implement currency conversion (if needed)

## Testing

To test currency formatting:

```typescript
import { formatCurrency, setCurrency, getCurrencyConfig } from '@/utils/currencyUtils';

// Test default (GHS)
console.log(formatCurrency(100.50)); // "GH₵ 100.50"

// Test USD
setCurrency({ code: 'USD', locale: 'en-US' });
console.log(formatCurrency(100.50)); // "$100.50"

// Test EUR
setCurrency({ code: 'EUR', locale: 'en-GB' });
console.log(formatCurrency(100.50)); // "€100.50"

// Reset to GHS
setCurrency({ code: 'GHS', locale: 'en-GH' });
console.log(formatCurrency(100.50)); // "GH₵ 100.50"
```

## Notes

- Currency formatting uses the browser's `Intl.NumberFormat` API
- Currency symbol and format are automatically determined by the locale
- All currency values are stored as numbers in the database (no currency symbol)
- Currency formatting is only applied in the frontend for display purposes
- The default currency (GHS) is set in `src/utils/currencyUtils.ts`

