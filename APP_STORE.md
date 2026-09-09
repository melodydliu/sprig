# Sprigbook → App Store (public release, v1.0)

Everything for the first public submission. The TestFlight path is in
[`TESTFLIGHT.md`](./TESTFLIGHT.md); this picks up from "already on TestFlight".

Legend: **[you]** = you do it (Apple account / App Store Connect / a device).
Anything not marked is already done in the repo.

---

## 0. Pre-flight (repo)

- [x] `app.json` → `ios.supportsTablet: false` (iPhone-only; no iPad screenshots needed)
- [x] `app.json` → `ITSAppUsesNonExemptEncryption: false` (no export-compliance paperwork)
- [x] Privacy policy + support page written and wired for GitHub Pages (`docs/`)
- [x] Availability feature merged to `main`
- [ ] **[you]** `git checkout main && git pull && npm run typecheck && npm test && npm run lint` — all green
- [ ] **[you]** Enable/confirm GitHub Pages: repo **Settings → Pages → Deploy from a branch → `main` / `/docs`**, then open all three and confirm they render:
  - <https://melodydliu.github.io/sprig/>
  - <https://melodydliu.github.io/sprig/privacy>
  - <https://melodydliu.github.io/sprig/support>

---

## 1. Build & upload the release binary

From the project root:

```bash
npm run build:ios      # eas build --platform ios --profile production   (~15–25 min)
npm run submit:ios     # eas submit --platform ios --latest
```

- Builds current `main`, so the availability feature is in the binary (not just the OTA channel).
- `supportsTablet: false` takes effect here — EAS regenerates the native project from `app.json`.
- If prompted for the App Store Connect API key on submit → **"Let EAS handle it."**
- **[you]** Wait until the build shows as **"Ready to Submit"** (finished *processing*) in
  App Store Connect → your app → **TestFlight** tab before doing Part 3.
- **[you]** Optional but recommended: install this exact build from TestFlight and click
  through it once on your phone.

---

## 2. Create the demo account for Apple review  **[you]**

The app requires sign-in with no guest mode, so **Apple will reject without working
demo credentials** (Guideline 2.1). Do this before submitting:

1. In the app (TestFlight build) or via Supabase, create an account with throwaway
   credentials you're willing to put in App Store Connect, e.g.
   `applereview@theflowerbunny.com` / a strong password.
2. Signed in as that account, add **3–4 finds** with photos, notes, a location, and
   different availability levels, so the reviewer sees populated list / map / detail
   screens.
