/**
 * Format a number as Vietnamese dong with dot thousands separators.
 * Examples:
 *   formatVNDNumber(10000)    -> "10.000"
 *   formatVNDNumber(1234567)  -> "1.234.567"
 *   formatVNDNumber(-5000)    -> "-5.000"
 *
 * Uses a manual implementation rather than `Intl.NumberFormat` /
 * `toLocaleString('vi-VN')` because Hermes on Android often ships without
 * full ICU data, in which case those APIs silently fall back to no
 * separators.
 */
export const formatVNDNumber = (value: number | string): string => {
  const n = typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(n)) return "0";
  const sign = n < 0 ? "-" : "";
  const intPart = Math.round(Math.abs(n)).toString();
  return sign + intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

/** "10.000 ₫" */
export const formatVND = (value: number | string): string =>
  `${formatVNDNumber(value)} ₫`;

/** "10.000 đ" — used in places that prefer the lowercase abbreviation. */
export const formatVNDLower = (value: number | string): string =>
  `${formatVNDNumber(value)} đ`;
