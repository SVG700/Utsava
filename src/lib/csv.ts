/**
 * Safe CSV formatting and export utilities.
 * Quotes and doubles quotes on EVERY field, and prefixes ' to values starting with
 * = + - @ tab or CR to prevent spreadsheet formula injection.
 * Prepends a UTF-8 BOM for flawless Excel rendering.
 */

const FORMULA_PREFIXES = ['=', '+', '-', '@', '\t', '\r'];

/**
 * Formats a single value into a safe CSV cell.
 * Quotes and doubles quotes on EVERY field.
 * Prefixes ' to values starting with = + - @ tab or CR.
 */
export function csvCell(value: unknown): string {
  if (value === null || value === undefined) {
    return '""';
  }

  let str = String(value);

  // Check if string begins with dangerous formula characters
  if (str.length > 0 && FORMULA_PREFIXES.some((prefix) => str.startsWith(prefix))) {
    str = `'${str}`;
  }

  // Double all internal quotes and enclose entire cell in quotes
  const escaped = str.replace(/"/g, '""');
  return `"${escaped}"`;
}

/**
 * Builds a complete CSV file string with UTF-8 BOM prepended.
 */
export function buildCsvString(
  headers: string[],
  rows: (string | number | boolean | null | undefined)[][]
): string {
  const headerLine = headers.map(csvCell).join(',');
  const rowLines = rows.map((row) => row.map(csvCell).join(','));
  return `\uFEFF${[headerLine, ...rowLines].join('\r\n')}`;
}

/**
 * Triggers a browser download of CSV content and safely revokes the Object URL.
 */
export function downloadCsvFile(filename: string, csvContent: string): void {
  if (typeof window === 'undefined') return;

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 100);
}
