import * as React from "react";
import { CheckIcon, ChevronDownIcon } from "lucide-react";

import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover";
import { useBatchOptions } from "@/hooks/useBatchOptions";
import { cn } from "@/lib/utils";

interface BatchInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
  id?: string;
}

/**
 * Batch field: type a new batch name, or pick an existing one. Matching
 * batches are listed as you type. Batches have no master list, so the
 * suggestions only keep spellings consistent — whatever is typed is kept.
 */
export function BatchInput({
  value,
  onChange,
  disabled = false,
  className,
  id,
}: BatchInputProps) {
  const { options, isLoading } = useBatchOptions();
  const [open, setOpen] = React.useState(false);
  // Null while not typing, so opening with the chevron lists every batch
  // instead of only the ones matching the current value.
  const [query, setQuery] = React.useState<string | null>(null);
  const [highlight, setHighlight] = React.useState(-1);
  const anchorRef = React.useRef<HTMLDivElement>(null);

  const filtered = React.useMemo(() => {
    const q = query?.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.toLowerCase().includes(q));
  }, [options, query]);

  const close = React.useCallback(() => {
    setOpen(false);
    setQuery(null);
    setHighlight(-1);
  }, []);

  const select = React.useCallback(
    (batch: string) => {
      onChange(batch);
      close();
    },
    [onChange, close],
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) {
        setOpen(true);
        setHighlight(0);
        return;
      }
      setHighlight((h) => (filtered.length ? (h + 1) % filtered.length : -1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) =>
        filtered.length ? (h <= 0 ? filtered.length - 1 : h - 1) : -1,
      );
    } else if (e.key === "Enter") {
      if (!open) return;
      // Enter commits, it never submits the dialog from here: a highlighted
      // suggestion if there is one, otherwise the free text as typed.
      e.preventDefault();
      if (highlight >= 0 && highlight < filtered.length) {
        select(filtered[highlight]);
      } else {
        select(query ?? value);
      }
    } else if (e.key === "Escape") {
      close();
    }
  };

  return (
    <Popover open={open} onOpenChange={(o) => (o ? setOpen(true) : close())}>
      <PopoverAnchor asChild>
        <div ref={anchorRef} className={cn("relative", className)}>
          <Input
            id={id}
            value={query ?? value}
            disabled={disabled}
            placeholder="Type or select a batch"
            autoComplete="off"
            className="pr-9"
            onChange={(e) => {
              const next = e.target.value;
              setQuery(next);
              onChange(next);
              setOpen(true);
              setHighlight(-1);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={handleKeyDown}
          />
          <button
            type="button"
            tabIndex={-1}
            disabled={disabled}
            aria-label="Show existing batches"
            className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground disabled:opacity-50"
            onClick={() => (open ? close() : setOpen(true))}
          >
            <ChevronDownIcon className="size-4" />
          </button>
        </div>
      </PopoverAnchor>
      <PopoverContent
        align="start"
        className="w-(--radix-popover-trigger-width) max-h-60 overflow-y-auto p-1"
        onOpenAutoFocus={(e) => e.preventDefault()}
        onInteractOutside={(e) => {
          // Clicking the input itself counts as "outside" the content.
          if (anchorRef.current?.contains(e.target as Node)) e.preventDefault();
        }}
      >
        {isLoading ? (
          <div className="px-2 py-1.5 text-sm text-muted-foreground">
            Loading...
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-2 py-1.5 text-sm text-muted-foreground">
            {options.length === 0
              ? "No batches yet — type to add one"
              : "No match — keep typing to add a new batch"}
          </div>
        ) : (
          filtered.map((batch, i) => (
            <button
              key={batch}
              type="button"
              className={cn(
                "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm outline-none",
                i === highlight
                  ? "bg-accent text-accent-foreground"
                  : "hover:bg-accent/50",
              )}
              onMouseEnter={() => setHighlight(i)}
              onClick={() => select(batch)}
            >
              <CheckIcon
                className={cn(
                  "size-4 shrink-0",
                  batch === value ? "opacity-100" : "opacity-0",
                )}
              />
              <span className="truncate">{batch}</span>
            </button>
          ))
        )}
      </PopoverContent>
    </Popover>
  );
}
