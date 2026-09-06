/**
 * Pilot bulk-source parser: Washington State Dept. of Agriculture's public
 * "Wholesale Licensed Nursery Dealers" PDF.
 *
 * This does NOT touch the database. It downloads and parses the PDF, then
 * writes a CSV matching the /admin/import template (see
 * src/lib/csv-import.ts) to disk — you review/fix it if needed, then
 * upload it yourself through /admin/import. Keeping this as a separate
 * "produce a CSV" step (rather than importing directly) means every bulk
 * source funnels through the same reviewed path, and you get a chance to
 * sanity-check the output before anything lands in the database.
 *
 * Not run automatically, for two reasons: this sandboxed dev environment
 * can't reach agr.wa.gov, and — more importantly — nobody has actually
 * seen this specific PDF's real column layout yet. Run it with:
 *
 *   npm run parse:wa-pdf
 *
 * On the first run, read the console output carefully. It prints the
 * detected header row and a few sample rows before writing anything, so
 * you can confirm the column mapping guessed below is actually right. If
 * it's off (a state government PDF export can format its table in all
 * kinds of surprising ways), send me that printed output and we'll fix
 * the mapping in a follow-up pass — exactly like we iterated on
 * import-osm.ts against its first real run.
 */
import { writeFile } from "node:fs/promises";
import { PDFParse } from "pdf-parse";
import { TEMPLATE_COLUMNS } from "../src/lib/csv-import";

const PDF_URL =
  process.env.WA_PDF_URL ??
  "https://agr.wa.gov/content/nightly/nursery/wholesalelicensednurserydealers.pdf";
const OUTPUT_PATH = process.env.WA_OUTPUT_PATH ?? "wa-nursery-import.csv";

// Maps our CSV template columns to likely header text in the source PDF.
// Matched case-insensitively, first match wins. Adjust these once you've
// seen the real header row printed below.
const HEADER_ALIASES: Record<string, string[]> = {
  name: ["business name", "company name", "dealer name", "name"],
  address_line1: ["address", "street address", "mailing address"],
  city: ["city"],
  state: ["state", "st"],
  postal_code: ["zip", "zip code", "postal code"],
  license_number: ["license number", "license #", "license no", "cert number"],
  license_status: ["status", "license status"],
};

export function csvEscape(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function findColumnIndex(headerRow: string[], aliases: string[]): number {
  const normalized = headerRow.map((h) => h.trim().toLowerCase());
  for (const alias of aliases) {
    const idx = normalized.indexOf(alias);
    if (idx !== -1) return idx;
  }
  return -1;
}

export interface BuildCsvResult {
  csv: string | null;
  rowCount: number;
  columnIndex: Record<string, number>;
  missingRequiredKeys: string[];
}

/** Pure transform: table rows in, template CSV text out. No I/O, fully testable. */
export function buildCsvFromTableRows(allRows: string[][]): BuildCsvResult {
  if (allRows.length === 0) {
    return { csv: null, rowCount: 0, columnIndex: {}, missingRequiredKeys: [] };
  }

  const headerRow = allRows[0];
  const columnIndex: Record<string, number> = {};
  for (const [templateKey, aliases] of Object.entries(HEADER_ALIASES)) {
    columnIndex[templateKey] = findColumnIndex(headerRow, aliases);
  }

  const missingRequiredKeys = TEMPLATE_COLUMNS.filter(
    (c) => c.required && (columnIndex[c.key] ?? -1) === -1,
  ).map((c) => c.key);
  if (missingRequiredKeys.length > 0) {
    return { csv: null, rowCount: 0, columnIndex, missingRequiredKeys };
  }

  // Skip the header row, and skip any repeated header rows from later
  // pages of a paginated report.
  const dataRows = allRows
    .slice(1)
    .filter((row) => row.join("|").toLowerCase() !== headerRow.join("|").toLowerCase());

  const outputHeader = TEMPLATE_COLUMNS.map((c) => c.header).join(",");
  const outputLines = [outputHeader];

  for (const row of dataRows) {
    const get = (key: string) => {
      const idx = columnIndex[key];
      return idx !== undefined && idx !== -1 ? (row[idx] ?? "").trim() : "";
    };

    if (!get("name")) continue; // skip blank/subtotal rows

    const values = TEMPLATE_COLUMNS.map((c) => {
      if (c.key === "state") return get("state") || "WA";
      if (c.key === "source_notes") return `WSDA nursery dealer list, ${new Date().toISOString().slice(0, 10)}`;
      if (c.key === "status") return "PUBLISHED";
      return get(c.key);
    });

    outputLines.push(values.map(csvEscape).join(","));
  }

  return { csv: outputLines.join("\n") + "\n", rowCount: outputLines.length - 1, columnIndex, missingRequiredKeys: [] };
}

async function main() {
  console.log(`Downloading and parsing: ${PDF_URL}`);
  const parser = new PDFParse({ url: PDF_URL });
  const result = await parser.getTable();
  await parser.destroy();

  const allRows: string[][] = [];
  for (const page of result.pages) {
    for (const table of page.tables ?? []) {
      allRows.push(...(table as unknown as string[][]));
    }
  }

  if (allRows.length === 0) {
    console.error(
      "No table detected in this PDF. It may be formatted as plain text rather than a real table - " +
        "fall back to parser.getText() and share the output so we can write a text-based parser instead.",
    );
    process.exit(1);
  }

  console.log("\nDetected header row:");
  console.log(allRows[0]);
  console.log("\nFirst 3 data rows:");
  for (const row of allRows.slice(1, 4)) console.log(row);

  const built = buildCsvFromTableRows(allRows);
  if (built.missingRequiredKeys.length > 0) {
    console.error(
      `\nCouldn't confidently map these required columns: ${built.missingRequiredKeys.join(", ")}.\n` +
        "Check the header row printed above and adjust HEADER_ALIASES in this script to match, then re-run.",
    );
    process.exit(1);
  }

  console.log("\nColumn mapping:", built.columnIndex);

  await writeFile(OUTPUT_PATH, built.csv!, "utf-8");
  console.log(`\nWrote ${built.rowCount} rows to ${OUTPUT_PATH}.`);
  console.log("Review it, then upload it at /admin/import.");
}

const isMain = process.argv[1] && import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
