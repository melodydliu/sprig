# Sprig → TestFlight

Step-by-step for the first build. `eas.json` and the app icon are already in the
repo. Everything below is run from the project root.

You need: the Apple Developer account (done) and a free **Expo account**
(sign up at <https://expo.dev>).

---

## 1. One-time setup

```bash
npm install -g eas-cli      # or use `npx eas-cli@latest` in place of `eas` below
eas login                   # your Expo account
eas init                    # creates the EAS project, writes projectId + owner into app.json
```

Commit the `app.json` change `eas init` makes.

## 2. Create the App Store Connect record

<https://appstoreconnect.apple.com> → **My Apps** → **+** → **New App**

- Platform: **iOS**
- Name: **Sprig** — if that exact name is taken App-Store-wide, try `Sprig — Foraging Journal`
- Primary language: **English (U.S.)**
- Bundle ID: **com.sprig.app** — if it's not in the dropdown, let step 3 register
  it (EAS offers to), or add it manually at
  developer.apple.com → Certificates, IDs & Profiles → Identifiers → **+** → App IDs
- SKU: any unique string, e.g. `sprig-001`
- User Access: Full Access

## 3. Build

```bash
npm run build:ios           # = eas build --platform ios --profile production
```

First run prompts:
- Log in to your Apple account → **let EAS manage credentials** (yes) — it
  creates the distribution certificate + provisioning profile for you.
- Register `com.sprig.app` if it asks.
- Set the initial version → accept **1.0.0**, build **1**.

The build runs on Expo's servers (~15–25 min, may queue on the free plan). You
get a link to watch it.

## 4. Submit to TestFlight

```bash
npm run submit:ios          # = eas submit --platform ios --latest
```

- For the App Store Connect API key, choose **"Let EAS handle it"** — it creates
  one under App Store Connect → Users and Access → Integrations.
- Upload takes a few minutes; Apple then processes the build (~5–20 min).

## 5. Install it

App Store Connect → your app → **TestFlight** tab:

- When the build finishes processing it shows under **iOS Builds**.
- If asked the **Export Compliance** question, answer **No** (Sprig only uses
  standard HTTPS; `ITSAppUsesNonExemptEncryption: false` is already set).
- **Internal Testing** → add yourself (your Apple ID) → attach the build.
- On your iPhone: install **TestFlight** from the App Store → open it → Sprig
  appears → **Install**.

## 6. App privacy (for the record)

App Store Connect → your app → **App Privacy**:
- Privacy Policy URL: `https://melodydliu.github.io/sprig/privacy`
- Data collected: **Email address** (account), **Photos**, **Coarse/Precise
  Location**, **Other User Content** (notes) — all "linked to you", "app
  functionality", **not** used for tracking.

---

## Sharing with friends (later)

1. **Custom email first.** Supabase's built-in mailer is rate-limited to a few
   per hour — sign-up confirmation and password reset will be flaky. Add a free
   **Resend** or **AWS SES** account (~10 min) and paste its SMTP settings into
   Supabase → Authentication → Emails → SMTP Settings.
2. TestFlight → **External Testing** → new group → add emails or enable the
   public link. The first external build needs Apple review (~1 day) and a short
   "what to test" note.

## Keeping the build alive

TestFlight builds expire 90 days after upload. To refresh:

```bash
npm run build:ios && npm run submit:ios
```

`autoIncrement` bumps the build number automatically.

## Notes

- `eas.json`'s `production.env` holds the Supabase URL + **publishable** key.
  These are safe to commit / ship — every table has row-level security, so the
  key only ever reaches the signed-in user's own rows. Never put the Supabase
  **service role** key here.
- The repo is public, so anyone can build it, but they'd be pointing at your
  Supabase project with open sign-up. If that becomes a problem, disable open
  sign-up in Supabase and use invite-only.
