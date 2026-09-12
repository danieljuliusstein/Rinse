# Product demo video (~35s)

**Goal:** Show a client booking online, then the job appearing on the operator home screen.

**Output:** `marketing/raw/video/product-demo.mp4` — 1080×1920 or 1920×1080, H.264, muted-friendly.

## Beats

| Time | Screen | Action |
|------|--------|--------|
| 0:00 | `rinsehq.com/book/{orgSlug}` | Scroll packages; tap **Full Detail** |
| 0:08 | Date picker | Pick tomorrow or next open day; tap **10:00** slot |
| 0:14 | Contact form | Enter **Jane Demo**, `555-010-0000`, confirm |
| 0:20 | Confirmation | Hold on success state 2s |
| 0:22 | Cut | Operator app — **Home** tab |
| 0:26 | Week strip | Tap the new booking day; show job on today/tomorrow strip |
| 0:32 | Today card | Tap job → brief detail peek |
| 0:35 | End | Fade on Rinse wordmark |

## Notes

- Re-run `npm run seed:demo` the same day so dates match.
- Use Do Not Disturb; status bar **9:41** if using Simulator.
- No audio required for waitlist autoplay.
