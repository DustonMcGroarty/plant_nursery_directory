import { US_STATES } from "@/lib/us-states";
import { NurseryStatus, DataSource, BusinessType } from "@/generated/prisma/client";

interface AdminNurseryFormProps {
  action: (formData: FormData) => void | Promise<void>;
  specialties: { slug: string; name: string }[];
  submitLabel: string;
  initial?: {
    name: string;
    legalName: string | null;
    addressLine1: string;
    addressLine2: string | null;
    city: string;
    state: string;
    postalCode: string;
    latitude: number;
    longitude: number;
    phone: string | null;
    website: string | null;
    email: string | null;
    contactEmail: string | null;
    description: string | null;
    businessType: string | null;
    licenseNumber: string | null;
    licenseStatus: string | null;
    licenseExpiresAt: Date | null;
    sourceNotes: string | null;
    status: string;
    source: string;
    socialLinks: Record<string, string> | null;
    selectedSpecialtySlugs: string[];
  };
}

export function AdminNurseryForm({ action, specialties, submitLabel, initial }: AdminNurseryFormProps) {
  const social = initial?.socialLinks ?? {};

  return (
    <form action={action} className="space-y-6">
      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold">Identity</legend>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Display name" name="name" required defaultValue={initial?.name} />
          <Field label="Legal name (optional)" name="legalName" defaultValue={initial?.legalName ?? undefined} />
        </div>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold">Address & location</legend>
        <Field label="Street address" name="addressLine1" required defaultValue={initial?.addressLine1} />
        <Field
          label="Address line 2 (optional)"
          name="addressLine2"
          defaultValue={initial?.addressLine2 ?? undefined}
        />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Field label="City" name="city" required defaultValue={initial?.city} />
          <div>
            <label className="mb-1 block text-sm text-muted">State</label>
            <select
              name="state"
              defaultValue={initial?.state ?? ""}
              required
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm"
            >
              <option value="" disabled>
                Select…
              </option>
              {US_STATES.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <Field label="ZIP code" name="postalCode" required defaultValue={initial?.postalCode} />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field
            label="Latitude"
            name="latitude"
            type="number"
            step="any"
            defaultValue={initial?.latitude?.toString()}
          />
          <Field
            label="Longitude"
            name="longitude"
            type="number"
            step="any"
            defaultValue={initial?.longitude?.toString()}
          />
        </div>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold">Contact</legend>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Public phone" name="phone" defaultValue={initial?.phone ?? undefined} />
          <Field label="Website" name="website" defaultValue={initial?.website ?? undefined} />
          <Field label="Public email" name="email" defaultValue={initial?.email ?? undefined} />
          <Field
            label="Private contact email (admin-only)"
            name="contactEmail"
            defaultValue={initial?.contactEmail ?? undefined}
          />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {["instagram", "facebook", "x", "youtube", "pinterest"].map((platform) => (
            <Field
              key={platform}
              label={platform[0].toUpperCase() + platform.slice(1)}
              name={`social_${platform}`}
              defaultValue={social[platform]}
            />
          ))}
        </div>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold">Business details</legend>
        <div>
          <label className="mb-1 block text-sm text-muted">Description</label>
          <textarea
            name="description"
            rows={4}
            defaultValue={initial?.description ?? undefined}
            className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm"
          />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm text-muted">Business type</label>
            <select
              name="businessType"
              defaultValue={initial?.businessType ?? ""}
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm"
            >
              <option value="">Unspecified</option>
              {Object.values(BusinessType).map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <span className="mb-1 block text-sm text-muted">Specialties</span>
          <div className="flex flex-wrap gap-2">
            {specialties.map((s) => (
              <label
                key={s.slug}
                className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs"
              >
                <input
                  type="checkbox"
                  name="specialties"
                  value={s.slug}
                  defaultChecked={initial?.selectedSpecialtySlugs.includes(s.slug)}
                />
                {s.name}
              </label>
            ))}
          </div>
        </div>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold">Licensing</legend>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Field label="License number" name="licenseNumber" defaultValue={initial?.licenseNumber ?? undefined} />
          <Field label="License status" name="licenseStatus" defaultValue={initial?.licenseStatus ?? undefined} />
          <Field
            label="License expires"
            name="licenseExpiresAt"
            type="date"
            defaultValue={initial?.licenseExpiresAt?.toISOString().slice(0, 10)}
          />
        </div>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold">Admin</legend>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm text-muted">Status</label>
            <select
              name="status"
              defaultValue={initial?.status ?? "PUBLISHED"}
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm"
            >
              {Object.values(NurseryStatus).map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm text-muted">Source</label>
            <select
              name="source"
              defaultValue={initial?.source ?? "ADMIN"}
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm"
            >
              {Object.values(DataSource).map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm text-muted">Source notes (admin-only)</label>
          <textarea
            name="sourceNotes"
            rows={2}
            defaultValue={initial?.sourceNotes ?? undefined}
            className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm"
          />
        </div>
      </fieldset>

      <button
        type="submit"
        className="rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-contrast hover:bg-primary-dark"
      >
        {submitLabel}
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  step,
  required,
  defaultValue,
}: {
  label: string;
  name: string;
  type?: string;
  step?: string;
  required?: boolean;
  defaultValue?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm text-muted">{label}</label>
      <input
        type={type}
        name={name}
        step={step}
        required={required}
        defaultValue={defaultValue}
        className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm"
      />
    </div>
  );
}
