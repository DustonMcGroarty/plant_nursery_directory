"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

const submissionSchema = z.object({
  nurseryId: z.string().optional(),
  requesterName: z.string().min(1, "Your name is required").max(200),
  requesterEmail: z.string().email("A valid email is required"),
  proposedName: z.string().min(1, "Nursery name is required").max(200),
  proposedAddressLine1: z.string().min(1, "Street address is required").max(200),
  proposedAddressLine2: z.string().max(200).optional().or(z.literal("")),
  proposedCity: z.string().min(1, "City is required").max(100),
  proposedState: z.string().length(2, "Use a 2-letter state code"),
  proposedPostalCode: z.string().min(3, "ZIP code is required").max(12),
  proposedPhone: z.string().max(30).optional().or(z.literal("")),
  proposedWebsite: z.string().url("Enter a full URL, e.g. https://example.com").optional().or(z.literal("")),
  proposedDescription: z.string().max(2000).optional().or(z.literal("")),
  proposedSpecialties: z.array(z.string()).optional(),
  note: z.string().max(2000).optional().or(z.literal("")),
});

export interface SubmitFormState {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
}

export async function submitNurseryRequest(
  _prevState: SubmitFormState,
  formData: FormData,
): Promise<SubmitFormState> {
  const raw = {
    nurseryId: formData.get("nurseryId")?.toString() || undefined,
    requesterName: formData.get("requesterName")?.toString() ?? "",
    requesterEmail: formData.get("requesterEmail")?.toString() ?? "",
    proposedName: formData.get("proposedName")?.toString() ?? "",
    proposedAddressLine1: formData.get("proposedAddressLine1")?.toString() ?? "",
    proposedAddressLine2: formData.get("proposedAddressLine2")?.toString() ?? "",
    proposedCity: formData.get("proposedCity")?.toString() ?? "",
    proposedState: (formData.get("proposedState")?.toString() ?? "").toUpperCase(),
    proposedPostalCode: formData.get("proposedPostalCode")?.toString() ?? "",
    proposedPhone: formData.get("proposedPhone")?.toString() ?? "",
    proposedWebsite: formData.get("proposedWebsite")?.toString() ?? "",
    proposedDescription: formData.get("proposedDescription")?.toString() ?? "",
    proposedSpecialties: formData.getAll("proposedSpecialties").map((v) => v.toString()),
    note: formData.get("note")?.toString() ?? "",
  };

  const parsed = submissionSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string" && !fieldErrors[key]) {
        fieldErrors[key] = issue.message;
      }
    }
    return { ok: false, error: "Please fix the errors below.", fieldErrors };
  }

  const data = parsed.data;

  await prisma.claimRequest.create({
    data: {
      nurseryId: data.nurseryId || null,
      requesterName: data.requesterName,
      requesterEmail: data.requesterEmail,
      proposedName: data.proposedName,
      proposedAddressLine1: data.proposedAddressLine1,
      proposedAddressLine2: data.proposedAddressLine2 || null,
      proposedCity: data.proposedCity,
      proposedState: data.proposedState,
      proposedPostalCode: data.proposedPostalCode,
      proposedPhone: data.proposedPhone || null,
      proposedWebsite: data.proposedWebsite || null,
      proposedDescription: data.proposedDescription || null,
      proposedSpecialties: data.proposedSpecialties ?? [],
      note: data.note || null,
    },
  });

  redirect("/submit/thank-you");
}
