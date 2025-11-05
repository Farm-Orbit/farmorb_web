"use client";

import React, { useMemo } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Checkbox,
  Box,
  Divider,
} from '@mui/material';
import { type MRT_ColumnDef } from 'material-react-table';

export interface CustomTableCardViewProps<TData extends Record<string, any> = Record<string, any>> {
  row: TData;
  columns: MRT_ColumnDef<TData>[];
  isDarkMode: boolean;
  enableRowSelection?: boolean;
  isSelected?: boolean;
  onSelectionChange?: (selected: boolean) => void;
  onRowClick?: (row: TData) => void;
  getRowId?: (row: TData) => string;
  mobilePrimaryColumns?: string[];
}

/**
 * CustomTableCardView - Renders a single row as a Material UI Card
 * Used for mobile/responsive views of table data
 */
function CustomTableCardView<TData extends Record<string, any>>({
  row,
  columns,
  isDarkMode,
  enableRowSelection = false,
  isSelected = false,
  onSelectionChange,
  onRowClick,
  getRowId,
  mobilePrimaryColumns,
}: CustomTableCardViewProps<TData>) {
  // Get primary columns (first 2 by default, or specified mobilePrimaryColumns)
  const primaryColumns = useMemo(() => {
    // Filter out action columns and columns without accessorKey/id
    const validColumns = columns.filter((col) => {
      const accessorKey = typeof col.accessorKey === 'string' ? col.accessorKey : col.id;
      // Skip action columns
      if (col.id === 'actions' || (typeof col.header === 'string' && col.header === 'Actions')) return false;
      // Skip columns without accessorKey or id
      if (!accessorKey) return false;
      // Skip columns that are just computed values without data (like 'id' used for animal counts)
      // but allow them if they have a proper accessorKey
      return true;
    });

    if (mobilePrimaryColumns && mobilePrimaryColumns.length > 0) {
      const matched = validColumns.filter((col) => {
        const accessorKey = typeof col.accessorKey === 'string' ? col.accessorKey : col.id;
        return accessorKey && mobilePrimaryColumns.includes(accessorKey);
      });
      // If no matches found, fall back to first 2 columns
      return matched.length > 0 ? matched : validColumns.slice(0, 2);
    }
    return validColumns.slice(0, 2);
  }, [columns, mobilePrimaryColumns]);

  // Get remaining columns (all columns except primary and action columns)
  const remainingColumns = useMemo(() => {
    const primaryKeys = primaryColumns.map((col) => {
      const accessorKey = typeof col.accessorKey === 'string' ? col.accessorKey : col.id;
      return accessorKey;
    });
    return columns.filter((col) => {
      const accessorKey = typeof col.accessorKey === 'string' ? col.accessorKey : col.id;
      // Skip action columns
      if (col.id === 'actions' || (typeof col.header === 'string' && col.header === 'Actions')) return false;
      // Skip columns without accessorKey
      if (!accessorKey) return false;
      // Skip primary columns
      return !primaryKeys.includes(accessorKey);
    });
  }, [columns, primaryColumns]);

  // Get cell value for a column
  const getCellValue = (column: MRT_ColumnDef<TData>): React.ReactNode => {
    const accessorKey = typeof column.accessorKey === 'string' ? column.accessorKey : column.id;
    
    // Skip columns without accessorKey or id (like action columns)
    if (!accessorKey) {
      // If it's an actions column, don't render it in cards
      if (column.id === 'actions' || (typeof column.header === 'string' && column.header === 'Actions')) {
        return null;
      }
      return null;
    }

    // Try to get value from row data
    let value: any = row[accessorKey];
    
    // If value is undefined and we have accessorFn, try that
    if (value === undefined && column.accessorFn) {
      try {
        value = column.accessorFn(row);
      } catch (e) {
        // If accessorFn fails, value stays undefined
      }
    }

    // Always use custom cell renderer if available (it might compute the value)
    if (column.Cell) {
      try {
        const cellContext = {
          cell: {
            getValue: () => value,
            row: { original: row },
            column: { id: accessorKey },
          },
          row: { original: row },
          column: { id: accessorKey },
          renderedCellValue: value,
        };
        const renderedCell = column.Cell(cellContext as any);
        
        // If the Cell renderer returns a React element, we can use it directly
        // The Cell renderer might return JSX with Tailwind classes, which we can render
        if (renderedCell !== null && renderedCell !== undefined) {
          // If it's a React element, return it as-is (it will render with its own styling)
          return renderedCell;
        }
        
        // Fallback to raw value if Cell returns null/undefined
        return value === null || value === undefined ? '-' : String(value);
      } catch (error) {
        // If Cell renderer fails, fall back to raw value
        console.warn('Error rendering cell:', error);
        return value === null || value === undefined ? '-' : String(value);
      }
    }

    // Format value
    if (value === null || value === undefined) {
      return '-';
    }

    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }

    if (value instanceof Date) {
      return value.toLocaleDateString();
    }

    return String(value);
  };

  // Get column header text
  const getColumnHeader = (column: MRT_ColumnDef<TData>): string => {
    if (typeof column.header === 'string') {
      return column.header;
    }
    if (typeof column.header === 'function') {
      try {
        const headerContext = {
          column: { id: typeof column.accessorKey === 'string' ? column.accessorKey : column.id },
        };
        const result = (column.header as any)(headerContext);
        if (typeof result === 'string') return result;
        if (typeof result === 'object' && result !== null) {
          // If it's a React element, try to extract text
          return String(result);
        }
        return String(result);
      } catch (e) {
        // If header function fails, fall back to accessor key
        const accessorKey = typeof column.accessorKey === 'string' ? column.accessorKey : column.id;
        return accessorKey ? String(accessorKey).replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()) : '';
      }
    }
    const accessorKey = typeof column.accessorKey === 'string' ? column.accessorKey : column.id;
    return accessorKey ? String(accessorKey).replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()) : '';
  };

  const rowId = getRowId ? getRowId(row) : String(row.id || JSON.stringify(row));

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't trigger row click if clicking on checkbox
    if ((e.target as HTMLElement).closest('.MuiCheckbox-root')) {
      return;
    }
    onRowClick?.(row);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onRowClick?.(row);
    }
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    onSelectionChange?.(e.target.checked);
  };

  return (
    <Card
      role="article"
      aria-label={`Row ${rowId}`}
      data-testid={getRowId ? `card-row-${rowId}` : undefined}
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      tabIndex={onRowClick ? 0 : -1}
      sx={{
        marginBottom: '12px',
        width: '100%',
        boxShadow: 'none',
        border: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`,
        borderRadius: '8px',
        backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
        cursor: onRowClick ? 'pointer' : 'default',
        transition: 'all 0.2s ease-in-out',
        '&:hover': onRowClick ? {
          backgroundColor: isDarkMode ? '#374151' : '#f9fafb',
          borderColor: isDarkMode ? '#4b5563' : '#d1d5db',
        } : {},
        '&:focus': onRowClick ? {
          outline: `2px solid ${isDarkMode ? '#22c55e' : '#16a34a'}`,
          outlineOffset: '2px',
        } : {},
      }}
    >
      <CardContent sx={{ padding: '16px', '&:last-child': { paddingBottom: '16px' } }}>
        {/* Header with primary columns and selection checkbox */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
            marginBottom: primaryColumns.length > 0 && remainingColumns.length > 0 ? '12px' : '0',
          }}
        >
          {enableRowSelection && (
            <Checkbox
              checked={isSelected}
              onChange={handleCheckboxChange}
              onClick={(e) => e.stopPropagation()}
              sx={{
                color: isDarkMode ? '#4b5563' : '#d1d5db',
                padding: '4px',
                '&.Mui-checked': {
                  color: '#16a34a',
                },
              }}
            />
          )}

          <Box sx={{ flex: 1, minWidth: 0 }}>
            {primaryColumns.length > 0 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {primaryColumns.map((column, index) => {
                  const accessorKey = typeof column.accessorKey === 'string' ? column.accessorKey : column.id;
                  const header = getColumnHeader(column);
                  const value = getCellValue(column);
                  const isTitle = index === 0;

                  // Skip if value is null (e.g., action columns)
                  if (value === null) return null;

                  return (
                    <Box key={accessorKey || index}>
                      {isTitle ? (
                        <Typography
                          variant="subtitle1"
                          component="div"
                          sx={{
                            fontWeight: 600,
                            fontSize: '0.875rem',
                            color: isDarkMode ? '#f9fafb' : '#111827',
                            lineHeight: 1.4,
                          }}
                        >
                          {value}
                        </Typography>
                      ) : (
                        <Typography
                          variant="body2"
                          component="div"
                          sx={{
                            fontSize: '0.875rem',
                            color: isDarkMode ? '#9ca3af' : '#6b7280',
                            lineHeight: 1.4,
                          }}
                        >
                          {value}
                        </Typography>
                      )}
                    </Box>
                  );
                })}
              </Box>
            )}
          </Box>
        </Box>

        {/* Remaining columns */}
        {remainingColumns.length > 0 && (
          <>
            {primaryColumns.length > 0 && (
              <Divider
                sx={{
                  marginY: '12px',
                  borderColor: isDarkMode ? '#374151' : '#e5e7eb',
                }}
              />
            )}
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              {remainingColumns.map((column) => {
                const accessorKey = typeof column.accessorKey === 'string' ? column.accessorKey : column.id;
                const header = getColumnHeader(column);
                const value = getCellValue(column);

                // Skip columns with null values (e.g., action columns)
                if (value === null) return null;

                return (
                  <Box
                    key={accessorKey || String(column.id)}
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      gap: '12px',
                    }}
                  >
                    <Typography
                      variant="body2"
                      component="span"
                      sx={{
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        color: isDarkMode ? '#9ca3af' : '#6b7280',
                        flexShrink: 0,
                        minWidth: '80px',
                      }}
                    >
                      {header}:
                    </Typography>
                    <Typography
                      variant="body2"
                      component="span"
                      sx={{
                        fontSize: '0.875rem',
                        color: isDarkMode ? '#f9fafb' : '#111827',
                        textAlign: 'right',
                        flex: 1,
                        wordBreak: 'break-word',
                      }}
                    >
                      {value}
                    </Typography>
                  </Box>
                );
              })}
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default CustomTableCardView;
