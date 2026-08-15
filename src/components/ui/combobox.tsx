import * as React from "react";
import { CheckIcon, ChevronDownIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover";

interface ComboboxProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  loading?: boolean;
  placeholder?: string;
  /** Shown when the master list is empty — typing a value is still allowed. */
  emptyMessage?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
}

/**
 * Free-text input with a suggestion list: staff can pick one of the known
 * options or type a value that is not on the list yet (e.g. a course we do not
 * offer yet but a lead asked for). Whatever is typed is kept as-is.
 */
export function Combobox({
  value,
  onChange,
  options,
  loading = false,
  placeholder,
  emptyMessage = "No options yet — type to add one",
  disabled = false,
  className,
  id,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  // Null while not typing, so opening with the chevron lists every option
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
    (option: string) => {
      onChange(option);
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
      // Only steal Enter when a suggestion is highlighted, so typing a new
      // value and hitting Enter still submits the surrounding form.
      if (open && highlight >= 0 && highlight < filtered.length) {
        e.preventDefault();
        select(filtered[highlight]);
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
            placeholder={placeholder}
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
            aria-label="Show options"
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
        {loading ? (
          <div className="px-2 py-1.5 text-sm text-muted-foreground">
            Loading...
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-2 py-1.5 text-sm text-muted-foreground">
            {options.length === 0 ? emptyMessage : "No match — press Enter to keep what you typed"}
          </div>
        ) : (
          filtered.map((option, i) => (
            <button
              key={option}
              type="button"
              className={cn(
                "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm outline-none",
                i === highlight ? "bg-accent text-accent-foreground" : "hover:bg-accent/50",
              )}
              onMouseEnter={() => setHighlight(i)}
              onClick={() => select(option)}
            >
              <CheckIcon
                className={cn("size-4 shrink-0", option === value ? "opacity-100" : "opacity-0")}
              />
              <span className="truncate">{option}</span>
            </button>
          ))
        )}
      </PopoverContent>
    </Popover>
  );
}
