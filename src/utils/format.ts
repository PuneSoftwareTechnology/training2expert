export function normalizeEmail(value: unknown): string {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateString: string | number | null | undefined): string {
  if (dateString === null || dateString === undefined || dateString === '') return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return String(dateString);
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function formatPhone(phone: string): string {
  if (phone.length === 10) {
    return `${phone.slice(0, 5)}-${phone.slice(5)}`;
  }
  return phone;
}

export function daysBetween(dateA: string, dateB: string): number {
  const a = new Date(dateA).getTime();
  const b = new Date(dateB).getTime();
  return Math.floor(Math.abs(b - a) / (1000 * 60 * 60 * 24));
}

export function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

export function formatExperience(years: number, months: number): string {
  const parts: string[] = [];
  if (years > 0) parts.push(`${years} yr${years > 1 ? 's' : ''}`);
  if (months > 0) parts.push(`${months} mo${months > 1 ? 's' : ''}`);
  return parts.length > 0 ? parts.join(' ') : 'No experience';
}

const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function twoDigitWords(n: number): string {
  if (n < 20) return ones[n];
  return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
}

export function numberToWords(num: number): string {
  if (num === 0) return 'Zero Rupees only';
  let words = '';
  if (num >= 10000000) {
    words += twoDigitWords(Math.floor(num / 10000000)) + ' Crore ';
    num %= 10000000;
  }
  if (num >= 100000) {
    words += twoDigitWords(Math.floor(num / 100000)) + ' Lakh ';
    num %= 100000;
  }
  if (num >= 1000) {
    words += twoDigitWords(Math.floor(num / 1000)) + ' Thousand ';
    num %= 1000;
  }
  if (num >= 100) {
    words += ones[Math.floor(num / 100)] + ' Hundred ';
    num %= 100;
  }
  if (num > 0) {
    words += twoDigitWords(num) + ' ';
  }
  return words.trim() + ' Rupees only';
}

export function generateReceiptNumber(enrollmentId: string, installmentDate?: string): string {
  const date = installmentDate ? new Date(installmentDate) : new Date();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  const fyStart = month >= 4 ? year : year - 1;
  const fyEnd = (fyStart + 1) % 100;
  const idPart = enrollmentId.slice(0, 8).toUpperCase();
  return `FY${fyStart}-${fyEnd.toString().padStart(2, '0')}-${idPart}`;
}

export function formatReceiptDate(dateString?: string): string {
  const date = dateString ? new Date(dateString) : new Date();
  if (isNaN(date.getTime())) return '';
  const dd = date.getDate().toString().padStart(2, '0');
  const mm = (date.getMonth() + 1).toString().padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${dd}.${mm}.${yyyy}`;
}

// HDFC and ICICI are bank accounts the institute receives transfers into;
// the student-facing receipt shows them as "ONLINE" while the raw value is
// retained in DB/SMS records for internal reconciliation.
export function formatPaymentMode(mode?: string): string {
  if (!mode) return 'Cash / UPI / Cheque / Bank Transfer Transaction';
  if (mode === 'CASH') return 'Cash';
  if (mode === 'HDFC' || mode === 'ICICI') return 'ONLINE';
  return mode;
}
