export const CHART_COLORS: Record<string, string> = {
  "SAP FICO": "#3b82f6",
  "SAP PP": "#f97316",
  "SAP MM": "#22c55e",
  "SAP SD": "#a855f7",
  DA: "#06b6d4",
  "Cyber Security": "#ef4444",
};

export const PALETTE = [
  "#3b82f6",
  "#f97316",
  "#22c55e",
  "#a855f7",
  "#06b6d4",
  "#ef4444",
  "#eab308",
  "#ec4899",
  "#14b8a6",
  "#6366f1",
] as const;

export const INSTITUTE_COLORS: Record<string, string> = {
  PST: "#3b82f6",
  TCH: "#a855f7",
};

export function getChartColor(name: string, index: number): string {
  return CHART_COLORS[name] ?? PALETTE[index % PALETTE.length];
}
