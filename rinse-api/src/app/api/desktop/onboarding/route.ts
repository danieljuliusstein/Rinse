import { NextResponse } from "next/server"
import { authenticateRequestUser } from "@/lib/server/request-auth"
import { deskCorsOptions, withDeskCors } from "@/lib/server/desk-cors"
import {
  desktopOnboardingAction,
  desktopOnboardingCommand,
} from "@/lib/server/desktop-onboarding"
export const runtime = "nodejs"
export const OPTIONS = deskCorsOptions
async function handle(request: Request, writing: boolean) {
  const json = (body: unknown, status = 200) =>
    withDeskCors(
      NextResponse.json(body, {
        status,
        headers: { "Cache-Control": "no-store" },
      }),
      request,
    )
  const auth = await authenticateRequestUser(request)
  if (!auth) return json({ error: "Sign in to continue" }, 401)
  if (!auth.verified)
    return json({ error: "Verify your email to continue" }, 403)
  if (process.env.DESKTOP_ONBOARDING_ENABLED !== "true")
    return json({ enabled: false })
  try {
    let action: Record<string, unknown> = { action: "read" }
    if (writing) {
      const parsed = desktopOnboardingAction.safeParse(
        await request.json().catch(() => null),
      )
      if (!parsed.success)
        return json(
          { error: parsed.error.issues[0]?.message || "Invalid setup details" },
          400,
        )
      action = parsed.data
    }
    return json({
      enabled: true,
      ...(await desktopOnboardingCommand(auth.organizationId, action)),
    })
  } catch (error) {
    const status = (error as { status?: number }).status
    return json(
      {
        error:
          status === 400
            ? (error as { response?: { message?: string } }).response
                ?.message || "Check your setup details and try again"
            : "Could not load or save setup. Please retry.",
      },
      status === 400 ? 400 : 503,
    )
  }
}
export const GET = (request: Request) => handle(request, false)
export const POST = (request: Request) => handle(request, true)
