import { useState } from "react";
import { motion } from "framer-motion";
import {
  Wallet,
  QrCode,
  TrendingUp,
  AlertCircle,
  Copy,
  Check,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/utils/format";
import { PAYMENT_MODES } from "@/constants/courses";
import { SectionHeader, fadeUp } from "./shared";
import type { PaymentSummary } from "@/types/student.types";

/* ─── SVG Donut Chart ─── */
let donutIdCounter = 0;
function DonutChart({
  paid,
  total,
  size = 160,
}: {
  paid: number;
  total: number;
  size?: number;
}) {
  const [gradientId] = useState(() => `paid-gradient-${++donutIdCounter}`);
  const strokeWidth = Math.round(size * 0.14);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const paidPct = total > 0 ? paid / total : 0;
  const paidDash = circumference * paidPct;
  const pendingDash = circumference * (1 - paidPct);

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        {/* Pending arc (background) */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          className="text-red-200 dark:text-red-700/40"
        />
        {/* Paid arc */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${paidDash} ${pendingDash}`}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#14b8a6" />
          </linearGradient>
        </defs>
      </svg>
      {/* Center label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-extrabold text-emerald-600">
          {Math.round(paidPct * 100)}%
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-500">
          Paid
        </span>
      </div>
    </div>
  );
}

function CopyableDetail({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <p className="truncate text-sm font-semibold">{value}</p>
      </div>
      <button
        onClick={handleCopy}
        className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-900/30"
      >
        {copied ? (
          <Check className="h-3.5 w-3.5 text-emerald-500" />
        ) : (
          <Copy className="h-3.5 w-3.5" />
        )}
      </button>
    </div>
  );
}

interface PaymentSectionProps {
  paymentData: PaymentSummary | undefined;
}

export default function PaymentSection({ paymentData }: PaymentSectionProps) {
  const total = paymentData?.total_fee ?? 0;
  const paid = paymentData?.paid_amount ?? 0;
  const pending = paymentData?.pending_amount ?? 0;

  return (
    <section id="section-payment" className="scroll-mt-20">
      <div className="mb-4 h-px bg-gradient-to-r from-transparent via-emerald-300/50 to-transparent md:mb-8 dark:via-emerald-700/30" />
      <SectionHeader
        icon={Wallet}
        gradient="from-emerald-500 to-teal-600"
        title="Payment & Fees"
        subtitle="Fee summary & payment options"
      />

      {/* ─── Mobile: Donut + Stats ─── */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        custom={0}
        className="mb-6 md:hidden"
      >
        <Card className="overflow-hidden border border-emerald-100 bg-white shadow-lg shadow-emerald-500/5 dark:border-emerald-900/40 dark:bg-slate-900">
          <div className="h-1 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400" />
          <CardContent className="flex items-center gap-5 px-5 pt-6 pb-5">
            <DonutChart paid={paid} total={total} />
            <div className="flex-1 space-y-3">
              <div className="rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-800/50">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Total Fee
                </p>
                <p className="text-lg font-bold text-foreground">
                  {formatCurrency(total)}
                </p>
              </div>
              <div className="rounded-xl bg-emerald-50/80 px-3 py-2 dark:bg-emerald-950/20">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600">
                  Paid
                </p>
                <p className="text-lg font-bold text-emerald-600">
                  {formatCurrency(paid)}
                </p>
              </div>
              <div className="rounded-xl bg-rose-50/80 px-3 py-2 dark:bg-rose-950/20">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-rose-600">
                  Pending
                </p>
                <p className="text-lg font-bold text-rose-600">
                  {formatCurrency(pending)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* QR Code for mobile */}
        <Card className="mt-4 overflow-hidden border border-emerald-100 bg-white shadow-lg dark:border-emerald-900/40 dark:bg-slate-900">
          <div className="h-1 bg-gradient-to-r from-emerald-400 to-teal-400" />
          <CardContent className="flex flex-col items-center gap-4 pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/40 dark:to-teal-900/30">
                <QrCode className="h-5 w-5 text-emerald-600" />
              </div>
              <h3 className="text-xl font-semibold">Scan to Pay</h3>
            </div>
            {paymentData?.qr_code_url ? (
              <img
                src={paymentData.qr_code_url}
                alt="Payment QR Code"
                className="h-52 w-52 rounded-xl border-2 border-dashed border-emerald-200 object-contain p-3 dark:border-emerald-800"
              />
            ) : (
              <div className="flex h-40 w-40 items-center justify-center rounded-xl border-2 border-dashed border-muted-foreground/20 bg-muted/20">
                <p className="text-sm text-muted-foreground">No QR available</p>
              </div>
            )}
            <p className="text-center text-sm text-muted-foreground">
              Use any UPI app to scan and complete
              <br />
              your pending balance payment.
            </p>
            {(paymentData?.qr_upi_id || paymentData?.qr_account_number) && (
              <div className="w-full space-y-2 rounded-lg border border-emerald-100 bg-emerald-50/50 px-4 py-3 dark:border-emerald-900/30 dark:bg-emerald-950/20">
                {paymentData.qr_upi_id && (
                  <CopyableDetail
                    label="UPI ID"
                    value={paymentData.qr_upi_id}
                  />
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* ─── Desktop: Donut + Stats + QR ─── */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        custom={0}
        className="hidden gap-6 md:grid lg:grid-cols-[3fr_2fr]"
      >
        {/* Donut chart + Fee stats card */}
        <Card className="flex flex-col overflow-hidden border border-emerald-100 bg-white shadow-lg shadow-emerald-500/5 dark:border-emerald-900/40 dark:bg-slate-900">
          <div className="h-1 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400" />
          <CardContent className="flex flex-1 items-center gap-8 px-8 pt-8 pb-7">
            <DonutChart
              paid={paid}
              total={total}
              size={240}
            />
            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-4 rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-800/50">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600">
                  <Wallet className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Total Fees
                  </p>
                  <p className="text-xl font-bold">{formatCurrency(total)}</p>
                </div>
                <Badge variant="secondary" className="ml-auto text-[10px]">
                  Managed by Admin
                </Badge>
              </div>
              <div className="flex items-center gap-4 rounded-xl bg-emerald-50/80 px-4 py-3 dark:bg-emerald-950/20">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-100 to-green-200 dark:from-emerald-900/40 dark:to-green-900/30">
                  <TrendingUp className="h-4 w-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600">
                    Paid Amount
                  </p>
                  <p className="text-xl font-bold text-emerald-600">
                    {formatCurrency(paid)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 rounded-xl bg-rose-50/80 px-4 py-3 dark:bg-rose-950/20">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-rose-100 to-red-200 dark:from-rose-900/40 dark:to-red-900/30">
                  <AlertCircle className="h-4 w-4 text-rose-600" />
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-rose-600">
                    Pending Amount
                  </p>
                  <p className="text-xl font-bold text-rose-600">
                    {formatCurrency(pending)}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* QR Code */}
        <Card className="flex flex-col overflow-hidden border border-emerald-100 bg-white shadow-lg dark:border-emerald-900/40 dark:bg-slate-900">
          <div className="h-1 bg-gradient-to-r from-emerald-400 to-teal-400" />
          <CardContent className="flex flex-1 flex-col items-center justify-center gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/40 dark:to-teal-900/30">
                <QrCode className="h-5 w-5 text-emerald-600" />
              </div>
              <h3 className="text-xl font-semibold">Scan to Pay</h3>
            </div>
            {paymentData?.qr_code_url ? (
              <img
                src={paymentData.qr_code_url}
                alt="Payment QR Code"
                className="h-52 w-52 rounded-xl border-2 border-dashed border-emerald-200 object-contain p-3 dark:border-emerald-800"
              />
            ) : (
              <div className="flex h-40 w-40 items-center justify-center rounded-xl border-2 border-dashed border-muted-foreground/20 bg-muted/20">
                <p className="text-sm text-muted-foreground">No QR available</p>
              </div>
            )}
            <p className="text-center text-sm text-muted-foreground">
              Use any UPI app to scan and complete
              <br />
              your pending balance payment.
            </p>
            {(paymentData?.qr_upi_id || paymentData?.qr_account_number) && (
              <div className="w-full space-y-2 rounded-lg border border-emerald-100 bg-emerald-50/50 px-4 py-3 dark:border-emerald-900/30 dark:bg-emerald-950/20">
                {paymentData.qr_upi_id && (
                  <CopyableDetail
                    label="UPI ID"
                    value={paymentData.qr_upi_id}
                  />
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Installment Details Table */}
      {(paymentData?.installment1_amount ||
        paymentData?.installment2_amount ||
        paymentData?.installment3_amount) && (
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={1}
          className="mt-6"
        >
          <Card className="overflow-hidden border border-emerald-100 bg-white shadow-lg shadow-emerald-500/5 dark:border-emerald-900/40 dark:bg-slate-900">
            <CardHeader className="border-b border-emerald-100/50 bg-gradient-to-r from-emerald-50/80 to-teal-50/50 dark:border-emerald-900/30 dark:from-emerald-950/30 dark:to-teal-950/20">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                <Wallet className="h-4 w-4 text-emerald-600" />
                Payment Details
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-emerald-100 bg-emerald-50/30 dark:border-emerald-900/30 dark:bg-emerald-950/10">
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Installment
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Amount
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Date
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Mode
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {[
                      {
                        label: "1st Installment",
                        amount: paymentData.installment1_amount,
                        date: paymentData.installment1_date,
                        mode: paymentData.installment1_mode,
                      },
                      {
                        label: "2nd Installment",
                        amount: paymentData.installment2_amount,
                        date: paymentData.installment2_date,
                        mode: paymentData.installment2_mode,
                      },
                      {
                        label: "3rd Installment",
                        amount: paymentData.installment3_amount,
                        date: paymentData.installment3_date,
                        mode: paymentData.installment3_mode,
                      },
                    ]
                      .filter((row) => row.amount)
                      .map((row) => (
                        <tr
                          key={row.label}
                          className="transition-colors hover:bg-emerald-50/30 dark:hover:bg-emerald-950/10"
                        >
                          <td className="px-4 py-3 font-medium">{row.label}</td>
                          <td className="px-4 py-3 font-semibold text-emerald-600">
                            {formatCurrency(row.amount!)}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {row.date ? formatDate(row.date) : "—"}
                          </td>
                          <td className="px-4 py-3">
                            {row.mode ? (
                              <Badge variant="outline" className="text-[10px]">
                                {PAYMENT_MODES.find((m) => m.value === row.mode)
                                  ?.label ?? row.mode}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </section>
  );
}
