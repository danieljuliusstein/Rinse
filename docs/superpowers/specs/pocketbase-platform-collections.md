# PocketBase collection schemas (platform waves)

Create these org-scoped collections in PocketBase Admin. Until they exist, the desk app falls back to per-org localStorage via `orgStore`.

## activities
- organization_id (relation/text)
- contact_id (text, required)
- deal_id (text, optional)
- type (select: call, email, note, meeting)
- subject (text)
- body (text, optional)
- occurred_at (date)

## campaigns
- organization_id, name, status (draft|active|paused|completed), audience_ids (json array of contact ids), subject (text optional), body (text optional), channel (email|sms|ads|other), stats_sent (number), stats_opened (number), stats_clicked (number)

## campaign_sends
Per-recipient Resend correlation for unique open + click tracking (see `docs/superpowers/specs/2026-07-26-resend-campaign-mail.md`).

- organization_id (relation/text, required)
- campaign_id (text, required) — parent `campaigns` id
- contact_id (text, required)
- resend_email_id (text, required, **unique**) — Resend message id from send response / webhook `data.email_id`
- to_email (email/text, required)
- opened_at (date, optional) — set once on first `email.opened`
- clicked_at (date, optional) — set once on first `email.clicked`
- created (auto)

**Indexes / uniqueness.** Unique on `resend_email_id`. Recommended index on `campaign_id`.

**API rules (suggested).** Authenticated org members can list/create rows for their `organization_id`. Webhook/mail service typically uses a superuser/admin token to patch `opened_at` / `clicked_at` and increment campaign `stats_opened` / `stats_clicked`.

## forms
- organization_id, name, fields_json (json), status (draft|live)

## form_submissions
- organization_id, form_id, contact_id (optional), payload_json, created

## landing_pages
- organization_id, name, slug, headline, body_html, status (draft|published)

## funnels
- organization_id, name, steps_json, status

## chat_threads
- organization_id, visitor_name, visitor_email, contact_id (optional), status (open|closed), last_message_at

## chat_messages
- organization_id, thread_id, sender (visitor|agent), body, created

## automations
- organization_id, name, enabled (bool), trigger (form_submitted|deal_stage_changed|activity_logged|chat_message), action (create_activity|update_contact_tag|notify), config_json
- `config_json` may include a `workflow` object: `{ nodes: AutomationNode[], edges: AutomationEdge[] }` for multi-step graphs (trigger / action / condition). Flat string keys (subject, body, message, tag) remain for legacy rules; missing `workflow` is synthesized as trigger → action on read.
