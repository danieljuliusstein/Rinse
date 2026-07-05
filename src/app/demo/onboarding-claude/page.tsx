import { redirect } from 'next/navigation'

/** @deprecated Use production /intro — same 6-slide flow. */
export default function OnboardingClaudeDemoPage() {
  redirect('/intro')
}
