import { z } from "zod"
import { authenticateServerAdmin } from "./pocketbase-admin"
const shortText = z.string().trim().max(200)
const timezone = z.string().refine((value) => {
  try {
    new Intl.DateTimeFormat("en", { timeZone: value })
    return !!value
  } catch {
    return false
  }
}, "Choose a valid timezone")
export const desktopOnboardingAction = z.discriminatedUnion("action", [
  z.object({ action: z.literal("start") }).strict(),
  z
    .object({ action: z.literal("plan"), choice: z.enum(["free", "paid"]) })
    .strict(),
  z
    .object({
      action: z.literal("business"),
      business: z
        .object({
          business_name: shortText.min(1),
          business_phone: shortText,
          business_email: z.union([z.literal(""), z.email()]),
          business_address: z.string().trim().max(500),
          timezone,
        })
        .strict(),
    })
    .strict(),
  z
    .object({
      action: z.literal("prepare"),
      service: z
        .object({
          name: shortText.min(1),
          price: z.number().min(0).max(1000000),
        })
        .strict()
        .optional(),
      client: z
        .object({ name: shortText.min(1) })
        .strict()
        .optional(),
    })
    .strict(),
  z.object({ action: z.literal("complete") }).strict(),
])
export async function desktopOnboardingCommand(
  orgId: string,
  action: Record<string, unknown>,
) {
  const pb = await authenticateServerAdmin()
  return pb.send("/api/rinse/desktop-onboarding", {
    method: "POST",
    body: { ...action, orgId },
  })
}
