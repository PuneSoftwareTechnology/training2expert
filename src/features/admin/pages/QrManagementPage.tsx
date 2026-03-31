import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, RefreshCw, Trash2, QrCode, Info } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TableSkeleton } from "@/components/loaders/TableSkeleton";
import { QueryError } from "@/components/errors/QueryError";
import { PageTransition } from "@/components/animations/PageTransition";
import { AddQrDialog } from "../components/AddQrDialog";
import { superAdminService } from "@/services/super-admin.service";
import { getErrorMessage } from "@/services/api";

const QR_QUERY_KEY = ["super-admin", "qr"];

export default function QrManagementPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const {
    data: qrCodes,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: QR_QUERY_KEY,
    queryFn: superAdminService.getAllQrCodes,
  });

  const deleteMutation = useMutation({
    mutationFn: superAdminService.deleteQrCode,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QR_QUERY_KEY });
      toast.success("QR code deleted");
      setDeleteId(null);
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const activateMutation = useMutation({
    mutationFn: superAdminService.activateQrCode,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QR_QUERY_KEY });
      toast.success("QR code activated");
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  if (isError) return <QueryError error={error} onRetry={refetch} />;

  return (
    <PageTransition>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 p-2.5 shadow-md shadow-indigo-200/50">
              <QrCode className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">QR & Bank Management</h2>
              <p className="text-sm text-muted-foreground">
                Manage payment QR codes and bank details
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              <RefreshCw
                className={`mr-2 ${isFetching ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
            <Button
              onClick={() => setDialogOpen(true)}
              className="bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-200/50 hover:from-indigo-600 hover:to-violet-700"
            >
              <Plus className="mr-2" /> Add New QR
            </Button>
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <TableSkeleton rows={3} columns={5} />
        ) : (
          <Card className="border-indigo-200/60 overflow-hidden">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-indigo-500 to-violet-600 border-0 hover:bg-transparent">
                    <TableHead className="w-[100px] text-white font-semibold text-xs uppercase tracking-wider">QR PREVIEW</TableHead>
                    <TableHead className="text-white font-semibold text-xs uppercase tracking-wider">BANK DETAILS</TableHead>
                    <TableHead className="text-white font-semibold text-xs uppercase tracking-wider">UPI & ACCOUNT</TableHead>
                    <TableHead className="w-[100px] text-white font-semibold text-xs uppercase tracking-wider">STATUS</TableHead>
                    <TableHead className="w-[100px] text-white font-semibold text-xs uppercase tracking-wider">ACTIONS</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!qrCodes?.length ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="py-12 text-center text-muted-foreground"
                      >
                        <div className="flex flex-col items-center gap-2">
                          <QrCode className="h-10 w-10" />
                          <p>No QR codes found</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    qrCodes.map((qr) => (
                      <TableRow key={qr.id}>
                        <TableCell>
                          <div className="flex h-14 w-14 items-center justify-center rounded-lg border bg-muted/50">
                            {qr.image_url ? (
                              <img
                                src={qr.image_url}
                                alt={qr.bank_name}
                                className="h-12 w-12 rounded object-contain"
                              />
                            ) : (
                              <QrCode className="h-8 w-8 text-muted-foreground" />
                            )}
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="space-y-1">
                            <p className="font-semibold">{qr.bank_name}</p>
                            {qr.branch && (
                              <p className="text-sm text-muted-foreground">
                                {qr.branch}
                              </p>
                            )}
                            {qr.is_active && (
                              <Badge variant="success" className="text-xs">
                                ACTIVE
                              </Badge>
                            )}
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="space-y-0.5 text-sm">
                            <p>
                              <span className="text-muted-foreground">
                                UPI:{" "}
                              </span>
                              {qr.upi_id || "-"}
                            </p>
                            <p>
                              <span className="text-muted-foreground">
                                A/C:{" "}
                              </span>
                              {qr.account_number || "-"}
                            </p>
                            <p>
                              <span className="text-muted-foreground">
                                IFSC:{" "}
                              </span>
                              {qr.ifsc_code || "-"}
                            </p>
                          </div>
                        </TableCell>

                        <TableCell>
                          <Switch
                            checked={qr.is_active}
                            onCheckedChange={() =>
                              activateMutation.mutate(qr.id)
                            }
                            disabled={qr.is_active || activateMutation.isPending}
                          />
                        </TableCell>

                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:bg-red-50 hover:text-red-600"
                            onClick={() => setDeleteId(qr.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* System Note */}
        <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950/30">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" />
          <div>
            <p className="font-medium text-blue-900 dark:text-blue-300">
              System Note
            </p>
            <p className="text-sm text-blue-700 dark:text-blue-400">
              Only one QR can be active at any given time. Enabling a new QR code
              will automatically deactivate the currently active one to prevent
              payment confusion.
            </p>
          </div>
        </div>

        {/* Add QR Dialog */}
        <AddQrDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          queryKey={QR_QUERY_KEY}
        />

        {/* Delete Confirmation */}
        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete QR Code?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the QR
                code and associated bank details.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => deleteId && deleteMutation.mutate(deleteId)}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </PageTransition>
  );
}
