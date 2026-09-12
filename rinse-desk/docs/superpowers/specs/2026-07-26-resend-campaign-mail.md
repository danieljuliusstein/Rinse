# Resend campaign mail + open/click tracking

Companion service lives in `server/campaign-mail/`. Secrets never go in the Vite client.

## PocketBase

1. Create collection **`campaign_sends`** per `pocketbase-platform-collections.md` (unique `resend_email_id`).
2. Confirm **`campaigns`** has number fields `stats_sent`, `stats_opened`, and **`stats_clicked`**.
3. Add optional date field **`clicked_at`** on `campaign_sends`.
4. Prefer API rules so org members can create activities/campaigns; the mail service uses admin credentials for reliable webhook writes.

## Resend

1. Create a Resend account and verify a sending domain (or use the onboarding `onboarding@resend.dev` from-address for smoke).
2. Create an API key → `RESEND_API_KEY`.
3. Set `RESEND_FROM` to a verified From address.
4. In the domain settings, enable **Click tracking** (and open tracking if not already on).
5. Create a webhook pointing at `https://<mail-host>/webhooks/resend`.
6. Subscribe to **`email.opened`** and **`email.clicked`**.
7. Copy the webhook signing secret → `RESEND_WEBHOOK_SECRET`.

Open tracking depends on Resend’s open pixel; some clients block it — treat open rate as best-effort.

Click tracking depends on Resend rewriting `<a href>` links. Campaign body text with bare `https://…` URLs is autolinked on send. Without real links in the body, **Clicked** stays 0.

## Desk app

```
VITE_CAMPAIGN_MAIL_URL=https://<mail-host>
```

No Resend keys in client env. When this URL is unset, **Mark sent** stays a local mock (Activities + `stats_sent` only; opens/clicks stay 0).

## Deploy notes

- Mail service needs HTTPS for Resend webhooks.
- Network: service must reach PocketBase (`PB_URL`).
- Auth: send route requires a signed-in desk operator Bearer token; webhook uses admin PB credentials only.
- After a tracked open/click, refresh Dashboard / Campaigns — **Email Stats** aggregates `stats_opened` and `stats_clicked`.
