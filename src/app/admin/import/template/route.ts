import { generateTemplateCsv } from "@/lib/csv-import";

export async function GET() {
  return new Response(generateTemplateCsv(), {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": 'attachment; filename="nursery-import-template.csv"',
    },
  });
}
