# CustomMaterialTable Component

A reusable Material React Table wrapper with built-in dark mode support and consistent styling across the application.

## Features

- ✅ Automatic dark mode detection and switching
- ✅ Consistent theme colors (green accent: `#16a34a`)
- ✅ Pre-configured styling for headers, cells, pagination
- ✅ Row selection, sorting, filtering, pagination
- ✅ Customizable search placeholder
- ✅ Click handlers for rows
- ✅ Custom toolbar actions
- ✅ Fully typed with TypeScript

## Basic Usage

```tsx
import CustomMaterialTable from '@/components/ui/table/CustomMaterialTable';
import { type MRT_ColumnDef } from 'material-react-table';

interface Farm {
  id: string;
  name: string;
  location: string;
}

const MyComponent = () => {
  const [data, setData] = useState<Farm[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const columns = useMemo<MRT_ColumnDef<Farm>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Farm Name',
        size: 200,
      },
      {
        accessorKey: 'location',
        header: 'Location',
        size: 250,
      },
    ],
    []
  );

  return (
    <CustomMaterialTable
      columns={columns}
      data={data}
      isLoading={isLoading}
      onRowClick={(row) => console.log('Clicked:', row)}
    />
  );
};
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `columns` | `MRT_ColumnDef<TData>[]` | **Required** | Column definitions |
| `data` | `TData[]` | **Required** | Array of data objects |
| `isLoading` | `boolean` | `false` | Show loading state |
| `enableRowSelection` | `boolean` | `true` | Enable checkbox selection |
| `enableColumnFilters` | `boolean` | `true` | Enable column filtering |
| `enableGlobalFilter` | `boolean` | `true` | Enable global search |
| `enableSorting` | `boolean` | `true` | Enable column sorting |
| `enablePagination` | `boolean` | `true` | Enable pagination |
| `onRowClick` | `(row: TData) => void` | `undefined` | Row click handler |
| `renderTopToolbarCustomActions` | `() => ReactNode` | `undefined` | Custom toolbar actions |
| `getRowId` | `(row: TData) => string` | `undefined` | Custom row ID function |
| `initialPageSize` | `number` | `10` | Initial page size |
| `additionalTableOptions` | `Partial<MRT_TableOptions<TData>>` | `{}` | Additional MRT options |

## Advanced Usage

### With Custom Toolbar Actions

```tsx
<CustomMaterialTable
  columns={columns}
  data={data}
  renderTopToolbarCustomActions={() => (
    <div className="flex gap-2">
      <select onChange={(e) => setFilter(e.target.value)}>
        <option value="all">All Types</option>
        <option value="crop">Crop</option>
        <option value="livestock">Livestock</option>
      </select>
      <Button onClick={exportData}>Export</Button>
    </div>
  )}
/>
```

### With Row Click Handler

```tsx
const router = useRouter();

<CustomMaterialTable
  columns={columns}
  data={farms}
  onRowClick={(farm) => router.push(`/farms/${farm.id}`)}
  getRowId={(row) => row.id}
/>
```

### With Custom Cell Rendering

```tsx
const columns = useMemo<MRT_ColumnDef<Farm>[]>(
  () => [
    {
      accessorKey: 'status',
      header: 'Status',
      Cell: ({ cell }) => (
        <span className={`px-2 py-1 rounded-full text-xs ${
          cell.getValue<boolean>() 
            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
            : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
        }`}>
          {cell.getValue<boolean>() ? 'Active' : 'Inactive'}
        </span>
      ),
    },
  ],
  []
);
```

### With Additional Options

```tsx
<CustomMaterialTable
  columns={columns}
  data={data}
  initialPageSize={25}
  additionalTableOptions={{
    enableColumnPinning: true,
    enableRowVirtualization: true,
    positionActionsColumn: 'last',
  }}
/>
```

## Styling

The component uses:
- Tailwind colors for consistency
- `#16a34a` (green-600) for primary/accent color
- `#1f2937` (gray-800) for dark mode backgrounds
- `#ffffff` for light mode backgrounds
- Automatic dark mode switching via `MutationObserver`

## Custom CSS

Additional styles are loaded from `/styles/material-table-custom.css` which includes:
- Icon color inheritance
- Sort icon active states
- Checkbox styling
- Popover/dropdown styling

## Example: Complete Farm List Implementation

See `/components/farms/FarmList.tsx` for a full implementation example with:
- Type filtering
- Row navigation
- Loading states
- Empty states
- Error handling

