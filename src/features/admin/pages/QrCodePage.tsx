import { useQuery } from '@tanstack/react-query';
import { QrCode } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CardSkeleton } from '@/components/loaders/CardSkeleton';
import { QueryError } from '@/components/errors/QueryError';
import { PageTransition } from '@/components/animations/PageTransition';
import { adminService } from '@/services/admin.service';

export default function QrCodePage() {
  const { data: qrCode, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['admin', 'qr-code'],
    queryFn: adminService.getActiveQrCode,
  });

  if (isLoading) return <CardSkeleton />;

  if (isError) {
    return <QueryError error={error} onRetry={refetch} />;
  }

  return (
    <PageTransition>
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Active QR Code</h2>

        {qrCode ? (
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle className="text-lg">{qrCode.bankName}</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <img
                src={qrCode.imageUrl}
                alt="Payment QR Code"
                className="h-72 w-72 rounded-lg border object-contain p-2"
              />
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
              <QrCode className="h-10 w-10 text-muted-foreground" />
              <p className="text-muted-foreground">No active QR code</p>
            </CardContent>
          </Card>
        )}
      </div>
    </PageTransition>
  );
}
