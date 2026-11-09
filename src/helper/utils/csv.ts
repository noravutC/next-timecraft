// Cells a spreadsheet would run as a formula are prefixed with a quote,
// so an exported title like "=HYPERLINK(...)" stays text when opened.
const FORMULA_START = /^[=+\-@\t\r]/;

const cell = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  let text = String(value);
  if (FORMULA_START.test(text)) text = `'${text}`;
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

/** RFC 4180 CSV, CRLF line ends, header row first. */
export const toCsv = (header: string[], rows: unknown[][]): string =>
  [header, ...rows].map((row) => row.map(cell).join(',')).join('\r\n') + '\r\n';
