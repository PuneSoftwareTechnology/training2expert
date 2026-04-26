import { useRef, useCallback, useState } from "react";
import html2pdf from "html2pdf.js";
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
import { getErrorMessage } from "@/services/api";
import Certificate, { type CertificateData } from "./Certificate";

interface CertificateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: CertificateData;
}

export default function CertificateDialog({
  open,
  onOpenChange,
  data,
}: CertificateDialogProps) {
  const certRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  const handleDownload = useCallback(async () => {
    if (!certRef.current) return;
    setDownloading(true);
    try {
      const filename = `Certificate_${data.studentName.replace(/\s+/g, "_")}_${data.courseName.replace(/\s+/g, "_")}.pdf`;
      await html2pdf()
        .set({
          margin: 0,
          filename,
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, backgroundColor: "#f3f7ee" },
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        })
        .from(certRef.current)
        .save();
      toast.success("Certificate downloaded successfully");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDownloading(false);
    }
  }, [data.studentName, data.courseName]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[95vh] overflow-y-auto p-0">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle>Training Completion Certificate</DialogTitle>
        </DialogHeader>

        {/* Visible scaled preview — does NOT carry the ref (transformed
            ancestors break html2canvas capture). */}
        <div className="px-4 flex justify-center">
          <div
            style={{
              position: "relative",
              width: "calc(210mm * 0.48)",
              height: "calc(297mm * 0.48)",
              overflow: "hidden",
              flexShrink: 0,
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "210mm",
                height: "297mm",
                transform: "scale(0.42)",
                transformOrigin: "top left",
              }}
            >
              <Certificate data={data} />
            </div>
          </div>
        </div>

        {/* Off-screen full-size copy — captured by html2pdf for download. */}
        <div
          style={{
            position: "fixed",
            top: 0,
            left: "-10000px",
            pointerEvents: "none",
            opacity: 0,
          }}
          aria-hidden
        >
          <Certificate ref={certRef} data={data} />
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
