import { Link } from "react-router-dom";
import { Wallet, IndianRupee, AlertCircle, Users } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ComparisonBarChart } from "../charts/ComparisonBarChart";
import { getChartColor } from "@/constants/chart-colors";
import { formatCurrency } from "@/utils/format";
import { ROUTES } from "@/constants/routes";
import type { DashboardData } from "@/types/dashboard.types";

interface TrainerPayoutSectionProps {
  data: NonNullable<DashboardData["trainerPayout"]>;
}

/**
 * What we owe trainers, paired the same way as the revenue section: money that
 * actually moved is scoped to the selected period, while what is still owed is a
 * point-in-time total. Super admins only — the backend omits the data for
 * everyone else, so this section never renders for them.
 */
export function TrainerPayoutSection({ data }: TrainerPayoutSectionProps) {
  const byTrainer = data.byTrainer.map((r, i) => ({
    name: r.trainer,
    value: r.balance,
    color: getChartColor(r.trainer, i),
  }));

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex w-fit items-center gap-2 rounded-lg bg-violet-50 px-3 py-1.5 text-sm font-semibold text-violet-700">
          <Wallet className="h-4 w-4" />
          Trainer Payments
        </h2>
        <Link
          to={ROUTES.ADMIN_TRAINER_PAYMENTS}
          className="text-xs font-medium text-violet-700 hover:underline"
        >
          Open tracker →
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Payable"
          value={formatCurrency(data.totalPayable)}
          icon={<IndianRupee className="h-4 w-4 text-amber-600" />}
          iconBg="bg-amber-100"
          hint={`${data.trackedStudents} students · ${data.trainerCount} trainers`}
        />
        <StatCard
          title="Paid to Trainers"
          value={formatCurrency(data.totalPaid)}
          icon={<IndianRupee className="h-4 w-4 text-green-600" />}
          iconBg="bg-green-100"
          hint={`+ ${formatCurrency(data.totalTds)} TDS deducted`}
        />
        <StatCard
          title="Balance to Pay"
          value={formatCurrency(data.totalBalance)}
          icon={<AlertCircle className="h-4 w-4 text-red-600" />}
          iconBg="bg-red-100"
          badge={
            data.totalBalance > 0
              ? { label: "Outstanding", variant: "destructive" as const }
              : undefined
          }
          hint="Across all periods"
        />
        <StatCard
          title="Fee Not Set"
          value={data.feeNotSet}
          icon={<Users className="h-4 w-4 text-blue-600" />}
          iconBg="bg-blue-100"
          badge={
            data.feeNotSet > 0
              ? { label: "Needs entry", variant: "warning" as const }
              : undefined
          }
          hint="Rows with no training fee yet"
        />
      </div>

      <Card>
        <CardHeader className="pb-1">
          <CardTitle className="text-sm">
            Outstanding Balance by Trainer
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ComparisonBarChart
            data={byTrainer}
            colors={byTrainer.map((d) => d.color)}
            formatValue={(v) => `₹${(v / 1000).toFixed(0)}k`}
          />
        </CardContent>
      </Card>
    </section>
  );
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  iconBg: string;
  badge?: { label: string; variant: "success" | "destructive" | "warning" };
  hint?: string;
}

function StatCard({ title, value, icon, iconBg, badge, hint }: StatCardProps) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between pt-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className={`rounded-lg p-1.5 ${iconBg}`}>{icon}</div>
            {badge && (
              <Badge variant={badge.variant} className="text-[10px]">
                {badge.label}
              </Badge>
            )}
          </div>
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            {title}
          </p>
          <p className="text-xl font-bold">{value}</p>
          {hint && (
            <p className="text-[10px] text-muted-foreground">{hint}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
