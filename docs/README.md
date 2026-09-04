# Publishing notes (not part of the site)

The privacy policy in [`privacy.md`](./privacy.md) is served via **GitHub Pages**
from this `docs/` folder on `main`:

- Repo is **public**; Pages source is **Deploy from a branch → `main` / `/docs`**.
- Live at `https://melodydliu.github.io/sprig/privacy`.
- That URL goes in App Store Connect → App Privacy → Privacy Policy URL.

Any edit to `privacy.md` must be **committed and pushed** — Pages rebuilds from
`main`, not from a local working copy — and takes ~1 minute to go live.
