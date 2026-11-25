import { useEffect, useMemo, useState } from "react";

export const DEFAULT_PAGE_SIZE = 50;

/** A fixed number of rows per page, or "all" to show every row on one page. */
export type PageSizeChoice = number | "all";

export const PAGE_SIZE_OPTIONS = [25, 50, 100] as const;

/** Turn a choice into an actual row count ("all" = every row, min 1). */
export function resolvePageSize(choice: PageSizeChoice, total: number) {
  return choice === "all" ? Math.max(total, 1) : choice;
}

/**
 * Client-side pagination for hand-built tables, so only one page of rows is
 * mounted at a time (big lists make every re-render — e.g. opening a dialog —
 * slow otherwise). The user can still pick "All" to see everything at once.
 *
 * - `resetKey`: pass something derived from the page's filters/search; the
 *   page jumps back to 1 when it changes. Data refreshes keep the current page.
 * - If rows disappear (e.g. a delete) and the current page no longer exists,
 *   it clamps to the last page.
 *
 * Use `pageItems` for rendering and `pageStart + index` for serial numbers.
 * Keep using the full list for totals, "select all" and CSV export.
 */
export function usePagination<T>(
  items: T[],
  resetKey?: unknown,
  initialPageSize: PageSizeChoice = DEFAULT_PAGE_SIZE,
) {
  const [page, setPage] = useState(0);
  const [pageSizeChoice, setPageSizeChoice] =
    useState<PageSizeChoice>(initialPageSize);
  const pageSize = resolvePageSize(pageSizeChoice, items.length);
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));

  useEffect(() => {
    setPage(0);
  }, [resetKey]);

  useEffect(() => {
    if (page > pageCount - 1) setPage(pageCount - 1);
  }, [page, pageCount]);

  const pageStart = page * pageSize;
  const pageItems = useMemo(
    () => items.slice(pageStart, pageStart + pageSize),
    [items, pageStart, pageSize],
  );

  return {
    page,
    pageCount,
    pageStart,
    pageItems,
    total: items.length,
    canPrev: page > 0,
    canNext: page < pageCount - 1,
    prev: () => setPage((p) => Math.max(0, p - 1)),
    next: () => setPage((p) => Math.min(pageCount - 1, p + 1)),
    pageSize: pageSizeChoice,
    setPageSize: (choice: PageSizeChoice) => {
      setPageSizeChoice(choice);
      setPage(0);
    },
  };
}
