import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
} from "recharts";
import { PALETTE } from "@/constants/chart-colors";

interface DistributionPieChartProps {
  data: { name: string; value: number }[];
  colors?: string[];
  height?: number;
}

export function DistributionPieChart({
  data,
  colors,
  height = 260,
}: DistributionPieChartProps) {
  if (!data.length || data.every((d) => d.value === 0)) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No data available.
      </p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={50}
          outerRadius={85}
          paddingAngle={3}
          dataKey="value"
          nameKey="name"
          label={({ name, percent }) =>
            `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
          }
          labelLine={false}
          style={{ fontSize: "11px" }}
        >
          {data.map((_, i) => (
            <Cell
              key={i}
              fill={colors?.[i] ?? PALETTE[i % PALETTE.length]}
            />
          ))}
        </Pie>
        <Tooltip
          formatter={(value) => Number(value).toLocaleString("en-IN")}
          contentStyle={{
            borderRadius: "8px",
            border: "1px solid hsl(var(--border))",
            background: "hsl(var(--card))",
            fontSize: "12px",
          }}
        />
        <Legend
          wrapperStyle={{ fontSize: "12px" }}
          iconType="circle"
          iconSize={8}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
