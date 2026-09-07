import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getNurseryBySlug } from "@/lib/nursery-queries";
import { PlanBadge } from "@/components/PlanBadge";
import { LimitedInfoBadge, isThinListing } from "@/components/LimitedInfoBadge";
import { stateName } from "@/lib/us-states";

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: PageProps<"/nursery/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const nursery = await getNurseryBySlug(slug);
  if (!nursery) return {};
  return {
    title: `${nursery.name} — ${nursery.city}, ${nursery.state}`,
    description:
      nursery.description ??
      `${nursery.name} is a plant nursery in ${nursery.city}, ${nursery.state}.`,
  };
}

export default async function NurseryPage({
  params,
}: PageProps<"/nursery/[slug]">) {
  const { slug } = await params;
  const nursery = await getNurseryBySlug(slug);

  if (!nursery || nursery.status !== "PUBLISHED") {
    notFound();
  }

  const fullAddress = [
    nursery.addressLine1,
    nursery.addressLine2,
    nursery.city,
    `${nursery.state} ${nursery.postalCode}`.trim(),
  ]
    .filter(Boolean)
    .join(", ");

  const socialLinks =
    nursery.socialLinks && typeof nursery.socialLinks === "object" && !Array.isArray(nursery.socialLinks)
      ? Object.values(nursery.socialLinks as Record<string, string>)
      : [];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "GardenStore",
    name: nursery.name,
    description: nursery.description ?? undefined,
    address: {
      "@type": "PostalAddress",
      streetAddress: nursery.addressLine1 || undefined,
      addressLocality: nursery.city,
      addressRegion: nursery.state,
      postalCode: nursery.postalCode || undefined,
      addressCountry: "US",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: nursery.latitude,
      longitude: nursery.longitude,
    },
    telephone: nursery.phone ?? undefined,
    url: nursery.website ?? undefined,
    sameAs: socialLinks.length > 0 ? socialLinks : undefined,
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <nav className="text-sm text-muted">
        <Link href="/search" className="hover:text-primary">
          ← Back to search
        </Link>
      </nav>

      <div className="mt-4 flex items-start justify-between gap-3">
        <h1 className="text-2xl font-bold">{nursery.name}</h1>
        <div className="flex shrink-0 gap-2">
          {isThinListing(nursery) && <LimitedInfoBadge />}
          <PlanBadge planTier={nursery.planTier} />
        </div>
      </div>
      <p className="mt-1 text-muted">
        {nursery.city}, {stateName(nursery.state)}
      </p>

      {nursery.description && (
        <p className="mt-4 leading-relaxed">{nursery.description}</p>
      )}

      {nursery.specialties.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {nursery.specialties.map(({ specialty }) => (
            <span
              key={specialty.id}
              className="rounded-full bg-primary/10 px-3 py-1 text-xs text-primary-dark"
            >
              {specialty.name}
            </span>
          ))}
        </div>
      )}

      <dl className="mt-6 space-y-2 rounded-lg border border-border bg-surface p-4 text-sm">
        <div className="flex gap-2">
          <dt className="w-24 shrink-0 text-muted">Address</dt>
          <dd>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                fullAddress,
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              {fullAddress}
            </a>
          </dd>
        </div>
        {nursery.phone && (
          <div className="flex gap-2">
            <dt className="w-24 shrink-0 text-muted">Phone</dt>
            <dd>
              <a href={`tel:${nursery.phone}`} className="text-primary hover:underline">
                {nursery.phone}
              </a>
            </dd>
          </div>
        )}
        {nursery.website && (
          <div className="flex gap-2">
            <dt className="w-24 shrink-0 text-muted">Website</dt>
            <dd>
              <a
                href={nursery.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                {nursery.website}
              </a>
            </dd>
          </div>
        )}
      </dl>

      {socialLinks.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-3 text-sm">
          {socialLinks.map((url) => {
            let label = url;
            try {
              label = new URL(url).hostname.replace(/^www\./, "");
            } catch {
              // Not a full URL (e.g. admin typed a bare handle) - fall
              // back to showing the raw value instead of crashing.
            }
            return (
              <a
                key={url}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                {label}
              </a>
            );
          })}
        </div>
      )}

      <div className="mt-6 rounded-lg border border-dashed border-border p-4 text-sm text-muted">
        {isThinListing(nursery)
          ? "We don't have much on file for this nursery yet — just a name and location. "
          : "Is this your nursery? "}
        <Link href={`/submit?claim=${nursery.slug}`} className="text-primary underline">
          Claim this listing
        </Link>{" "}
        to {isThinListing(nursery) ? "add a phone number, website, address, and more." : "update its details."}
      </div>
    </div>
  );
}
