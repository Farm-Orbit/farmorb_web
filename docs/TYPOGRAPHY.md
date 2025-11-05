# Typography System

## Overview
This document defines the typography system for the FarmOrbit application. All components should follow these guidelines to ensure consistent, readable, and professional text styling across the application.

## Font Family
- **Primary Font**: Outfit (sans-serif)
- **Fallback**: System sans-serif fonts
- Applied globally via `font-outfit` class

## Typography Scale

### Headings

#### Page Titles (H1)
- **Size**: `text-xl` (20px)
- **Weight**: `font-semibold` (600)
- **Color**: `text-gray-900 dark:text-white`
- **Usage**: Main page titles, primary headings
- **Example**: `className="text-xl font-semibold text-gray-900 dark:text-white"`

#### Section Headers (H2)
- **Size**: `text-lg` (18px)
- **Weight**: `font-semibold` (600)
- **Color**: `text-gray-900 dark:text-white`
- **Usage**: Section titles, card headers, form sections
- **Example**: `className="text-lg font-semibold text-gray-900 dark:text-white"`

#### Subsection Headers (H3)
- **Size**: `text-base` (16px) or `text-lg` (18px)
- **Weight**: `font-medium` (500) or `font-semibold` (600)
- **Color**: `text-gray-900 dark:text-white` or `text-gray-700 dark:text-gray-300`
- **Usage**: Subsection titles, group labels
- **Example**: `className="text-lg font-medium text-gray-900 dark:text-white"`

### Body Text

#### Primary Body Text
- **Size**: `text-sm` (14px)
- **Weight**: `font-normal` (400)
- **Color**: `text-gray-900 dark:text-white`
- **Usage**: Main content, table cells, primary text
- **Example**: `className="text-sm text-gray-900 dark:text-white"`

#### Secondary Body Text
- **Size**: `text-sm` (14px)
- **Weight**: `font-normal` (400)
- **Color**: `text-gray-600 dark:text-gray-400`
- **Usage**: Supporting text, descriptions, secondary information
- **Example**: `className="text-sm text-gray-600 dark:text-gray-400"`

#### Tertiary Body Text
- **Size**: `text-sm` (14px)
- **Weight**: `font-normal` (400)
- **Color**: `text-gray-500 dark:text-gray-500`
- **Usage**: Metadata, timestamps, less important text
- **Example**: `className="text-sm text-gray-500 dark:text-gray-500"`

### Labels

#### Form Labels
- **Size**: `text-sm` (14px)
- **Weight**: `font-medium` (500)
- **Color**: `text-gray-700 dark:text-gray-300`
- **Usage**: Form field labels, input labels
- **Example**: `className="text-sm font-medium text-gray-700 dark:text-gray-300"`

#### Field Labels (in cards/details)
- **Size**: `text-sm` (14px)
- **Weight**: `font-medium` (500)
- **Color**: `text-gray-700 dark:text-gray-300`
- **Usage**: Labels in detail views, card field labels
- **Example**: `className="text-sm font-medium text-gray-700 dark:text-gray-300"`

### UI Elements

#### Buttons
- **Size**: `text-sm` (14px)
- **Weight**: `font-medium` (500)
- Usage: Standard button text (handled by Button component)

#### Badges & Tags
- **Size**: `text-xs` (12px)
- **Weight**: `font-medium` (500)
- **Color**: Context-dependent (status colors)
- **Usage**: Status badges, tags, small indicators
- **Example**: `className="text-xs font-medium"`

#### Small Text / Captions
- **Size**: `text-xs` (12px)
- **Weight**: `font-normal` (400)
- **Color**: `text-gray-400 dark:text-gray-500`
- **Usage**: Help text, captions, timestamps, metadata
- **Example**: `className="text-xs text-gray-400 dark:text-gray-500"`

### Empty States

#### Empty State Title
- **Size**: `text-lg` (18px)
- **Weight**: `font-medium` (500)
- **Color**: `text-gray-600 dark:text-gray-400`
- **Usage**: Empty state main message
- **Example**: `className="text-lg font-medium text-gray-600 dark:text-gray-400"`

#### Empty State Description
- **Size**: `text-sm` (14px)
- **Weight**: `font-normal` (400)
- **Color**: `text-gray-500 dark:text-gray-500`
- **Usage**: Empty state supporting text
- **Example**: `className="text-sm text-gray-500 dark:text-gray-500"`

### Error Messages
- **Size**: `text-sm` (14px)
- **Weight**: `font-normal` (400)
- **Color**: `text-red-600 dark:text-red-400`
- **Usage**: Error messages, validation errors
- **Example**: `className="text-sm text-red-600 dark:text-red-400"`

## Table Typography

### Table Headers
- **Size**: `text-sm` (14px) - handled by CustomMaterialTable
- **Weight**: `font-semibold` (600) - handled by CustomMaterialTable
- **Color**: `text-gray-600 dark:text-gray-400` - handled by CustomMaterialTable

### Table Cells
- **Primary Cell Text**: `text-sm font-medium text-gray-900 dark:text-white`
- **Secondary Cell Text**: `text-sm text-gray-600 dark:text-gray-400`
- **Usage**: Table cell content

## Typography Rules

### DO ✅
- Use `text-sm` (14px) for most body text and UI elements
- Use `text-xl` for page titles
- Use `text-lg` for section headers
- Use `text-xs` for badges and small text
- Always include dark mode colors
- Use semantic font weights (normal, medium, semibold)
- Maintain consistent spacing between text elements

### DON'T ❌
- Don't mix `text-base` (16px) and `text-sm` (14px) arbitrarily
- Don't use `text-2xl`, `text-3xl`, `text-4xl` for UI text (reserved for marketing/hero sections)
- Don't use `font-bold` or `font-extrabold` (use `font-semibold` instead)
- Don't use `font-light` or `font-thin`
- Don't skip dark mode color variants
- Don't use inline styles for font sizes

## Common Patterns

### Page Header
```tsx
<h1 className="text-xl font-semibold text-gray-900 dark:text-white">
  Page Title
</h1>
```

### Section Header
```tsx
<h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
  Section Title
</h2>
```

### Card Header
```tsx
<h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
  Card Title
</h3>
```

### Form Label
```tsx
<label className="text-sm font-medium text-gray-700 dark:text-gray-300">
  Field Label
</label>
```

### Body Text
```tsx
<p className="text-sm text-gray-900 dark:text-white">
  Main content text
</p>
```

### Secondary Text
```tsx
<p className="text-sm text-gray-600 dark:text-gray-400">
  Supporting information
</p>
```

### Badge
```tsx
<span className="text-xs font-medium px-2.5 py-1 rounded-full">
  Badge Text
</span>
```

### Empty State
```tsx
<div>
  <h3 className="text-lg font-medium text-gray-600 dark:text-gray-400">
    No items found
  </h3>
  <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
    Description text
  </p>
</div>
```

## Migration Checklist

When updating components:
- [ ] Replace `text-base` with `text-sm` for body text
- [ ] Replace `text-2xl`/`text-3xl` with `text-xl` for page titles
- [ ] Ensure all text has dark mode variants
- [ ] Use `font-semibold` instead of `font-bold`
- [ ] Standardize table cell text to `text-sm`
- [ ] Update empty state text sizes
- [ ] Verify form labels use `text-sm font-medium`

