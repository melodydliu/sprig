# Publishing the privacy policy

App Store Connect (and TestFlight external testing) needs a public URL for
[`privacy.md`](./privacy.md). Two zero-cost options:

## Option A — GitHub Pages (recommended)

1. Push this `docs/` folder (already in the repo).
2. GitHub repo → **Settings → Pages** → Source: **Deploy from a branch** →
   Branch: `main`, folder: **/docs** → Save.
3. After a minute the policy is live at
   `https://melodydliu.github.io/sprig/privacy` (GitHub renders `privacy.md`).
4. Use that URL in App Store Connect → App Privacy → Privacy Policy URL.

The repo is private; GitHub Pages will still serve the built site publicly, which
is what the store needs. If you'd rather not expose anything else, move
`privacy.md` to its own tiny public repo instead.

## Option B — a public Gist or Notion page

Paste the contents of `privacy.md` into a public GitHub Gist or a shared Notion
page and use that link. Less tidy, but works.

## Before you publish

Edit `privacy.md` and replace `CONTACT_EMAIL_PLACEHOLDER` with the email address
you want listed.
