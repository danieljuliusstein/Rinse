# Google/Apple sign-in + email verification — admin setup

The code for Google/Apple sign-in and email verification is done and deployed
(see `rinse-desk/src/lib/auth.ts`, `rinse-desk/src/pages/AuthPage.tsx`,
`rinse-desk/src/pages/VerifyEmailPage.tsx`, `rinse-api/src/lib/server/signup.ts`).
None of it can go live until the steps below are done in three external
dashboards. Nobody but an account owner can do this — it requires accounts,
payment, and domain-verification steps outside the repo.

Do these once, in order. Total time: ~45–60 min if you already have a Google
account and a paid Apple Developer membership; Apple's domain verification can
take longer if DNS propagation is slow.

## 0. What you're configuring

- **PocketBase** (`https://detailing-pb.fly.dev`) is the OAuth2 *relying
  party* — Google/Apple redirect back to PocketBase's own domain, never to
  `desk.rinsehq.com` directly. This is the single most common mistake: the
  redirect URI you register with Google/Apple is always
  `https://detailing-pb.fly.dev/api/oauth2-redirect`.
- The PocketBase **admin dashboard** is at `https://detailing-pb.fly.dev/_/`.
  You need a superuser login for it — the same one `PB_ADMIN_EMAIL` /
  `PB_ADMIN_PASSWORD` (set in `rinse-api`'s environment) point at.

---

## 1. Google OAuth2

1. Go to [Google Cloud Console](https://console.cloud.google.com/) → select
   or create a project for Rinse.
2. **APIs & Services → OAuth consent screen**: set it up (External, unless
   you're using Google Workspace internally). App name "Rinse", support
   email, add the `rinsehq.com` domain as an authorized domain.
3. **APIs & Services → Credentials → Create Credentials → OAuth client ID**:
   - Application type: **Web application**
   - Authorized redirect URIs: add exactly
     `https://detailing-pb.fly.dev/api/oauth2-redirect`
   - Save. Copy the **Client ID** and **Client Secret** shown — you'll paste
     these into PocketBase in step 3.
4. If the consent screen is in "Testing" mode, add the emails you'll test
   with, or publish the app (may require Google's verification review if you
   request sensitive scopes — the default `email`/`profile` scopes usually
   don't).

## 2. Apple "Sign in with Apple"

Requires a paid [Apple Developer Program](https://developer.apple.com/programs/)
membership ($99/yr).

1. **Certificates, Identifiers & Profiles → Identifiers → App IDs**: if you
   don't already have one for Rinse, create one and enable the
   **Sign In with Apple** capability on it.
2. **Identifiers → Services IDs → +**: create a new Services ID (e.g.
   `com.rinsehq.desk.signin`). This Services ID string is the **Client ID**
   PocketBase will use.
   - Enable **Sign In with Apple**, click **Configure**:
     - Primary App ID: the App ID from step 1.
     - Domains and Subdomains: `rinsehq.com`
     - Return URLs: `https://detailing-pb.fly.dev/api/oauth2-redirect`
   - Apple will ask you to verify domain ownership — download the
     verification file it gives you and host it at the exact path Apple
     specifies on `rinsehq.com` (this needs whoever manages that domain's
     hosting/DNS).
3. **Keys → +**: create a new key, enable **Sign In with Apple**, associate
   it with the App ID from step 1. Download the `.p8` private key file
   **immediately** — Apple only lets you download it once. Note the **Key
   ID** shown on this page, and your **Team ID** (top-right of the Apple
   Developer site, or Membership page).
4. You now have four things PocketBase needs: **Services ID** (Client ID),
   **Team ID**, **Key ID**, and the **.p8 private key** contents.

## 3. PocketBase admin dashboard

1. Log in at `https://detailing-pb.fly.dev/_/` with the superuser account.
2. Go to **Collections → users → Edit collection (gear icon) → Options** tab
   → **OAuth2** section (exact tab layout varies slightly by PocketBase
   version — look for "OAuth2 providers").
3. Enable OAuth2, then add a provider:
   - **Google**: paste the Client ID and Client Secret from step 1.
   - **Apple**: paste the Services ID as Client ID, and the Team ID / Key ID
     / private key content into their respective fields (PocketBase builds
     the signed client secret JWT internally and re-signs it as it expires).
4. Save. Verify it worked:
   ```bash
   curl 'https://detailing-pb.fly.dev/api/collections/users/auth-methods?fields=oauth2'
   ```
   should now show `"oauth2":{"enabled":true,"providers":[{"name":"google",...},{"name":"apple",...}]}`
   instead of `"providers":[]`. Once that's true, the "Continue with
   Google"/"Continue with Apple" buttons on `desk.rinsehq.com` work
   immediately — no further code changes needed.

   (You don't need to touch the "auto-verify OAuth2 accounts" toggle if
   there is one — `rinse-api` already force-sets `verified: true` on any
   account it provisions through Google/Apple, regardless of that setting.)

## 4. Email verification (SMTP + template)

Email/password signups are created **unverified**
(`rinse-api/src/lib/server/signup.ts`) and `rinse-api` calls PocketBase's
`requestVerification` right after creating the account. That call silently
does nothing useful if PocketBase has no mail sender configured, so:

1. In the admin dashboard: **Settings → Mail settings**. Fill in your SMTP
   host/port/username/password and a sender name/address (e.g.
   `Rinse <hello@rinsehq.com>`). Send yourself a test email if the UI offers
   one.
2. **Settings → Application** (or wherever the "App URL" field lives in your
   PocketBase version): set it to `https://desk.rinsehq.com` — this is the
   `{APP_URL}` placeholder PocketBase substitutes into email templates.
3. **Collections → users → Options → Email templates → Verification**: the
   default template links to PocketBase's own admin UI
   (`{APP_URL}/_/#/auth/confirm-verification/{TOKEN}`). Change that link's
   `href` to point at rinse-desk instead:
   ```
   {APP_URL}/?verify_token={TOKEN}
   ```
   `rinse-desk` already handles that exact query param (`App.tsx`'s `Gate`
   checks for `?verify_token=` on load and shows a confirm/fail screen) —
   don't change the param name without updating the code to match.
4. Test end-to-end: sign up with a real email address on
   `https://desk.rinsehq.com`, confirm you land on the "Verify your email"
   screen (and are blocked from the dashboard — this is a hard gate, by
   design), receive the email, click the link, and land on "Email verified."

## Notes

- Google/Apple accounts are marked verified immediately and skip all of the
  above verification-email flow — see the "Google and Apple already verify
  the email" decision this doc reflects.
- If you rotate the Apple private key or Google client secret later, redo
  step 3 with the new values — nothing else needs to change.
- None of steps 1–4 require touching this repo. If the buttons/flow don't
  work after completing them, the first thing to check is the `curl`
  command in step 3 and the PocketBase mail-settings test-send in step 4.
