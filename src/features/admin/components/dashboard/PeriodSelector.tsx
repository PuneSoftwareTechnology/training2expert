import type { DashboardPeriod } from "@/types/dashboard.types";

const PERIODS: { value: DashboardPeriod; label: string }[] = [
  { value: "month", label: "This Month" },
  { value: "quarter", label: "This Quarter" },
  { value: "year", label: "This Year" },
  { value: "all", label: "All Time" },
  { value: "custom", label: "Custom Range" },
];

interface PeriodSelectorProps {
  period: DashboardPeriod;
  onPeriodChange: (period: DashboardPeriod) => void;
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
}

export function PeriodSelector({
  period,
  onPeriodChange,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
}: PeriodSelectorProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex rounded-lg border bg-muted/50 p-0.5">
        {PERIODS.map((p) => (
          <button
            key={p.value}
            onClick={() => onPeriodChange(p.value)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              period === p.value
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {period === "custom" && (
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
            className="rounded-md border bg-background px-2 py-1.5 text-xs"
          />
          <span className="text-xs text-muted-foreground">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
            className="rounded-md border bg-background px-2 py-1.5 text-xs"
          />
        </div>
      )}
    </div>
  );
}
