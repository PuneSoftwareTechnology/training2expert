import { motion } from 'framer-motion';
import { Wallet, QrCode, TrendingUp, AlertCircle, FileDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate } from '@/utils/format';
import { PAYMENT_MODES } from '@/constants/courses';
import { SectionHeader, fadeUp } from './shared';
import type { PaymentSummary } from '@/types/student.types';

interface PaymentSectionProps {
  paymentData: PaymentSummary | undefined;
}

export default function PaymentSection({ paymentData }: PaymentSectionProps) {
  return (
    <section id="section-payment" className="scroll-mt-20">
      <div className="mb-8 h-px bg-gradient-to-r from-transparent via-emerald-300/50 to-transparent dark:via-emerald-700/30" />
      <SectionHeader icon={Wallet} gradient="from-emerald-500 to-teal-600" title="Payment & Fees" subtitle="Fee summary & payment options" />

      <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0} className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Fee cards */}
        <div className="space-y-4">
          {/* Total */}
          <Card className="overflow-hidden border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700">
                <Wallet className="h-5 w-5 text-slate-600 dark:text-slate-300" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Fees</p>
                <p className="text-2xl font-bold">{formatCurrency(paymentData?.total_fee ?? 0)}</p>
                <Badge variant="secondary" className="mt-1 text-[10px]">Managed by Admin</Badge>
              </div>
            </CardContent>
          </Card>
          {/* Paid */}
          <Card className="overflow-hidden border border-emerald-100 border-l-4 border-l-emerald-500 bg-white shadow-lg shadow-emerald-500/5 dark:border-emerald-900/40 dark:bg-slate-900 dark:border-l-emerald-500">
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-100 to-green-200 dark:from-emerald-900/40 dark:to-green-900/30">
                <TrendingUp className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">Paid Amount</p>
                <p className="text-2xl font-bold text-emerald-600">{formatCurrency(paymentData?.paid_amount ?? 0)}</p>
              </div>
            </CardContent>
          </Card>
          {/* Pending */}
          <Card className="overflow-hidden border border-rose-100 border-l-4 border-l-rose-500 bg-white shadow-lg shadow-rose-500/5 dark:border-rose-900/40 dark:bg-slate-900 dark:border-l-rose-500">
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-rose-100 to-red-200 dark:from-rose-900/40 dark:to-red-900/30">
                <AlertCircle className="h-5 w-5 text-rose-600" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-rose-600">Pending Amount</p>
                <p className="text-2xl font-bold text-rose-600">{formatCurrency(paymentData?.pending_amount ?? 0)}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* QR Code */}
        <Card className="border border-emerald-100 bg-white shadow-lg dark:border-emerald-900/40 dark:bg-slate-900">
          <CardContent className="flex flex-col items-center justify-center gap-4 pt-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/40 dark:to-teal-900/30">
              <QrCode className="h-5 w-5 text-emerald-600" />
            </div>
            <h3 className="text-lg font-semibold">Scan to Pay</h3>
            {paymentData?.qr_code_url ? (
              <img src={paymentData.qr_code_url} alt="Payment QR Code" className="h-48 w-48 rounded-xl border-2 border-dashed border-emerald-200 object-contain p-3 dark:border-emerald-800" />
            ) : (
              <div className="flex h-48 w-48 items-center justify-center rounded-xl border-2 border-dashed border-muted-foreground/20 bg-muted/20">
                <p className="text-sm text-muted-foreground">No QR available</p>
              </div>
            )}
            <p className="text-center text-sm text-muted-foreground">
              Use any UPI app to scan and complete<br />your pending balance payment.
            </p>
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="flex items-center gap-2 rounded-lg bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 transition-colors hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50">
              <FileDown className="h-4 w-4" />
              Download Invoice PDF
            </motion.button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Installment Details Table */}
      {(paymentData?.installment1_amount || paymentData?.installment2_amount || paymentData?.installment3_amount) && (
        <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={1} className="mt-6">
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
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Installment</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Amount</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Mode</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {[
                      { label: '1st Installment', amount: paymentData.installment1_amount, date: paymentData.installment1_date, mode: paymentData.installment1_mode },
                      { label: '2nd Installment', amount: paymentData.installment2_amount, date: paymentData.installment2_date, mode: paymentData.installment2_mode },
                      { label: '3rd Installment', amount: paymentData.installment3_amount, date: paymentData.installment3_date, mode: paymentData.installment3_mode },
                    ]
                      .filter((row) => row.amount)
                      .map((row) => (
                        <tr key={row.label} className="transition-colors hover:bg-emerald-50/30 dark:hover:bg-emerald-950/10">
                          <td className="px-4 py-3 font-medium">{row.label}</td>
                          <td className="px-4 py-3 font-semibold text-emerald-600">{formatCurrency(row.amount!)}</td>
                          <td className="px-4 py-3 text-muted-foreground">{row.date ? formatDate(row.date) : '—'}</td>
                          <td className="px-4 py-3">
                            {row.mode ? (
                              <Badge variant="outline" className="text-[10px]">
                                {PAYMENT_MODES.find((m) => m.value === row.mode)?.label ?? row.mode}
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
