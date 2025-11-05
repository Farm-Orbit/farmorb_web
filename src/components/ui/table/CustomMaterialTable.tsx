"use client";

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  MaterialReactTable,
  useMaterialReactTable,
  type MRT_ColumnDef,
  type MRT_TableOptions,
} from 'material-react-table';
import { ThemeProvider, createTheme, useMediaQuery, Box } from '@mui/material';
import '@/styles/material-table-custom.css';
import CustomTableCardView from './CustomTableCardView';

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
  mobileBreakpoint?: string;
  mobilePrimaryColumns?: string[];
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
  mobileBreakpoint = '(max-width:768px)',
  mobilePrimaryColumns,
}: CustomMaterialTableProps<TData>) {
  // Detect mobile screen size
  const isMobile = useMediaQuery(mobileBreakpoint);
  
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
    enableBottomToolbar: enablePagination && !isMobile, // Hide bottom toolbar on mobile, use custom pagination
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
        '& .MuiTable-root': {
          display: isMobile ? 'none' : 'table', // Hide table body on mobile
        },
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

  // Get filtered and sorted data from table
  const filteredData = useMemo(() => {
    try {
      // Get the filtered rows from the table
      const rows = table.getFilteredRowModel().rows;
      return rows.map((row) => row.original);
    } catch (error) {
      // Fallback to original data if filtering fails
      console.error('Error getting filtered data:', error);
      return data;
    }
  }, [table, data]);

  // Get paginated data for mobile card view
  const paginatedData = useMemo(() => {
    if (!isMobile) {
      return filteredData;
    }
    if (!enablePagination) {
      return filteredData;
    }
    const pageIndex = table.getState().pagination.pageIndex;
    const pageSize = table.getState().pagination.pageSize;
    const start = pageIndex * pageSize;
    const end = start + pageSize;
    return filteredData.slice(start, end);
  }, [filteredData, enablePagination, isMobile, table]);

  // Get selection state
  const selectedRowIds = useMemo(() => {
    if (!enableRowSelection) return new Set<string>();
    return new Set(Object.keys(table.getState().rowSelection || {}));
  }, [enableRowSelection, table]);

  // Handle card selection change
  const handleCardSelectionChange = useCallback((row: TData, selected: boolean) => {
    if (!enableRowSelection || !getRowId) return;
    const rowId = getRowId(row);
    table.setRowSelection((prev) => {
      const newSelection = { ...prev };
      if (selected) {
        newSelection[rowId] = true;
      } else {
        delete newSelection[rowId];
      }
      return newSelection;
    });
  }, [enableRowSelection, getRowId, table]);

  // Render mobile card view
  const renderMobileCards = () => {
    if (!isMobile) return null;
    
    if (isLoading) {
      return (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '32px',
            backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
          }}
        >
          <Box
            sx={{
              color: isDarkMode ? '#9ca3af' : '#6b7280',
            }}
          >
            Loading...
          </Box>
        </Box>
      );
    }

    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          padding: '16px',
          backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
        }}
      >
        {paginatedData.length === 0 ? (
          <Box
            sx={{
              textAlign: 'center',
              padding: '32px',
              color: isDarkMode ? '#9ca3af' : '#6b7280',
            }}
          >
            No data available
          </Box>
        ) : (
          paginatedData.map((row) => {
            const rowId = getRowId ? getRowId(row) : String(row.id || JSON.stringify(row));
            const isSelected = selectedRowIds.has(rowId);

            return (
              <CustomTableCardView
                key={rowId}
                row={row}
                columns={columns}
                isDarkMode={isDarkMode}
                enableRowSelection={enableRowSelection}
                isSelected={isSelected}
                onSelectionChange={(selected) => handleCardSelectionChange(row, selected)}
                onRowClick={onRowClick}
                getRowId={getRowId}
                mobilePrimaryColumns={mobilePrimaryColumns}
              />
            );
          })
        )}
      </Box>
    );
  };

  // Render mobile pagination
  const renderMobilePagination = () => {
    if (!isMobile || !enablePagination || isLoading) return null;

    const pageIndex = table.getState().pagination.pageIndex;
    const pageSize = table.getState().pagination.pageSize;
    const pageCount = table.getPageCount();
    const totalRows = filteredData.length;
    const startRow = pageIndex * pageSize + 1;
    const endRow = Math.min((pageIndex + 1) * pageSize, totalRows);

    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px',
          borderTop: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`,
          backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
        }}
      >
        <Box
          sx={{
            fontSize: '0.875rem',
            color: isDarkMode ? '#9ca3af' : '#6b7280',
          }}
        >
          {startRow}-{endRow} of {totalRows}
        </Box>
        <Box sx={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            onClick={() => table.setPageIndex(0)}
            disabled={pageIndex === 0}
            style={{
              padding: '8px 12px',
              border: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`,
              borderRadius: '4px',
              backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
              color: isDarkMode ? '#f9fafb' : '#111827',
              cursor: pageIndex === 0 ? 'not-allowed' : 'pointer',
              opacity: pageIndex === 0 ? 0.5 : 1,
            }}
          >
            First
          </button>
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            style={{
              padding: '8px 12px',
              border: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`,
              borderRadius: '4px',
              backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
              color: isDarkMode ? '#f9fafb' : '#111827',
              cursor: !table.getCanPreviousPage() ? 'not-allowed' : 'pointer',
              opacity: !table.getCanPreviousPage() ? 0.5 : 1,
            }}
          >
            Previous
          </button>
          <Box
            sx={{
              fontSize: '0.875rem',
              color: isDarkMode ? '#9ca3af' : '#6b7280',
              minWidth: '80px',
              textAlign: 'center',
            }}
          >
            Page {pageIndex + 1} of {pageCount}
          </Box>
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            style={{
              padding: '8px 12px',
              border: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`,
              borderRadius: '4px',
              backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
              color: isDarkMode ? '#f9fafb' : '#111827',
              cursor: !table.getCanNextPage() ? 'not-allowed' : 'pointer',
              opacity: !table.getCanNextPage() ? 0.5 : 1,
            }}
          >
            Next
          </button>
          <button
            onClick={() => table.setPageIndex(pageCount - 1)}
            disabled={pageIndex === pageCount - 1}
            style={{
              padding: '8px 12px',
              border: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`,
              borderRadius: '4px',
              backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
              color: isDarkMode ? '#f9fafb' : '#111827',
              cursor: pageIndex === pageCount - 1 ? 'not-allowed' : 'pointer',
              opacity: pageIndex === pageCount - 1 ? 0.5 : 1,
            }}
          >
            Last
          </button>
        </Box>
      </Box>
    );
  };

  return (
    <ThemeProvider theme={theme}>
      <Box
        sx={{
          position: 'relative',
        }}
      >
        {/* Always render MaterialReactTable for state management */}
        {/* On mobile, hide the table body but keep toolbar visible */}
        <Box
          sx={{
            '& .MuiTableContainer-root': {
              display: isMobile ? 'none !important' : 'block',
            },
            '& .MuiTable-root': {
              display: isMobile ? 'none !important' : 'table',
            },
            '& .MuiTablePagination-root': {
              display: isMobile ? 'none !important' : 'flex',
            },
            '& .MuiTableBody-root': {
              display: isMobile ? 'none !important' : 'table-row-group',
            },
            '& .MuiTableHead-root': {
              display: isMobile ? 'none !important' : 'table-header-group',
            },
            // On mobile, ensure the toolbar wrapper doesn't take up space
            ...(isMobile && {
              '& .MuiPaper-root': {
                border: 'none',
                boxShadow: 'none',
              },
            }),
          }}
        >
          <MaterialReactTable table={table} />
        </Box>
        
        {/* Mobile: Card View - Positioned below toolbar */}
        {isMobile && (
          <Box
            sx={{
              border: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`,
              borderRadius: '8px',
              backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
              overflow: 'hidden',
              marginTop: '8px', // Small gap after toolbar
            }}
          >
            {/* Cards */}
            {renderMobileCards()}
            
            {/* Mobile Pagination */}
            {renderMobilePagination()}
          </Box>
        )}
      </Box>
    </ThemeProvider>
  );
}

export default CustomMaterialTable;

