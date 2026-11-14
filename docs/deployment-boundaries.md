# Aaruni Tech portfolio and deployment boundaries

## Decision

Keep Aaruni Cloud under `Aaruni-Tech`. Separate code and deployments before considering a second organization. Reconsider a separate organization only for independent ownership, administrators, billing, or contractual requirements.

## Source and intended destinations

| Product | Destination repository | Intended domains | Data boundary |
| --- | --- | --- | --- |
| Corporate site and inquiry intake | `Aaruni-Tech/aarunitech-web` | `aarunitech.com`, `www.aarunitech.com` | Dedicated corporate inquiries D1; no payroll binding |
| Cloud web, console, API | `Aaruni-Tech/aarunicloud-platform` | `aarunicloud.com`, `console.aarunicloud.com`, `api.aarunicloud.com` | Dedicated Cloud D1, storage and credentials |
| Staff portal | existing `oss-aaruni-payroll` | `my.aarunitech.com` | Existing payroll D1; keep staff assets here |
| Cloud clients | existing `aarunicloud-sdk` | SDK source and packages | No production credentials |
| Cloud Assistant | existing private `aarunicloud-assistant` | Deployment not verified | Preserve independent component and private adapters |
| HR backend/mobile | existing `oss-horilla-hr`, `oss-horilla-hr-mobile` | Existing installations | Preserve upstream license and attribution |
| Ecommerce storefront | existing `aaruni-tech.github.io` | Hosting and business status unconfirmed | Keep separate; do not archive or redirect without a business decision |
| Syllovo | `syllovo/syllovo-studio` referenced by Assistant documentation | `syllovo.com` referenced by site | Ownership, hosting and production integration require verification; no changes made |

New repositories are private staging destinations. Their existence does not mean production domains have moved. Git history remains in the source repository; provenance is recorded in each destination. The exporter copies an allowlist, never the whole payroll repository.

## Build and test

Use Node.js 24 or later, no npm dependencies required:

```sh
npm run build
npm run build:corporate
npm run build:cloud
npm run build:payroll
npm test
```

The combined `public/_worker.js` remains available for the existing deployment. `src/build_worker.mjs` now resolves paths from its own location. Source was reconciled from the checked-in runtime first because the previous source files lagged behind that runtime. The catalog in `src/service_catalog.mjs` feeds the API, interactive page, static service page and JSON catalog.

Isolated outputs are in `dist/corporate`, `dist/cloud`, and `dist/payroll`. Public corporate/Cloud builds exclude staff photos, ID cards, payroll documents and mockup pages. Corporate and Cloud workers use native DB bindings only; they never use the legacy payroll REST fallback or its in-memory seeded state. The staff build still contains legacy payroll behavior and requires its own access review.

## Cloudflare cutover sequence — not executed

1. Inventory current Pages/Workers projects, custom domains, routes, bindings, encrypted variables and build hooks. Record the current deployed commit and rollback deployment ID. Do not print secrets in build logs.
2. Create separate staging Pages projects for the corporate and Cloud repositories. Set build command `npm run build`, output `dist/corporate` or `dist/cloud`. Do not attach production domains yet.
3. Provision dedicated D1 databases. Apply `migrations/inquiries.sql` only to the new corporate database and the dedicated Cloud database for their inquiry endpoints. Inventory and migrate existing Cloud tables, indexes, provider connectors and storage from the current deployment before enabling authenticated Cloud workloads. The inquiry migration is not a complete Cloud schema.
4. Bind corporate `DB` only to the new inquiry database. Bind Cloud `DB` and required storage/provider integrations only to Cloud resources. Rotate/copy secrets through the Cloudflare dashboard or secret tooling, never through Git. Do not reuse payroll administrator credentials.
5. Before enabling production authentication, replace source-managed owner authentication records with managed secrets or identity configuration, verify rate limiting, tenant isolation, consent handling, provider credentials, backups and restore. Legacy source behavior is not a completed security assessment.
6. Test staging: corporate contact form storage and honest failure behavior; all 12 catalog entries; console sign-in; subscriber/admin separation; real voice synthesis and consent; storage upload/download/range; worker heartbeat and approved job execution. Record results without customer data. A successful `/v1/status` is not sufficient.
7. Confirm processing/backup regions, subprocessors, retention/deletion, pricing and SLA/support terms with the owner. Complete actual legal policies before public production onboarding. Replace “unverified” catalog states only with dated evidence.
8. Switch domains one product at a time, preserving the existing deployment for rollback. Re-test TLS, canonical URLs, auth callbacks, CORS, billing webhooks, SDK archives and installed mobile application links.
9. Only after successful cutover, remove migrated Cloud/corporate assets and routes from payroll. Do not delete original source or alter the ecommerce storefront during staging.

## Required owner information

Cloudflare account/project access; current domain-to-project map; Cloud DB/schema and storage map; live versus pilot/planned service decisions; e-commerce business status; legal entity spelling and approved terms; Syllovo production repository/hosting confirmation. None of these can be inferred from marketing copy.
