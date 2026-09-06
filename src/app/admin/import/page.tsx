import { ImportForm } from "@/components/admin/ImportForm";

export default function ImportPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold">Bulk Import</h1>
      <p className="mt-1 text-sm text-muted">
        Upload a CSV of nurseries (state Dept. of Agriculture lists, trade association
        directories, etc.) to add or update listings in bulk.
      </p>
      <a
        href="/admin/import/template"
        className="mt-2 inline-block text-sm text-primary underline"
      >
        Download CSV template
      </a>

      <div className="mt-6">
        <ImportForm />
      </div>
    </div>
  );
}
