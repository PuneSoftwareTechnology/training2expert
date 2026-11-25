import {
  type ColumnDef,
  type PaginationState,
  type SortingState,
  type ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { memo, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { TablePagination } from "@/components/ui/table-pagination";
import { resolvePageSize, type PageSizeChoice } from "@/hooks/usePagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchKey?: string;
  searchValue?: string;
  /** Initial rows per page; the user can change it (incl. "All") from the footer */
  pageSize?: PageSizeChoice;
  emptyMessage?: string;
  headerClassName?: string;
  /**
   * Jump back to the first page whenever this value changes. Pass something
   * derived from the page's filters/search so a new filter never lands the
   * user on an empty page. Data refreshes (star, edit) keep the current page.
   */
  resetPageKey?: unknown;
}

function DataTableInner<TData, TValue>({
  columns,
  data,
  searchKey,
  searchValue,
  pageSize = 10,
  emptyMessage = "No results found",
  headerClassName,
  resetPageKey,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSizeChoice, setPageSizeChoice] = useState<PageSizeChoice>(pageSize);
  // "All" = one page holding every row (sized to the full data set)
  const effectivePageSize = resolvePageSize(pageSizeChoice, data.length);
  const pagination: PaginationState = { pageIndex, pageSize: effectivePageSize };

  const table = useReactTable({
    data,
    columns,
    state: { sorting, columnFilters, pagination },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: (updater) => {
      const next = typeof updater === "function" ? updater(pagination) : updater;
      setPageIndex(next.pageIndex);
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    // Don't jump to page 1 every time the data array changes (e.g. after
    // starring or editing a row); filters reset the page via resetPageKey.
    autoResetPageIndex: false,
  });

  // Reset to the first page when the caller's filters change
  useEffect(() => {
    setPageIndex(0);
  }, [resetPageKey]);

  // If rows were removed and the current page no longer exists, clamp to the last page
  const pageCount = Math.max(1, table.getPageCount());
  useEffect(() => {
    if (pageIndex > pageCount - 1) setPageIndex(pageCount - 1);
  }, [pageIndex, pageCount]);

  // Apply external search filter
  useEffect(() => {
    if (searchKey && searchValue !== undefined) {
      table.getColumn(searchKey)?.setFilterValue(searchValue || undefined);
    }
  }, [searchKey, searchValue, table]);

  return (
    <div className="space-y-2">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow
              key={headerGroup.id}
              className={headerClassName ? `${headerClassName} border-0 hover:bg-transparent` : ""}
            >
              {headerGroup.headers.map((header) => (
                <TableHead
                  key={header.id}
                  className={[
                    headerClassName
                      ? "text-white font-semibold text-xs uppercase tracking-wider"
                      : "",
                    (header.column.columnDef.meta as { className?: string })
                      ?.className ?? "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length ? (
            table.getRowModel().rows.map((row, idx) => (
              <TableRow key={row.id} className={idx % 2 === 1 ? "bg-muted/40" : ""}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    className={
                      (cell.column.columnDef.meta as { className?: string })
                        ?.className ?? ""
                    }
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="py-8 text-center text-muted-foreground"
              >
                {emptyMessage}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <TablePagination
        page={pageIndex}
        pageCount={pageCount}
        total={table.getFilteredRowModel().rows.length}
        canPrev={table.getCanPreviousPage()}
        canNext={table.getCanNextPage()}
        prev={() => table.previousPage()}
        next={() => table.nextPage()}
        pageSize={pageSizeChoice}
        setPageSize={(choice) => {
          setPageSizeChoice(choice);
          setPageIndex(0);
        }}
      />
    </div>
  );
}

/**
 * Memoized: when the parent re-renders for unrelated reasons (opening a
 * dialog, typing in a form) and `columns`/`data` are referentially stable,
 * the whole table is skipped. Callers should memoize `columns`.
 */
export const DataTable = memo(DataTableInner) as typeof DataTableInner;

// Helper to create a sortable header
export function SortableHeader({
  column,
  title,
}: {
  column: { toggleSorting: (desc?: boolean) => void; getIsSorted: () => false | "asc" | "desc" };
  title: string;
}) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className="-ml-3 h-8 hover:bg-white/20 hover:text-inherit"
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
    >
      {title}
      <ArrowUpDown className="ml-1 h-3.5 w-3.5" />
    </Button>
  );
}
