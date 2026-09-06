"use client";

import { useActionState } from "react";
import { previewImport, commitImport, type PreviewState } from "@/app/admin/import/actions";

const initialState: PreviewState = {};

export function ImportForm() {
  const [state, previewAction, previewPending] = useActionState(previewImport, initialState);

  return (
    <div className="space-y-6">
      <form action={previewAction} className="rounded-lg border border-border bg-surface p-4">
        <label className="mb-2 block text-sm font-medium">CSV file</label>
        <input
          type="file"
          name="file"
          accept=".csv,text/csv"
          required
          className="block w-full text-sm"
        />
        <button
          type="submit"
          disabled={previewPending}
          className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-contrast hover:bg-primary-dark disabled:opacity-60"
        >
          {previewPending ? "Reading file…" : "Preview import"}
        </button>
      </form>

      {state.error && (
        <p className="rounded-md bg-accent/10 px-3 py-2 text-sm text-accent">{state.error}</p>
      )}

      {state.rows && (
        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-surface p-4 text-sm">
            <p>
              <strong>{state.rows.length}</strong> rows found —{" "}
              <span className="text-primary-dark">{state.validCount} ready to import</span>
              {state.errorCount ? (
                <>
                  , <span className="text-accent">{state.errorCount} with errors (will be skipped)</span>
                </>
              ) : null}
              .
            </p>
            <p className="mt-1 text-xs text-muted">
              Matching an existing listing (by name + city + state) updates it — filling in blank
              fields and license info — rather than creating a duplicate. It won&apos;t change an
              existing listing&apos;s status unless this file explicitly sets one.
            </p>
          </div>

          <div className="max-h-96 overflow-auto rounded-lg border border-border">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-surface text-left text-muted">
                <tr>
                  <th className="px-2 py-1.5">Row</th>
                  <th className="px-2 py-1.5">Name</th>
                  <th className="px-2 py-1.5">City</th>
                  <th className="px-2 py-1.5">State</th>
                  <th className="px-2 py-1.5">Issues</th>
                </tr>
              </thead>
              <tbody>
                {state.rows.map((row) => (
                  <tr
                    key={row.lineNumber}
                    className={`border-t border-border ${row.errors.length ? "bg-accent/5" : ""}`}
                  >
                    <td className="px-2 py-1.5 text-muted">{row.lineNumber}</td>
                    <td className="px-2 py-1.5">{row.raw.name}</td>
                    <td className="px-2 py-1.5 text-muted">{row.raw.city}</td>
                    <td className="px-2 py-1.5 text-muted">{row.raw.state}</td>
                    <td className="px-2 py-1.5 text-accent">{row.errors.join("; ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {state.validCount! > 0 && (
            <form action={commitImport}>
              <input type="hidden" name="rawText" value={state.rawText} />
              <button
                type="submit"
                className="rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-contrast hover:bg-primary-dark"
              >
                Import {state.validCount} valid rows
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
