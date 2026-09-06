import { parse } from "csv-parse/sync";
import { US_STATES } from "@/lib/us-states";

export const TEMPLATE_COLUMNS = [
  { key: "name", header: "name", required: true },
  { key: "address_line1", header: "address_line1", required: true },
  { key: "address_line2", header: "address_line2", required: false },
  { key: "city", header: "city", required: true },
  { key: "state", header: "state", required: true },
  { key: "postal_code", header: "postal_code", required: true },
  { key: "phone", header: "phone", required: false },
  { key: "website", header: "website", required: false },
  { key: "email", header: "email", required: false },
  { key: "description", header: "description", required: false },
  { key: "specialties", header: "specialties", required: false },
  { key: "business_type", header: "business_type", required: false },
  { key: "license_number", header: "license_number", required: false },
  { key: "license_status", header: "license_status", required: false },
  { key: "license_expiration", header: "license_expiration", required: false },
  { key: "source_notes", header: "source_notes", required: false },
  { key: "status", header: "status", required: false },
  { key: "latitude", header: "latitude", required: false },
  { key: "longitude", header: "longitude", required: false },
] as const;

const VALID_STATUSES = ["DRAFT", "PENDING", "PUBLISHED", "UNPUBLISHED"];
const VALID_BUSINESS_TYPES = ["WHOLESALE", "RETAIL", "ONLINE_ONLY", "BROKER"];
const VALID_STATE_CODES = new Set(US_STATES.map((s) => s.code));

export function generateTemplateCsv(): string {
  const header = TEMPLATE_COLUMNS.map((c) => c.header).join(",");
  const example =
    'Example Nursery,123 Main St,,Springfield,OH,45501,(555) 123-4567,https://example.com,,"A friendly local nursery","Native Plants, Wholesale",RETAIL,NUR-12345,Active,2027-06-30,"Sourced from state list",PUBLISHED,,';
  return `${header}\n${example}\n`;
}

export interface ParsedCsvRow {
  lineNumber: number;
  raw: Record<string, string>;
  errors: string[];
  warnings: string[];
}

export function parseImportCsv(text: string): ParsedCsvRow[] {
  const records: Record<string, string>[] = parse(text, {
    columns: (header: string[]) => header.map((h) => h.trim().toLowerCase()),
    skip_empty_lines: true,
    trim: true,
  });

  return records.map((raw, i) => {
    const errors: string[] = [];
    const warnings: string[] = [];

    for (const col of TEMPLATE_COLUMNS) {
      if (col.required && !raw[col.key]?.trim()) {
        errors.push(`Missing required "${col.header}"`);
      }
    }

    const state = raw.state?.trim().toUpperCase();
    if (state && !VALID_STATE_CODES.has(state)) {
      errors.push(`"${raw.state}" is not a valid 2-letter state code`);
    }

    const status = raw.status?.trim().toUpperCase();
    if (status && !VALID_STATUSES.includes(status)) {
      errors.push(`"${raw.status}" is not a valid status (${VALID_STATUSES.join(", ")})`);
    }

    const businessType = raw.business_type?.trim().toUpperCase();
    if (businessType && !VALID_BUSINESS_TYPES.includes(businessType)) {
      errors.push(`"${raw.business_type}" is not a valid business_type (${VALID_BUSINESS_TYPES.join(", ")})`);
    }

    if (raw.license_expiration && Number.isNaN(Date.parse(raw.license_expiration))) {
      errors.push(`"${raw.license_expiration}" is not a valid date (use YYYY-MM-DD)`);
    }

    if (raw.latitude && Number.isNaN(Number(raw.latitude))) {
      errors.push(`"${raw.latitude}" is not a valid latitude`);
    }
    if (raw.longitude && Number.isNaN(Number(raw.longitude))) {
      errors.push(`"${raw.longitude}" is not a valid longitude`);
    }

    return { lineNumber: i + 2, raw, errors, warnings }; // +2: header row + 1-indexing
  });
}
