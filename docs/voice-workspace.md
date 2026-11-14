# Voice workspace update

Voice lives in `public/voice.html`, with same-origin API routing and voice endpoints in `public/_worker.js`. The org repository is `Aaruni-Tech/oss-aaruni-payroll`. Its `main` branch contains newer Voice features than the default `master`. A matching older copy exists in `rupeshtiwari/my-aaruni`. Confirm the connected Cloudflare production branch before merging or deploying; the live HTML differs from both default-branch snapshots.

This update preserves the existing voice, cloning, training, dictionaries and API tools. It adds desktop workspace navigation, mobile layout improvements, the Aaruni Voice logo, local script recovery and visible synthesis failure feedback. Drafts are saved in this browser's local storage only; shared-device users should clear their script after use.

## Repository recommendation

Use one private `Aaruni-Tech/aarunicloud` monorepo for Voice, Storage, Compute, shared auth/billing, and common UI. Give services distinct folders and independent deployment configurations. Use path filters so a Voice change does not build Storage or Compute. Keep the public SDK in `aarunicloud-sdk`.

Separate HR/payroll from the cloud platform in a planned migration. Move the complete service dependencies and secrets/bindings configuration, then verify staging, DNS and rollback before switching production. Do not copy just this HTML page: Voice depends on the shared worker, account services, voice assets and workstation integration.

Split a service into its own repository when it needs separate access control, ownership or release cadence. Multiple repositories alone do not reduce Actions cost. Local validation, dependency caching, path filters, cancellation of superseded runs, and avoiding duplicated push/PR jobs do.

## Validation

Serve `public` locally. Check desktop and 390/768/1024px widths, navigation, mobile settings and dictionaries, draft reload, blocked storage, empty scripts, and synthesis failure feedback. Mocked endpoints verify UI behavior, not live model quality, billing, training, cloning or production credentials. No production audio generation or payment was initiated.
