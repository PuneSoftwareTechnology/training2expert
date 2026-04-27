import { useRef, useCallback, useState } from "react";
import html2pdf from "html2pdf.js";
import { Download, Loader2, Mail } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { adminService } from "@/services/admin.service";
import { getErrorMessage } from "@/services/api";
import Certificate, { type CertificateData } from "./Certificate";
import certificateBg from "@/assets/certificate/Certificate background.png";

// Pre-warm the browser cache so html2canvas's internal image fetch is a cache
// hit. Without this, the capture can race the bg image load and produce a
// blank/failed canvas.
function preloadImage(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}

const PDF_OPTIONS = {
  margin: 0,
  image: { type: "jpeg", quality: 0.98 },
  html2canvas: {
    scale: 2,
    useCORS: true,
    backgroundColor: "#f3f7ee",
    // Tailwind v4 emits oklch() in CSS vars, which html2canvas's color
    // parser rejects. Certificate.tsx uses inline hex colors only, so
    // we can safely drop all stylesheets from the cloned doc.
    onclone: (clonedDoc: Document) => {
      clonedDoc
        .querySelectorAll('link[rel="stylesheet"], style')
        .forEach((el) => el.remove());
    },
  },
  jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
} as const;

interface CertificateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: CertificateData;
  enrollmentId: string;
  studentEmail: string;
}

export default function CertificateDialog({
  open,
  onOpenChange,
  data,
  enrollmentId,
  studentEmail,
}: CertificateDialogProps) {
  const certRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [sending, setSending] = useState(false);

  const handleDownload = useCallback(async () => {
    if (!certRef.current) {
      toast.error("Certificate not ready yet, please try again");
      return;
    }
    setDownloading(true);
    try {
      await preloadImage(certificateBg);
      const filename = `Certificate_${data.studentName.replace(/\s+/g, "_")}_${data.courseName.replace(/\s+/g, "_")}.pdf`;
      await html2pdf()
        .set({ ...PDF_OPTIONS, filename })
        .from(certRef.current)
        .save();
      toast.success("Certificate downloaded successfully");
    } catch (err) {
      console.error("[CertificateDialog] download failed:", err);
      toast.error(getErrorMessage(err));
    } finally {
      setDownloading(false);
    }
  }, [data.studentName, data.courseName]);

  const handleSendEmail = useCallback(async () => {
    if (!certRef.current) {
      toast.error("Certificate not ready yet, please try again");
      return;
    }
    setSending(true);
    try {
      await preloadImage(certificateBg);
      // Same html2pdf flow as download — outputting a Blob instead of saving
      // so the email attachment matches the downloadable PDF byte-for-byte.
      const blob: Blob = await html2pdf()
        .set(PDF_OPTIONS)
        .from(certRef.current)
        .outputPdf("blob");
      await adminService.sendCertificate(enrollmentId, blob);
      toast.success(`Certificate sent to ${studentEmail}`);
      onOpenChange(false);
    } catch (err) {
      console.error("[CertificateDialog] send failed:", err);
      toast.error(getErrorMessage(err));
    } finally {
      setSending(false);
    }
  }, [enrollmentId, studentEmail, onOpenChange]);

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

        {/* Off-screen full-size copy — captured by html2pdf for download.
            Don't use opacity:0 here — html2canvas walks the cloned tree and
            inherited 0-opacity can produce a blank PDF. Just position it
            far off-screen instead. */}
        <div
          style={{
            position: "fixed",
            top: 0,
            left: "-10000px",
            pointerEvents: "none",
          }}
          aria-hidden
        >
          <Certificate ref={certRef} data={data} />
        </div>

        <DialogFooter className="px-6 pb-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button
            onClick={handleDownload}
            disabled={downloading || sending}
            variant="outline"
          >
            <Download className="h-4 w-4 mr-2" />
            {downloading ? "Downloading..." : "Download PDF"}
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button disabled={downloading || sending}>
                <Mail className="h-4 w-4 mr-2" />
                {sending ? "Sending..." : "Send Email"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Send Certificate</AlertDialogTitle>
                <AlertDialogDescription>
                  You are about to email this certificate to{" "}
                  <span className="font-semibold text-foreground">
                    {data.studentName}
                  </span>{" "}
                  at{" "}
                  <span className="font-semibold text-foreground">
                    {studentEmail}
                  </span>
                  . The attachment will match exactly what you see above.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleSendEmail} disabled={sending}>
                  {sending && <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />}
                  Yes, Send
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
