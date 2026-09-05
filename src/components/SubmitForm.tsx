"use client";

import { useActionState } from "react";
import { submitNurseryRequest, type SubmitFormState } from "@/app/submit/actions";
import { US_STATES } from "@/lib/us-states";

interface SubmitFormProps {
  specialties: { slug: string; name: string }[];
  claimingNursery?: {
    id: string;
    name: string;
    addressLine1: string;
    addressLine2: string | null;
    city: string;
    state: string;
    postalCode: string;
    phone: string | null;
    website: string | null;
    description: string | null;
  } | null;
}

const initialState: SubmitFormState = { ok: false };

export function SubmitForm({ specialties, claimingNursery }: SubmitFormProps) {
  const [state, formAction, pending] = useActionState(submitNurseryRequest, initialState);

  const field = (name: string) => state.fieldErrors?.[name];

  return (
    <form action={formAction} className="space-y-5">
      {claimingNursery && (
        <input type="hidden" name="nurseryId" value={claimingNursery.id} />
      )}

      {state.error && (
        <p className="rounded-md bg-accent/10 px-3 py-2 text-sm text-accent">
          {state.error}
        </p>
      )}

      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold">Your information</legend>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field
            label="Your name"
            name="requesterName"
            error={field("requesterName")}
          />
          <Field
            label="Your email"
            name="requesterEmail"
            type="email"
            error={field("requesterEmail")}
          />
        </div>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold">Nursery details</legend>
        <Field
          label="Nursery name"
          name="proposedName"
          defaultValue={claimingNursery?.name}
          error={field("proposedName")}
        />
        <Field
          label="Street address"
          name="proposedAddressLine1"
          defaultValue={claimingNursery?.addressLine1}
          error={field("proposedAddressLine1")}
        />
        <Field
          label="Address line 2 (optional)"
          name="proposedAddressLine2"
          defaultValue={claimingNursery?.addressLine2 ?? undefined}
        />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Field
            label="City"
            name="proposedCity"
            defaultValue={claimingNursery?.city}
            error={field("proposedCity")}
          />
          <div>
            <label className="mb-1 block text-sm text-muted">State</label>
            <select
              name="proposedState"
              defaultValue={claimingNursery?.state ?? ""}
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm"
            >
              <option value="">Select…</option>
              {US_STATES.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.name}
                </option>
              ))}
            </select>
            {field("proposedState") && (
              <p className="mt-1 text-xs text-accent">{field("proposedState")}</p>
            )}
          </div>
          <Field
            label="ZIP code"
            name="proposedPostalCode"
            defaultValue={claimingNursery?.postalCode}
            error={field("proposedPostalCode")}
          />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field
            label="Phone (optional)"
            name="proposedPhone"
            defaultValue={claimingNursery?.phone ?? undefined}
          />
          <Field
            label="Website (optional)"
            name="proposedWebsite"
            defaultValue={claimingNursery?.website ?? undefined}
            error={field("proposedWebsite")}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-muted">
            Description (optional)
          </label>
          <textarea
            name="proposedDescription"
            defaultValue={claimingNursery?.description ?? undefined}
            rows={4}
            className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm"
          />
        </div>
        <div>
          <span className="mb-1 block text-sm text-muted">Specialties</span>
          <div className="flex flex-wrap gap-2">
            {specialties.map((s) => (
              <label
                key={s.slug}
                className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs"
              >
                <input type="checkbox" name="proposedSpecialties" value={s.slug} />
                {s.name}
              </label>
            ))}
          </div>
        </div>
      </fieldset>

      <div>
        <label className="mb-1 block text-sm text-muted">
          Anything else we should know? (optional)
        </label>
        <textarea
          name="note"
          rows={3}
          className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-contrast hover:bg-primary-dark disabled:opacity-60"
      >
        {pending ? "Submitting…" : claimingNursery ? "Submit claim" : "Submit nursery"}
      </button>
      <p className="text-xs text-muted">
        Submissions are reviewed before appearing in the directory.
      </p>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  defaultValue,
  error,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string;
  error?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm text-muted">{label}</label>
      <input
        type={type}
        name={name}
        defaultValue={defaultValue}
        className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm"
      />
      {error && <p className="mt-1 text-xs text-accent">{error}</p>}
    </div>
  );
}
