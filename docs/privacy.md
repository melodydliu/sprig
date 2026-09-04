# Sprig — Privacy Policy

_Last updated: 4 September 2026_

Sprig is a personal foraging journal. This policy explains what the app stores,
where it goes, and the choices you have. It is written to be read, not to cover
a company's back — Sprig is a small personal project.

> **Before publishing:** replace `CONTACT_EMAIL_PLACEHOLDER` below with the email
> address you want people to reach you at, and host this file at a public URL
> (see `docs/README.md`). App Store Connect requires that URL.

## What Sprig stores

Everything in Sprig is data **you** enter or capture:

- **Your account:** the email address you sign up with, used only to sign you in
  and to recover your password.
- **Your finds:** the name, category, colours, tags, and notes you write for each
  plant; the photos you take or choose; and the location you attach to a find.
- **Preferences:** small settings like miles vs. kilometres.

Sprig does **not** collect analytics, advertising identifiers, device
fingerprints, contacts, or any usage tracking. It has no third-party ad or
analytics SDKs. Location is only ever the point you deliberately attach to a
find — the app never tracks your location in the background.

## Where your data lives

- **On your device:** finds and photos are stored locally first (an on-device
  database and image files). The app works fully offline.
- **In your private cloud backup:** when you are signed in, your finds and photos
  are copied to a private [Supabase](https://supabase.com) project so you can
  restore them on a new device. Every record is protected by row-level security
  keyed to your account — no other Sprig user can read your data, and photos are
  kept in a private storage bucket reachable only with a short-lived signed link.

## Who else is involved

- **Supabase** hosts the database, authentication, and photo storage for the
  cloud backup. Their [privacy policy](https://supabase.com/privacy).
- **Apple** distributes the app through TestFlight and the App Store and may
  collect its own diagnostics per your device settings.

Your data is never sold, and it is not shared with anyone else.

## Deleting your data

- **A single find:** delete it in the app. It is removed from your device and,
  on the next sync, from the cloud (a deletion marker is kept briefly so other
  devices you use also remove it).
- **Everything:** Settings → Delete account permanently removes all of your
  finds, photos, notes, and profile from your device and from the cloud.

## Children

Sprig is not directed at children under 13 and does not knowingly collect their
data.

## Changes

If this policy changes, the "last updated" date above changes with it.

## Contact

Questions about your data: **CONTACT_EMAIL_PLACEHOLDER**
