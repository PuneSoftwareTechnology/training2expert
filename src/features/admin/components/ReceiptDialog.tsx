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
import PaymentReceipt, { type ReceiptData } from "./PaymentReceipt";

interface ReceiptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: ReceiptData;
}

export default function ReceiptDialog({
  open,
  onOpenChange,
  data,
}: ReceiptDialogProps) {
  const receiptRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  const handleDownload = useCallback(async () => {
    const element = receiptRef.current;
    if (!element) return;

    setDownloading(true);
    try {
      const html2pdf = (await import("html2pdf.js")).default;

      const opt = {
        margin: 0,
        filename: `Receipt_${data.studentName.replace(/\s+/g, "_")}_${data.courseName.replace(/\s+/g, "_")}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" as const },
      };

      await html2pdf().set(opt).from(element).save();
      toast.success("Receipt downloaded successfully");
    } catch {
      toast.error("Failed to download receipt");
    } finally {
      setDownloading(false);
    }
  }, [data.studentName, data.courseName]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[95vh] overflow-y-auto p-0">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle>Payment Receipt</DialogTitle>
        </DialogHeader>

        {/* Receipt preview - scrollable */}
        <div className="overflow-auto max-h-[72vh] px-4">
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
