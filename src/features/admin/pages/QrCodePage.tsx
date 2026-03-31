import { useQuery } from '@tanstack/react-query';
import { QrCode, Copy, Check } from 'lucide-react';
import { useState } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CardSkeleton } from '@/components/loaders/CardSkeleton';
import { QueryError } from '@/components/errors/QueryError';
import { PageTransition } from '@/components/animations/PageTransition';
import { Button } from '@/components/ui/button';
import { adminService } from '@/services/admin.service';

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleCopy}>
      {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5 text-muted-foreground" />}
    </Button>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="font-medium">{value}</p>
      </div>
      <CopyButton value={value} />
    </div>
  );
}

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
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 p-2.5 shadow-md shadow-indigo-200/50">
            <QrCode className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Active QR Code</h2>
            <p className="text-sm text-muted-foreground">
              Current payment QR code details
            </p>
          </div>
        </div>

        {qrCode ? (
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle className="text-lg">
                {qrCode.bank_name}
                {qrCode.branch && (
                  <span className="ml-1 text-sm font-normal text-muted-foreground">
                    — {qrCode.branch}
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex justify-center">
                <img
                  src={qrCode.image_url}
                  alt="Payment QR Code"
                  className="h-72 w-72 rounded-lg border object-contain p-2"
                />
              </div>

              <div className="space-y-3 rounded-lg border p-4">
                {qrCode.upi_id && (
                  <DetailRow label="UPI ID" value={qrCode.upi_id} />
                )}
                {qrCode.account_number && (
                  <DetailRow label="Account Number" value={qrCode.account_number} />
                )}
                {qrCode.ifsc_code && (
                  <DetailRow label="IFSC Code" value={qrCode.ifsc_code} />
                )}
              </div>
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