3. Confirm **Settings → Delete account** is visible and works (Guideline 5.1.1(v)
   requires in-app account deletion — keep it reachable; don't hide it for the demo).
4. Keep the credentials handy for Part 3, step 8.

---

## 3. App Store Connect — the listing  **[you]**

<https://appstoreconnect.apple.com> → **My Apps** → your app. The record already
exists from TestFlight. Fill in each section below.

### 3.1 App Information

| Field | Value |
|---|---|
| Name | `Sprigbook: Foraging Journal` (26 chars; if taken, try `Sprigbook — Foraging Log`) |
| Subtitle | `Spot it, log it, find it again` |
| Primary category | **Lifestyle** |
| Secondary category | **Reference** (optional) |
| Content Rights | You own or are licensed for all content → check the box |
| Age Rating | Start questionnaire, answer **None** to everything → **4+** |

### 3.2 Pricing and Availability

- Price: **Free**
- Availability: all territories (or start with your own country and expand later)

### 3.3 App Privacy  (left sidebar → **App Privacy** → Get Started)

"Do you or your partners collect data from this app?" → **Yes**. Then declare
exactly these, all **Linked to the user**, purpose **App Functionality**, and
**not** used for tracking:

| Data type (Apple's category) | Notes |
|---|---|
| Contact Info → **Email Address** | account sign-in / password reset |
| User Content → **Photos or Videos** | the photos on a find |
| User Content → **Other User Content** | find names, notes, tags |
| Location → **Precise Location** | the point you attach to a find (no background use) |

Everything else (identifiers, usage data, diagnostics, purchases, contacts,
browsing, search history) → **not collected**.

Final question — "Is data used to track you?" → **No**.

Privacy Policy URL: `https://melodydliu.github.io/sprig/privacy`

### 3.4 Prepare for Submission  (the version page, "1.0")

**Promotional text** (≤170 chars, editable later without review):

```
Spot a plant, capture it in seconds, and find it again by list or map. A private, offline-first foraging journal — no ads, no tracking.
```

**Description** (≤4000 chars):

```
Sprigbook is a personal journal for foragers. When you spot something worth coming back for — a stand of wild fennel, a heavy plum branch, a patch of elderflower — you capture it in a few seconds and find it again later by list or map.

WHAT YOU CAN DO
• Snap a photo the moment you see a plant, straight from the app
• Note the name, category, colours, and how much there is to forage
• Add your own tags and free-form notes
• Tag each find with its location and see everything on a map
• Filter and search your journal by category, colour, availability, tag, or date
• Mark favourites for the spots you return to most

YOURS, AND PRIVATE
• Works fully offline — every find is saved on your device first
• Optional cloud backup so you can restore your journal on a new phone
• Your data is protected per-account and is never sold or shared
• No ads, no analytics, no tracking

Sprigbook keeps a light footprint: it only ever records the location you choose to attach to a find, never your movements in the background.

Happy foraging.
```

**Keywords** (≤100 chars, comma-separated, no spaces — omits words already in the name/subtitle):

```
forage,plant,botany,wildcrafting,flowers,herbalism,nature,map,log,foraged,herbs,wildflowers
```

**URLs**

| Field | Value |
|---|---|
| Support URL | `https://melodydliu.github.io/sprig/support` |
| Marketing URL (optional) | `https://melodydliu.github.io/sprig/` |

**Copyright:** `2026 Melody Liu`

**Version:** `1.0.0`

### 3.5 Screenshots  (Prepare for Submission page)

One set is enough — App Store Connect down-scales it to the smaller sizes.
Use an **iPhone Pro Max** simulator:

- **6.9-inch** — 1320 × 2868 px, or **6.5-inch** — 1284 × 2778 px.

Capture with the app running on that simulator:

```bash
xcrun simctl io booted screenshot ~/Desktop/sprigbook-01.png
```

Suggested 5, in order (using the demo account's data so they look real):

1. Journal list, a few finds visible
2. A find's detail — photo, availability pill, mini-map
3. Map view with several pins
4. Capture / new-find screen
5. Filter sheet open (category / colour / availability)

Plain screenshots are fine; captions/overlays are optional.

### 3.6 App Review Information

- **Sign-In required:** Yes → enter the demo email + password from Part 2.
- **Notes:**

```
Sprigbook is a personal foraging journal. All content (photos, notes, locations) is created by the user. The app does not track location in the background — it only stores the point the user attaches to a find.

An account is required. The demo account above already has sample finds so you can see the populated list, map, and find-detail screens without adding data. Account deletion is available in-app at Settings > Delete account.

Contact: melody@theflowerbunny.com
```

- Contact first/last name, phone, email: your details.

### 3.7 Version Release

- Choose **Manually release this version** (you flip the switch after approval)
  or **Automatically release**.

### 3.8 Submit

- **Build:** select the processed build from Part 1.
- **Export Compliance:** with `ITSAppUsesNonExemptEncryption: false` already set,
  answer **No** if asked → no documentation needed.
- **Advertising Identifier (IDFA):** **No** (no ad SDKs).
- Click **Add for Review** → **Submit for Review**.

---

## 4. After submitting

- Status goes **Waiting for Review → In Review → Pending Developer Release / Ready
  for Sale**. Usually **24–48 h**.
- Watch email + App Store Connect for a rejection. Replies happen in the
  **Resolution Center**; metadata-only fixes don't need a new build.
- Most likely snags for this app: missing/according demo account (Part 2),
  screenshots that don't match the current UI, or a Support/Privacy URL that
  404s. All are pre-checked above.
- Once **Pending Developer Release**, click **Release** when you're ready.

---

## 5. Shipping updates after 1.0

- **JS/TS-only change** (no new native dep, no `app.json` native change):

  ```bash
  npx eas update --channel production --platform ios --message "…"
  ```

  Applies on a user's phone after they open, then fully close and reopen the app.
  Always scope `--platform ios` (web export is broken in this project).

- **Native change** (native dep, permission, icon, `app.json` `ios`/`plugins`):

  ```bash
  npm run build:ios && npm run submit:ios
  ```

  then bump `expo.version` in `app.json` for a user-visible version, add "What's
  New" text in App Store Connect, and submit that build for review.

- Keep the privacy policy's "Last updated" date in step with any real change to
  what the app collects.
