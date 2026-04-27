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
        {/* Student name — sits on the first underline */}
        <div
          style={{
            position: "absolute",
            top: "47.5%",
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

        {/* Course name — sits on the second underline */}
        <div
          style={{
            position: "absolute",
            top: "60%",
            left: "12%",
            right: "12%",
            textAlign: "center",
            fontSize: "26px",
            fontWeight: 700,
          }}
        >
          {data.courseName}
        </div>

        {/* Date — sits on the underline next to the "DATE" label */}
        <div
          style={{
            position: "absolute",
            bottom: "4%",
            left: "11.5%",
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
