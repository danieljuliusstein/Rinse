# Automations POV (Wave 8)

**Question:** Zapier-style connector vs first-party builder?

**Verdict for this project:** Ship **first-party trigger → action rules** now (Forms / Chat / Activities already emit events into `runAutomationsForTrigger`). Expose the same triggers via Zapier/webhooks later as an adapter — do not block the spine on external SaaS.

**Rationale:** Desk CRM already has Contacts/Deals/Activities as the integration hub; a local rules engine keeps waves coinciding without OAuth/Zapier app review. Zapier remains a future channel, not a prerequisite.
