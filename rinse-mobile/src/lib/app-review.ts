import * as StoreReview from 'expo-store-review'
import { getSecureItem, setSecureItem } from './secure-storage'

const JOB_COUNT_KEY = 'rinse_app_review_job_count'
const PROMPTED_KEY = 'rinse_app_review_prompted'
const PROMPT_THRESHOLD = 5

export async function recordSuccessfulJobAndMaybePromptReview(): Promise<void> {
  if (!(await StoreReview.isAvailableAsync())) return

  const prompted = await getSecureItem(PROMPTED_KEY)
  if (prompted === '1') return

  const raw = await getSecureItem(JOB_COUNT_KEY)
  const count = (raw ? Number.parseInt(raw, 10) : 0) + 1
  await setSecureItem(JOB_COUNT_KEY, String(count))

  if (count < PROMPT_THRESHOLD) return
  if (!(await StoreReview.hasAction())) return

  await setSecureItem(PROMPTED_KEY, '1')
  await StoreReview.requestReview()
}
