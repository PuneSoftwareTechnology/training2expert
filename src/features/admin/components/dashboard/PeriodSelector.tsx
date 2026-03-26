import { Building2, CalendarDays } from "lucide-react";
import type { DashboardPeriod } from "@/types/dashboard.types";
import type { Institute } from "@/types/common.types";

const PERIODS: { value: DashboardPeriod; label: string }[] = [
  { value: "month", label: "This Month" },
  { value: "quarter", label: "This Quarter" },
  { value: "year", label: "This Year" },
  { value: "all", label: "All Time" },
  { value: "custom", label: "Custom Range" },
];

const INSTITUTES: { value: Institute | "ALL"; label: string; activeColor: string }[] = [
  { value: "ALL", label: "All", activeColor: "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-200" },
  { value: "PST", label: "PST", activeColor: "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md shadow-blue-200" },
  { value: "TCH", label: "TCH", activeColor: "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-md shadow-orange-200" },
];

interface PeriodSelectorProps {
  period: DashboardPeriod;
  onPeriodChange: (period: DashboardPeriod) => void;
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  institute: Institute | "ALL";
  onInstituteChange: (institute: Institute | "ALL") => void;
}

export function PeriodSelector({
  period,
  onPeriodChange,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  institute,
  onInstituteChange,
}: PeriodSelectorProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Institute Filter */}
      <div className="flex items-center gap-1 rounded-xl border border-purple-200 bg-purple-50/60 p-1">
        <Building2 className="h-3.5 w-3.5 text-purple-400 ml-1" />
        {INSTITUTES.map((i) => (
          <button
            key={i.value}
            onClick={() => onInstituteChange(i.value)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              institute === i.value
                ? i.activeColor
                : "text-purple-600/70 hover:text-purple-700 hover:bg-purple-100/60"
            }`}
          >
            {i.label}
          </button>
        ))}
      </div>

      {/* Period Filter */}
      <div className="flex items-center gap-1 rounded-xl border border-indigo-200 bg-indigo-50/60 p-1">
        <CalendarDays className="h-3.5 w-3.5 text-indigo-400 ml-1" />
        {PERIODS.map((p) => (
          <button
            key={p.value}
            onClick={() => onPeriodChange(p.value)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              period === p.value
                ? "bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md shadow-indigo-200"
                : "text-indigo-600/70 hover:text-indigo-700 hover:bg-indigo-100/60"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {period === "custom" && (
        <div className="flex items-center gap-2 rounded-xl border border-sky-200 bg-sky-50/60 px-3 py-1.5">
          <input
            type="date"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
            className="rounded-md border border-sky-200 bg-white px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-sky-300"
          />
          <span className="text-xs font-medium text-sky-600">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
            className="rounded-md border border-sky-200 bg-white px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-sky-300"
          />
        </div>
      )}
    </div>
  );
}
