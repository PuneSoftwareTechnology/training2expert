import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

interface TrendLineChartProps {
  data: { label: string; value: number }[];
  color?: string;
  height?: number;
  formatValue?: (v: number) => string;
}

export function TrendLineChart({
  data,
  color = "#3b82f6",
  height = 260,
  formatValue,
}: TrendLineChartProps) {
  if (!data.length) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No trend data available.
      </p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis
          dataKey="label"
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
        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          dot={{ r: 3, fill: color }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
