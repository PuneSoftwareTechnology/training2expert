import { useQuery } from '@tanstack/react-query';
import { DollarSign, CheckCircle2, Clock } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CardSkeleton } from '@/components/loaders/CardSkeleton';
import { QueryError } from '@/components/errors/QueryError';
import { PageTransition } from '@/components/animations/PageTransition';
import { studentService } from '@/services/student.service';
import { formatCurrency } from '@/utils/format';

export default function PaymentsPage() {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['student', 'payments'],
    queryFn: studentService.getPaymentSummary,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
        <CardSkeleton />
      </div>
    );
  }

  if (isError) {
    return <QueryError error={error} onRetry={refetch} />;
  }

  return (
    <PageTransition>
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Payment Summary</h2>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="rounded-lg bg-primary/10 p-3">
                <DollarSign className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Fee</p>
                <p className="text-2xl font-bold">{formatCurrency(data?.total_fee ?? 0)}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="rounded-lg bg-green-100 p-3">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Paid Amount</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(data?.paid_amount ?? 0)}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="rounded-lg bg-orange-100 p-3">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending Amount</p>
                <p className="text-2xl font-bold text-orange-600">
                  {formatCurrency(data?.pending_amount ?? 0)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {data?.qr_code_url && (
          <Card>
            <CardHeader>
              <CardTitle>Payment QR Code</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-3">
              <img
                src={data.qr_code_url}
                alt="Payment QR Code"
                className="h-64 w-64 rounded-lg border object-contain p-2"
              />
              {data.qr_bank_name && (
                <p className="text-sm font-medium text-muted-foreground">
                  {data.qr_bank_name}
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </PageTransition>
  );
}
