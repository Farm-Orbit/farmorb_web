"use client";

import React, { useEffect, useState, useMemo } from 'react';
import {
  MaterialReactTable,
  useMaterialReactTable,
  type MRT_ColumnDef,
  type MRT_TableOptions,
} from 'material-react-table';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import '@/styles/material-table-custom.css';

interface CustomMaterialTableProps<TData extends Record<string, any>> {
  columns: MRT_ColumnDef<TData>[];
  data: TData[];
  isLoading?: boolean;
  enableRowSelection?: boolean;
  enableColumnFilters?: boolean;
  enableGlobalFilter?: boolean;
  enableSorting?: boolean;
  enablePagination?: boolean;
  onRowClick?: (row: TData) => void;
  renderTopToolbarCustomActions?: () => React.ReactNode;
  getRowId?: (row: TData) => string;
  initialPageSize?: number;
  additionalTableOptions?: Partial<MRT_TableOptions<TData>>;
}

function CustomMaterialTable<TData extends Record<string, any>>({
  columns,
  data,
  isLoading = false,
  enableRowSelection = true,
  enableColumnFilters = true,
  enableGlobalFilter = true,
  enableSorting = true,
  enablePagination = true,
  onRowClick,
  renderTopToolbarCustomActions,
  getRowId,
  initialPageSize = 10,
  additionalTableOptions = {},
}: CustomMaterialTableProps<TData>) {
  // Detect dark mode dynamically
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Check initial dark mode state
    const checkDarkMode = () => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    };
    
    checkDarkMode();

    // Watch for theme changes
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  // Custom MUI theme to match our design
  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: isDarkMode ? 'dark' : 'light',
          primary: {
            main: '#16a34a', // green-600
            light: '#22c55e', // green-500
            dark: '#15803d', // green-700
          },
          background: {
            default: isDarkMode ? '#1f2937' : '#ffffff', // gray-800 : white
            paper: isDarkMode ? '#1f2937' : '#ffffff', // gray-800 : white
          },
          text: {
            primary: isDarkMode ? '#f9fafb' : '#111827', // gray-50 : gray-900
            secondary: isDarkMode ? '#9ca3af' : '#6b7280', // gray-400 : gray-500
          },
          divider: isDarkMode ? '#374151' : '#e5e7eb', // gray-700 : gray-200
        },
      }),
    [isDarkMode]
  );

  const table = useMaterialReactTable({
    columns,
    data,
    enableRowSelection,
    enableColumnOrdering: false,
    enableGlobalFilter,
    enableColumnFilters,
    enablePagination,
    enableSorting,
    enableBottomToolbar: enablePagination,
    enableTopToolbar: true,
    enableFullScreenToggle: false,
    enableDensityToggle: false,
    enableHiding: false,
    getRowId,
    initialState: {
      showGlobalFilter: enableGlobalFilter,
      pagination: { pageSize: initialPageSize, pageIndex: 0 },
    },
    muiTablePaperProps: {
      elevation: 0,
      sx: {
        backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
        border: '1px solid',
        borderColor: isDarkMode ? '#374151' : '#e5e7eb',
        borderRadius: '8px',
        boxShadow: 'none',
      },
    },
    muiSearchTextFieldProps: {
      placeholder: 'Search',
      sx: { 
        minWidth: '300px',
        '& .MuiOutlinedInput-root': {
          backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
          color: isDarkMode ? '#f9fafb' : '#111827',
          '& fieldset': {
            borderColor: isDarkMode ? '#4b5563' : '#d1d5db',
          },
          '&:hover fieldset': {
            borderColor: isDarkMode ? '#6b7280' : '#9ca3af',
          },
          '&.Mui-focused fieldset': {
            borderColor: '#16a34a',
          },
        },
        '& .MuiInputBase-input': {
          color: isDarkMode ? '#f9fafb' : '#111827',
        },
        '& .MuiInputBase-input::placeholder': {
          color: isDarkMode ? '#6b7280' : '#9ca3af',
          opacity: 1,
        },
      },
      variant: 'outlined',
      size: 'small',
    },
    muiTableHeadCellProps: {
      sx: {
        backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.3)' : '#f9fafb',
        borderBottom: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`,
        fontWeight: '600',
        fontSize: '0.75rem',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        color: isDarkMode ? '#9ca3af' : '#6b7280',
        padding: '12px 24px',
      },
    },
    muiTableBodyCellProps: {
      sx: {
        padding: '16px 24px',
        borderBottom: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`,
        backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
        color: isDarkMode ? '#f9fafb' : '#111827',
      },
    },
    muiTableBodyRowProps: ({ row }) => ({
      onClick: onRowClick ? () => onRowClick(row.original) : undefined,
      'data-testid': getRowId ? `farm-row-${getRowId(row.original)}` : undefined,
      sx: {
        cursor: onRowClick ? 'pointer' : 'default',
        backgroundColor: `${isDarkMode ? '#1f2937' : '#ffffff'} !important`,
        '&:hover': {
          backgroundColor: `${isDarkMode ? '#1f2937' : '#ffffff'} !important`,
        },
        '&:hover td': {
          backgroundColor: `${isDarkMode ? '#1f2937' : '#ffffff'} !important`,
        },
      },
    }),
    muiTopToolbarProps: {
      sx: {
        backgroundColor: `${isDarkMode ? '#1f2937' : '#ffffff'} !important`,
        borderBottom: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`,
        color: isDarkMode ? '#f9fafb' : '#111827',
        '& .MuiIconButton-root': {
          color: isDarkMode ? '#9ca3af' : '#6b7280',
        },
        '& .MuiSvgIcon-root': {
          color: isDarkMode ? '#9ca3af' : '#6b7280',
        },
      },
    },
    muiBottomToolbarProps: {
      sx: {
        backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.3)' : '#f9fafb',
        borderTop: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`,
        color: isDarkMode ? '#9ca3af' : '#6b7280',
        '& .MuiTablePagination-root': {
          color: isDarkMode ? '#9ca3af' : '#6b7280',
        },
        '& .MuiTablePagination-selectLabel': {
          color: isDarkMode ? '#9ca3af' : '#6b7280',
        },
        '& .MuiTablePagination-displayedRows': {
          color: isDarkMode ? '#9ca3af' : '#6b7280',
        },
        '& .MuiSelect-icon': {
          color: isDarkMode ? '#9ca3af' : '#6b7280',
        },
        '& .MuiIconButton-root': {
          color: isDarkMode ? '#9ca3af' : '#6b7280',
        },
        '& .MuiSvgIcon-root': {
          color: isDarkMode ? '#9ca3af' : '#6b7280',
        },
      },
    },
    muiTableContainerProps: {
      sx: {
        backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
      },
    },
    muiSelectCheckboxProps: {
      sx: {
        color: isDarkMode ? '#4b5563' : '#d1d5db',
        '&.Mui-checked': {
          color: '#16a34a',
        },
      },
    },
    muiSelectAllCheckboxProps: {
      sx: {
        color: isDarkMode ? '#4b5563' : '#d1d5db',
        '&.Mui-checked': {
          color: '#16a34a',
        },
      },
    },
    muiTableBodyProps: {
      sx: {
        '& .MuiTableRow-root': {
          backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
        },
      },
    },
    renderTopToolbarCustomActions,
    state: {
      isLoading,
    },
    ...additionalTableOptions,
  });

  return (
    <ThemeProvider theme={theme}>
      <MaterialReactTable table={table} />
    </ThemeProvider>
  );
}

export default CustomMaterialTable;

