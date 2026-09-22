# Later asset refresh — scope and capture plan

September 22, 2026. **Planning only.** The hero composition, its draggable windows, responsive screenshot treatment and Images 1–3 references are explicitly deferred. This implementation does not replace those assets. The walkthrough currently uses labeled, simplified sample cards; real captures should replace those cards in a later approved asset pass.

## Capture contract for every replacement

Use an isolated seeded demo organization, never production customer records. Sample operator: “Cedar Detail”; client: Alex Morgan (`alex@example.com`); vehicle: 2021 Toyota Corolla, synthetic plate DEMO001; service: Full Detail, $180. No real home addresses, phone numbers, registration/VIN, API keys, signed portal tokens, account IDs, customer email threads or payment/bank details. Keep business amounts plausible for a new solo detailer. Reset device clock/status bar consistently. Stripe screens must be Sandbox/test mode with test cards. Mask generated account identifiers. Record source commit, app version, platform, capture date and seed recipe alongside each asset.

Export AVIF/WebP plus PNG masters where needed. Intrinsic dimensions, `srcset`/`sizes`, explicit aspect ratio and lazy loading below the fold are required. Aim for ≤150 KB per mobile screenshot, ≤250 KB desktop export, ≤450 KB total initially loaded hero media. Never embed essential copy in an image alone. Give meaningful workflow alt text; mark decorative duplicate images/logos empty-alt. Product text should remain readable at 200% zoom. Motion is opt-in, has pause/replay and static poster fallback, honors reduced motion and never runs a live payment action. Captions/transcripts are required for narration. Don't distort real UI to fit a marketing claim.

## Proposed replacements

### P0 — Hero (deferred composition and responsive redesign)

Current owners: `rinse-landing/src/app/sections/Hero.tsx` and `HeroVisuals.tsx`. Existing code-drawn desktop windows, large metrics and simulated notifications imply an established operations business and are not verified native screenshots. Images 1–3 are references only, not assets to ship automatically.

Capture the actual iOS Jobs list and invoice detail/payment-link action with two to three sample clients and four jobs; include one completed invoice, not large team dispatch or fabricated growth statistics. Capture 393×852 logical points at 3× (1179×2556) and a 430×932 variant (1290×2796). Export art-directed crops at 390/780/1170 px for small screens and 800/1200/1600 px compositions for desktop. The later responsive design must be reviewed at 320, 390, 768, 1280 and 1440 px.

Use static screenshots initially; retain meaningful HTML headline/CTA and avoid draggable-only interactions. Dependency: finalized native Jobs/Invoice UI, stable seeded state, approved composition. Complete when the hero reflects the tested app, crop/legibility and loading budgets pass, and the primary CTA remains visible without implying an App Store listing before approval.

### P0 — Walkthrough visuals

Owner: `rinse-landing/src/app/layout/DemoModal.tsx`. Current sample cards deliberately describe actual supported fields and perform local-only simulation. Replace the visual area, not the accessible user-controlled shell, using real iOS Client/Vehicle, Job creation, Invoice detail and customer invoice web screenshots. Final step should use HTML plan copy from the shared policy, never a screenshot of prices that can become stale.

Capture iOS at 1179×2556; customer invoice web at 390×844 and 1280×900. Export 360/720 px crops for touch and 560/1120 px crops for desktop. Use isolated Alex/Corolla/$180 data. For Stripe, capture a test-mode checkout and annotate it as a sample; do not crop away the test label or represent a simulated payout as real.

Retain interactive local state for sample actions, keyboard arrows, next/back, progress, replay, exit, explicit focus containment/restoration and reduced motion. Images need useful alt descriptions and screen-reader-equivalent text. Dependency: successful native Sandbox purchase is not required for the physical-service step, but real test Connect checkout is. Complete when every step corresponds to a current screen, no action sends data outside the sample, and desktop/touch keyboard tests pass.

### P0 — Obsolete onboarding and plan screenshots

Owners: `rinse-mobile/assets/onboarding/*.png`, `rinse-api/public/onboarding/*`, `rinse-api/public/setup/mockups/*`, especially `rinse-10-plans-trial.png`. Old PWA captures and trial screenshots must not be reused as current product proof. Duplicate `… 2.png` copies are cleanup candidates after reference checks.

Recapture the native Free signup completion, a small Jobs list, Client/Vehicle detail, invoice and actual customer invoice portal. iOS masters 1179×2556; 390/780/1170 px exports. Replace trial captures with Free plan or deliberate Starter upgrade content. Use static media for onboarding; no looping trial countdown. Dependency: final onboarding copy and no-trial flow on device. Complete when no referenced image contains trial, Pro/Scale, obsolete prices or read-only-vault promises and all consumed asset paths are audited.

