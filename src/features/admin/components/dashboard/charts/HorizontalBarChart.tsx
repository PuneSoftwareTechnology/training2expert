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

interface HorizontalBarChartProps {
  data: { name: string; value: number }[];
  colors?: string[];
  height?: number;
  formatValue?: (v: number) => string;
}

export function HorizontalBarChart({
  data,
  colors,
  height = 260,
  formatValue,
}: HorizontalBarChartProps) {
  if (!data.length) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No data available.
      </p>
    );
  }

  const chartHeight = Math.max(height, data.length * 40);

  return (
    <ResponsiveContainer width="100%" height={chartHeight}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 5, right: 20, left: 80, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis
          type="number"
          tick={{ fontSize: 11 }}
          className="text-muted-foreground"
          tickFormatter={formatValue}
        />
        <YAxis
          type="category"
          dataKey="name"
          tick={{ fontSize: 11 }}
          className="text-muted-foreground"
          width={75}
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
        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
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
