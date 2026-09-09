# Publishing notes (not part of the site)

The pages in this `docs/` folder are served via **GitHub Pages** from `main`:

- Repo is **public**; Pages source is **Deploy from a branch → `main` / `/docs`**.
- Live pages:
  - `https://melodydliu.github.io/sprig/`         → landing (`index.md`)
  - `https://melodydliu.github.io/sprig/privacy`  → `privacy.md`
  - `https://melodydliu.github.io/sprig/support`  → `support.md`
- App Store Connect uses:
  - Privacy Policy URL → `…/sprig/privacy`
  - Support URL        → `…/sprig/support`
  - Marketing URL (optional) → `…/sprig/`

Any edit here must be **committed and pushed** — Pages rebuilds from `main`, not
from a local working copy — and takes ~1 minute to go live. After pushing, open
each URL in a browser and confirm it renders before pointing App Store Connect at
it.