### P1 — Feature and workflow illustrations

Owners: `rinse-landing/src/app/sections/Workflow.tsx`, `Showcase.tsx`, `Features.tsx`; screenshot export scripts in API/mobile. Many visuals are React/SVG mockups, not files. Old fleet routes, live tech dispatch, AI copilot, automatic VIN capture, multi-location views and unsupported connector graphics are fictional/aspirational; don't present them as functioning integrations. Unused legacy graphics remain source references, not product promises.

Capture native scheduling, invoice sharing, Starter lead pipeline, inventory and a small revenue report; desktop may be shown only for implemented authenticated workflows and labeled as desktop. Capture desktop 1440×1000 and 1024×768; export 480/960/1440 px. Capture native using the common masters and crop to 360/720 px. Use static images or the existing isolated walkthrough, not videos that imply automatic service execution. Sample data: three clients, four jobs, a few supplies and truthful paid/unpaid invoices. Complete when every caption names its platform and plan, data is consistent across steps, text alternatives explain the action and performance budgets pass.

### P1 — Customer payment and payout proof

Owners: customer `/portal/*`, mobile `StripeConnectCard`, marketing workflow payment graphics. Show actual test checkout for the operator account, paid invoice reconciliation, and Stripe payout status separately. “Paid” must not mean “paid out.”

Capture mobile 390×844 and desktop 1280×900; export 390/780 and 640/1280 px. Use test accounts and fictitious bank/card labels only. Static capture with a text explanation is preferred over live embeds. Dependency: configured Connect country/currency and verified test payment/refund/webhook. Complete when the correct connected operator is demonstrable, test labeling is visible, processing cost responsibility is accurately stated and no fake payout date is presented.

### P1 — Ecosystem logos and connecting-line composition

Owner: `rinse-landing/src/app/sections/Ecosystem.tsx`; unused `EcosystemSection.tsx` is a duplicate/reference implementation. Keep the black background, connecting-line feel and requested ecosystem heading. Preserve textual status alongside each logo. Stripe and Google Maps need configuration; QuickBooks/calendar sync are planned. The removed faded “Works with your stack” strip must not return.

Use vetted local SVG logos, 32/48/64 px variants and 2× raster fallback only if necessary; avoid an unpinned `simple-icons@latest` network dependency in the final asset pass. No screenshot data required. Decorative connecting lines are `aria-hidden`; logos with adjacent names use empty alt to avoid duplicate announcements. Dependency: actual integration audit and trademark usage review. Complete when every service has a truthful availability label, unsupported services are omitted or unmistakably planned and no logo is evidence of a functioning integration by itself.

### P2 — Brand and app icon consolidation

Owners: `rinse-mobile/assets/brand/*`, `rinse-mobile/assets/images/*`, `rinse-landing/src/assets/rinse-logo.svg`, both public favicons, API logo/icons. Multiple blue/green/black/white lockups and duplicate icon exports exist. These are brand resources, not product screenshots; don't assume all colors remain approved.

Choose approved SVG masters and document semantic use. Export app icons at platform-required dimensions, 32/48/180/192/512 px web variants and 1024 px app-store master. No personal data. Test dark/light background contrast, sharp edges and favicon appearance. Dependency: brand choice and final bundle/app display identity. Complete when unused duplicates are removed only after reference search, metadata icons agree across surfaces and SVGs carry appropriate accessible labels at use sites.

### P2 — Video, design references and illustrations

Inventory includes generated CSS/canvas/React visuals and reference archives even where no standalone MP4 exists. Design-reference replay frames, third-party screenshots and ZIP design exports are inspiration, not automatically licensed production media. The top-view vehicle image is an inspection illustration, not a captured vehicle.

If a later demo video is approved, record 1080×1920 vertical plus 1920×1080 horizontal, 20–40 seconds, optional playback only, WebM/MP4 with a static WebP poster, captions and transcript. Reuse the common seed. Don't add forced autoplay. Complete when footage matches a release build, subtitles cover all spoken meaning, no sensitive information appears and media is loaded only on request.

## Existing file inventory

The companion `ASSET_INVENTORY.md` lists repository-owned media files in runtime asset/public directories and summarizes reference-only directories. Code-drawn product representations are inventoried above because they do not appear in a file extension search. No assets have been replaced in the deferred hero/asset-refresh pass.
