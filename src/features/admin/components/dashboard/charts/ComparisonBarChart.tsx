import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";
import { PALETTE } from "@/constants/chart-colors";

interface ComparisonBarChartProps {
  data: { name: string; value: number }[];
  colors?: string[];
  height?: number;
  formatValue?: (v: number) => string;
}

export function ComparisonBarChart({
  data,
  colors,
  height = 260,
  formatValue,
}: ComparisonBarChartProps) {
  if (!data.length) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No data available.
      </p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 11 }}
          className="text-muted-foreground"
        />
        <YAxis
          tick={{ fontSize: 11 }}
          className="text-muted-foreground"
          tickFormatter={formatValue}
        />
        <Tooltip
          formatter={(value) => [
            formatValue ? formatValue(Number(value)) : Number(value).toLocaleString("en-IN"),
            "Value",
          ]}
          contentStyle={{
            borderRadius: "8px",
            border: "1px solid hsl(var(--border))",
            background: "hsl(var(--card))",
            fontSize: "12px",
          }}
        />
        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
          {data.map((_, i) => (
            <Cell
              key={i}
              fill={colors?.[i] ?? PALETTE[i % PALETTE.length]}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
