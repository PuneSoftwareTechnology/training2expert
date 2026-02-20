import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Upload, QrCode, ToggleLeft, ToggleRight } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CardSkeleton } from '@/components/loaders/CardSkeleton';
import { PageTransition } from '@/components/animations/PageTransition';
import { adminService } from '@/services/admin.service';
import { getErrorMessage } from '@/services/api';

export default function QrManagementPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [bankName, setBankName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: qrCodes, isLoading } = useQuery({
    queryKey: ['admin', 'qr-codes'],
    queryFn: adminService.getAllQrCodes,
  });

  const uploadMutation = useMutation({
    mutationFn: () => {
      if (!selectedFile) throw new Error('No file selected');
      return adminService.uploadQrCode(selectedFile, bankName);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'qr-codes'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'qr-code'] });
      toast.success('QR code uploaded');
      setDialogOpen(false);
      setBankName('');
      setSelectedFile(null);
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const toggleMutation = useMutation({
    mutationFn: adminService.toggleQrCodeActive,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'qr-codes'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'qr-code'] });
      toast.success('QR code status updated');
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  if (isLoading) {
    return <div className="space-y-4"><CardSkeleton /><CardSkeleton /></div>;
  }

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">QR Code Management</h2>
          <Button onClick={() => setDialogOpen(true)}>
            <Upload className="mr-2 h-4 w-4" /> Upload QR
          </Button>
        </div>

        {!qrCodes || qrCodes.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
              <QrCode className="h-10 w-10 text-muted-foreground" />
              <p className="text-muted-foreground">No QR codes uploaded</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {qrCodes.map((qr) => (
              <Card key={qr.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{qr.bankName}</CardTitle>
                    <Badge variant={qr.isActive ? 'default' : 'secondary'}>
                      {qr.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <img
                    src={qr.imageUrl}
                    alt={qr.bankName}
                    className="mx-auto h-48 w-48 rounded-lg border object-contain p-2"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => toggleMutation.mutate(qr.id)}
                    disabled={toggleMutation.isPending}
                  >
                    {qr.isActive ? (
                      <><ToggleRight className="mr-1 h-4 w-4" /> Deactivate</>
                    ) : (
                      <><ToggleLeft className="mr-1 h-4 w-4" /> Set Active</>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Upload QR Code</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Bank Name *</Label>
                <Input value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="e.g., HDFC Bank" />
              </div>
              <div className="space-y-2">
                <Label>QR Image *</Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
                />
                <div
                  className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed p-6"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-6 w-6 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    {selectedFile ? selectedFile.name : 'Click to select image'}
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button
                  onClick={() => uploadMutation.mutate()}
                  disabled={!bankName || !selectedFile || uploadMutation.isPending}
                >
                  {uploadMutation.isPending ? 'Uploading...' : 'Upload'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </PageTransition>
  );
}
