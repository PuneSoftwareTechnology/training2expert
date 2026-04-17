import { useRef, useCallback, useState } from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { adminService } from "@/services/admin.service";
import { getErrorMessage } from "@/services/api";
import PaymentReceipt, { type ReceiptData } from "./PaymentReceipt";

interface ReceiptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: ReceiptData;
  installmentNumber: string;
}

export default function ReceiptDialog({
  open,
  onOpenChange,
  data,
  installmentNumber,
}: ReceiptDialogProps) {
  const receiptRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  const handleDownload = useCallback(async () => {
    setDownloading(true);
    try {
      const blob = await adminService.downloadReceipt(
        data.enrollmentId,
        installmentNumber,
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Receipt_${data.studentName.replace(/\s+/g, "_")}_${data.courseName.replace(/\s+/g, "_")}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Receipt downloaded successfully");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDownloading(false);
    }
  }, [data.enrollmentId, data.studentName, data.courseName, installmentNumber]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[95vh] overflow-y-auto p-0">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle>Payment Receipt</DialogTitle>
        </DialogHeader>

        {/* Receipt preview - scrollable */}
        <div className="overflow-hidden max-h-[72vh] px-4">
          <div className="origin-top-left scale-[0.48] sm:scale-[0.55] md:scale-[0.65] lg:scale-[0.75]" style={{ width: "210mm", transformOrigin: "top left" }}>
            <PaymentReceipt ref={receiptRef} data={data} />
          </div>
        </div>

        <DialogFooter className="px-6 pb-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={handleDownload} disabled={downloading}>
            <Download className="h-4 w-4 mr-2" />
            {downloading ? "Downloading..." : "Download PDF"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
