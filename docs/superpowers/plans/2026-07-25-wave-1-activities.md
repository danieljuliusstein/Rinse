# Wave 1 — Activities MVP

**Goal:** Timeline events (call, email, note, meeting) on Contacts with optional Deal link; PocketBase `activities` collection with localStorage fallback.

**API:** `listActivities`, `listActivitiesForContact`, `createActivity`, `deleteActivity` in `src/lib/platform-api.ts`.

**UI:** `ActivitiesPage` list + create; Contact detail/sidebar shows recent activities when available.
