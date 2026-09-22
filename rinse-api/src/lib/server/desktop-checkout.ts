import { stripeAppOrigin } from "./stripe"
export function checkoutReturnUrls(request: Request, context?: string) {
  if (context !== "desktop_onboarding") {
    const origin = stripeAppOrigin(request)
    return {
      success_url: `${origin}/billing/return?result=success`,
      cancel_url: `${origin}/billing/return?result=cancel`,
    }
  }
  const configured = process.env.DESKTOP_APP_ORIGIN
  if (!configured) throw new Error("Desktop checkout return is not configured")
  const url = new URL(configured)
  if (
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash ||
    (url.protocol !== "https:" &&
      !(
        url.protocol === "http:" &&
        ["localhost", "127.0.0.1"].includes(url.hostname)
      ))
  ) {
    throw new Error(
      "Desktop checkout requires a trusted HTTPS origin (or localhost)",
    )
  }
  return {
    success_url: `${url.origin}/?desktop_billing=success`,
    cancel_url: `${url.origin}/?desktop_billing=cancel`,
  }
}
