import { forwardRef } from "react";
import { formatReceiptDate } from "@/utils/format";
import type { Institute } from "@/types/common.types";
import certificateBg from "@/assets/certificate/Certificate background.png";

export interface CertificateData {
  studentName: string;
  courseName: string;
  institute: Institute;
  completionDate?: string;
}

const Certificate = forwardRef<HTMLDivElement, { data: CertificateData }>(
  ({ data }, ref) => {
    const issuedOn = formatReceiptDate(data.completionDate);

    return (
      <div
        ref={ref}
        style={{
          width: "210mm",
          height: "297mm",
          position: "relative",
          fontFamily: "'Times New Roman', Times, serif",
          color: "#222",
          backgroundImage: `url(${certificateBg})`,
          backgroundSize: "100% 100%",
          backgroundRepeat: "no-repeat",
          boxSizing: "border-box",
        }}
      >
        {/* Student name — overlays the first blank line */}
        <div
          style={{
            position: "absolute",
            top: "44.5%",
            left: "12%",
            right: "12%",
            textAlign: "center",
            fontSize: "30px",
            fontStyle: "italic",
            fontWeight: 700,
          }}
        >
          {data.studentName}
        </div>

        {/* Course name — overlays the second blank line */}
        <div
          style={{
            position: "absolute",
            top: "60.5%",
            left: "12%",
            right: "12%",
            textAlign: "center",
            fontSize: "26px",
            fontWeight: 700,
          }}
        >
          {data.courseName}
        </div>

        {/* Date — next to the "DATE" label at the bottom */}
        <div
          style={{
            position: "absolute",
            bottom: "3.6%",
            left: "13.5%",
            fontSize: "14px",
            fontWeight: 600,
            letterSpacing: "1px",
          }}
        >
          {issuedOn}
        </div>
      </div>
    );
  },
);

Certificate.displayName = "Certificate";

export default Certificate;
