import { describe, it, expect } from 'vitest';
import { csvCell, buildCsvString } from '@/lib/csv';

describe('csvCell', () => {
  it('quotes standard strings and doubles internal quotes', () => {
    expect(csvCell('Hello World')).toBe('"Hello World"');
    expect(csvCell('He said "Yes"')).toBe('"He said ""Yes"""');
    expect(csvCell('Line1\nLine2')).toBe('"Line1\nLine2"');
  });

  it('handles numbers, booleans, null and undefined', () => {
    expect(csvCell(15000)).toBe('"15000"');
    expect(csvCell(true)).toBe('"true"');
    expect(csvCell(false)).toBe('"false"');
    expect(csvCell(null)).toBe('""');
    expect(csvCell(undefined)).toBe('""');
  });

  it('neutralises formula injection by prefixing with a single quote', () => {
    // Dangerous formula prefixes: = + - @ tab \r
    expect(csvCell('=SUM(A1:A10)')).toBe("\"'=SUM(A1:A10)\"");
    expect(csvCell('+cmd|')).toBe("\"'+cmd|\"");
    expect(csvCell('-20% cut')).toBe("\"'-20% cut\"");
    expect(csvCell('@import')).toBe("\"'@import\"");
    expect(csvCell('\tTAB_VALUE')).toBe("\"'\tTAB_VALUE\"");
    expect(csvCell('\rCR_VALUE')).toBe("\"'\rCR_VALUE\"");
  });

  it('properly quotes cells with commas', () => {
    expect(csvCell('Bengaluru, Karnataka')).toBe('"Bengaluru, Karnataka"');
  });
});

describe('buildCsvString', () => {
  it('prepends UTF-8 BOM and formats rows with CRLF', () => {
    const headers = ['Category', 'Amount'];
    const rows = [
      ['Venue', 50000],
      ['Catering', 60000],
    ];

    const result = buildCsvString(headers, rows);

    // Starts with UTF-8 BOM
    expect(result.startsWith('\uFEFF')).toBe(true);

    // Contains quoted header and rows
    expect(result).toContain('"Category","Amount"');
    expect(result).toContain('"Venue","50000"');
    expect(result).toContain('"Catering","60000"');
  });
});
