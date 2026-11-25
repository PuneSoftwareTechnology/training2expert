import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PAGE_SIZE_OPTIONS, type PageSizeChoice } from "@/hooks/usePagination";

interface TablePaginationProps {
  page: number;
  pageCount: number;
  total: number;
  canPrev: boolean;
  canNext: boolean;
  prev: () => void;
  next: () => void;
  pageSize: PageSizeChoice;
  setPageSize: (choice: PageSizeChoice) => void;
  className?: string;
}

/**
 * "Page X of Y" + rows-per-page selector (25 / 50 / 100 / All) + prev/next.
 * Shared by DataTable and the hand-built tables that use usePagination.
 */
export function TablePagination({
  page,
  pageCount,
  total,
  canPrev,
  canNext,
  prev,
  next,
  pageSize,
  setPageSize,
  className = "px-2",
}: TablePaginationProps) {
  // Include a caller's non-standard default (e.g. 10) so the select can show it
  const sizes = [
    ...new Set<number>([
      ...PAGE_SIZE_OPTIONS,
      ...(typeof pageSize === "number" ? [pageSize] : []),
    ]),
  ].sort((a, b) => a - b);

  // Nothing to choose between: every size already shows all rows
  if (total <= sizes[0]) return null;

  const showingAll = pageSize === "all";

  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-2 ${className}`}
    >
      <p className="text-sm text-muted-foreground">
        {showingAll
          ? `Showing all ${total}`
          : `Page ${page + 1} of ${pageCount} (${total} total)`}
      </p>
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Rows</span>
        <Select
          value={String(pageSize)}
          onValueChange={(v) => setPageSize(v === "all" ? "all" : Number(v))}
        >
          <SelectTrigger className="h-8 w-[84px]" aria-label="Rows per page">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {sizes.map((n) => (
              <SelectItem key={n} value={String(n)}>
                {n}
              </SelectItem>
            ))}
            <SelectItem value="all">All</SelectItem>
          </SelectContent>
        </Select>
        {!showingAll && (
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={prev}
              disabled={!canPrev}
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={next}
              disabled={!canNext}
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
