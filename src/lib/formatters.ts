export const EM_DASH = "—";

function isNil(value: unknown): boolean {
  return (
    value === null ||
    value === undefined ||
    value === "" ||
    (typeof value === "number" && Number.isNaN(value))
  );
}

export function text(value: unknown): string {
  if (isNil(value)) return EM_DASH;
  return String(value);
}

const indianNumber = new Intl.NumberFormat("en-IN", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const indianInteger = new Intl.NumberFormat("en-IN");

/** Formats an amount already expressed in Rs. lakh, e.g. ₹12.50 lakh */
export function formatLakh(value: number | null | undefined): string {
  if (isNil(value)) return EM_DASH;
  return `₹${indianNumber.format(Number(value))} lakh`;
}

export function formatNumber(value: number | null | undefined): string {
  if (isNil(value)) return EM_DASH;
  return indianInteger.format(Number(value));
}

export function formatPercent(value: number | null | undefined, digits = 0): string {
  if (isNil(value)) return EM_DASH;
  return `${Number(value).toFixed(digits)}%`;
}

/** DD-MM-YYYY */
export function formatDate(value: string | null | undefined): string {
  if (isNil(value)) return EM_DASH;
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return EM_DASH;
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  return `${dd}-${mm}-${date.getFullYear()}`;
}

export function formatDateTime(value: string | null | undefined): string {
  if (isNil(value)) return EM_DASH;
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return EM_DASH;
  const hh = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  return `${formatDate(value)} ${hh}:${min}`;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function truncate(value: string | null | undefined, max = 48): string {
  if (isNil(value)) return EM_DASH;
  const str = String(value);
  return str.length > max ? `${str.slice(0, max - 1)}…` : str;
}
