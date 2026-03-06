import { forwardRef } from "react";
import { INSTITUTE_CONFIG } from "@/constants/institute";
import {
  numberToWords,
  generateReceiptNumber,
  formatReceiptDate,
} from "@/utils/format";
import type { Institute } from "@/types/common.types";

export interface ReceiptData {
  enrollmentId: string;
  studentName: string;
  courseName: string;
  institute: Institute;
  totalFee: number;
  amountReceived: number;
  pendingAmount: number;
  installmentDate?: string;
  paymentMode?: string;
}

const PaymentReceipt = forwardRef<HTMLDivElement, { data: ReceiptData }>(
  ({ data }, ref) => {
    const config = INSTITUTE_CONFIG[data.institute];
    const receiptNo = generateReceiptNumber(
      data.enrollmentId,
      data.installmentDate
    );
    const receiptDate = formatReceiptDate(data.installmentDate);
    const amountInWords = numberToWords(data.amountReceived);

    return (
      <div
        ref={ref}
        style={{
          width: "210mm",
          minHeight: "297mm",
          padding: "20mm",
          fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
          fontSize: "14px",
          color: "#222",
          background: "#fff",
          boxSizing: "border-box",
        }}
      >
        {/* Outer Border */}
        <div
          style={{
            border: "2px solid #333",
            padding: "0",
          }}
        >
          {/* Header Section */}
          <div
            style={{
              padding: "20px 30px",
              display: "flex",
              alignItems: "center",
              gap: "20px",
            }}
          >
            <img
              src={config.logo}
              alt={config.name}
              style={{
                width: "80px",
                height: "80px",
                objectFit: "contain",
              }}
            />
            <div>
              <h1
                style={{
                  margin: 0,
                  fontSize: "22px",
                  fontWeight: 700,
                  color: config.headerColor,
                }}
              >
                {config.name}
              </h1>
              {config.address && (
                <p
                  style={{
                    margin: "4px 0 0",
                    fontSize: "13px",
                    color: "#444",
                  }}
                >
                  {config.address}
                </p>
              )}
            </div>
          </div>

          {/* Payment Receipt Title */}
          <div
            style={{
              textAlign: "center",
              padding: "10px 0 16px",
            }}
          >
            <h2
              style={{
                margin: 0,
                fontSize: "20px",
                fontWeight: 700,
                color: "#d35400",
              }}
            >
              Payment Receipt
            </h2>
          </div>

          {/* Separator */}
          <hr
            style={{
              margin: "0 20px",
              border: "none",
              borderTop: "1.5px solid #333",
            }}
          />

          {/* Receipt Info */}
          <div style={{ padding: "16px 30px" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <tbody>
                <tr>
                  <td style={{ padding: "6px 0", fontWeight: 600, width: "140px" }}>
                    Receipt No
                  </td>
                  <td style={{ padding: "6px 0" }}>{receiptNo}</td>
                  <td
                    style={{
                      padding: "6px 0",
                      textAlign: "right",
                      fontWeight: 600,
                    }}
                  >
                    Date&nbsp;&nbsp;{receiptDate}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: "6px 0", fontWeight: 600 }}>
                    Student Name
                  </td>
                  <td style={{ padding: "6px 0" }} colSpan={2}>
                    {data.studentName}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: "6px 0", fontWeight: 600 }}>
                    Course Name
                  </td>
                  <td style={{ padding: "6px 0" }} colSpan={2}>
                    {data.courseName}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Separator */}
          <hr
            style={{
              margin: "0 20px",
              border: "none",
              borderTop: "1.5px solid #333",
            }}
          />

          {/* Fee Details */}
          <div style={{ padding: "16px 30px" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <tbody>
                <tr>
                  <td style={{ padding: "10px 0", fontWeight: 600 }}>
                    Training Fees
                  </td>
                  <td
                    style={{
                      padding: "10px 0",
                      textAlign: "right",
                      fontWeight: 600,
                    }}
                  >
                    Rs.{data.totalFee.toLocaleString("en-IN")}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: "10px 0", fontWeight: 600 }}>
                    Amount Received
                  </td>
                  <td
                    style={{
                      padding: "10px 0",
                      textAlign: "right",
                      fontWeight: 600,
                      color: "#27ae60",
                    }}
                  >
                    Rs.{data.amountReceived.toLocaleString("en-IN")}
                  </td>
                </tr>
                <tr>
                  <td
                    style={{
                      padding: "14px 0 10px",
                      fontWeight: 700,
                      fontSize: "15px",
                    }}
                  >
                    Total Amount Due
                  </td>
                  <td
                    style={{
                      padding: "14px 0 10px",
                      textAlign: "right",
                      fontWeight: 700,
                      fontSize: "15px",
                      color: data.pendingAmount > 0 ? "#c0392b" : "#27ae60",
                    }}
                  >
                    Rs.{data.pendingAmount.toLocaleString("en-IN")}
                  </td>
                </tr>
                <tr>
                  <td
                    colSpan={2}
                    style={{
                      padding: "10px 0",
                      fontWeight: 600,
                    }}
                  >
                    Amount received in word&nbsp;&nbsp;&nbsp;&nbsp;
                    <span style={{ fontWeight: 400 }}>{amountInWords}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Separator */}
          <hr
            style={{
              margin: "0 20px",
              border: "none",
              borderTop: "1px solid #999",
            }}
          />

          {/* Mode of Payment & Signature */}
          <div style={{ padding: "16px 30px 24px" }}>
            <p style={{ margin: "0 0 30px", fontWeight: 600 }}>
              Mode of Payment: Cash / UPI / Cheque / Bank Transfer Transaction
            </p>

            <div style={{ textAlign: "right", marginTop: "20px" }}>
              <p style={{ margin: "0 0 4px", fontWeight: 600 }}>Received By</p>
              <p style={{ margin: 0, fontSize: "13px", color: "#555" }}>
                {config.authorizedBy}
              </p>
            </div>
          </div>

          {/* Terms and Conditions */}
          <div
            style={{
              borderTop: "2px solid #333",
              padding: "16px 30px",
              background: "#fafafa",
            }}
          >
            <h3
              style={{
                margin: "0 0 8px",
                fontSize: "14px",
                fontWeight: 700,
                textDecoration: "underline",
              }}
            >
              Terms and Conditions
            </h3>
            <ol
              style={{
                margin: 0,
                paddingLeft: "16px",
                fontSize: "12px",
                lineHeight: "1.7",
                color: "#444",
              }}
            >
              <li>Fees once paid are non-refundable under any circumstances.</li>
              <li>
                Fees once paid are non-transferable to any other student or
                course.
              </li>
              <li>
                Course change is subject to institute approval and availability.
              </li>
              <li>
                The institute reserves the right to change batch timings or
                faculty if required.
              </li>
              <li>
                The institute reserves the right to change batch timings or
                faculty if required.
              </li>
            </ol>
          </div>
        </div>
      </div>
    );
  }
);

PaymentReceipt.displayName = "PaymentReceipt";

export default PaymentReceipt;
