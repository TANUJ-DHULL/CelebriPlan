# CelebriPlan

A celebration and event planning prototype built with HTML, CSS and JavaScript, plus a Node.js HTTP API. Production: https://celebri-plan.vercel.app/

## Run locally

Requires Node.js 24 or later.

```sh
npm ci
npm start
```

Open http://localhost:3000. Set PORT to use another port. The built-in backup works without credentials. For Google Gemini-powered personalised plans and chat, set GEMINI_API_KEY in an ignored .env.local file or Vercel Production environment variables. GEMINI_MODEL defaults to gemini-3.5-flash-lite. Event details and chat messages are sent to Google only by the server; keys never enter frontend files. Restart or redeploy after changing environment variables.

## Validate changes

```sh
npm test
npm run test:coverage
npm run test:e2e
npm audit
```

Browser tests use installed Microsoft Edge on Windows. On Linux/macOS, run `npx playwright install chromium` first. They run an isolated server on port 3100. GitHub Actions installs Chromium and runs API/unit and browser tests on every push and pull request.

The suite checks budget conservation and rounding, malformed and oversized requests, origin restrictions, static file isolation, planner/dashboard workflows, malicious text rendering, navigation, keyboard dialogs, invitation PNG downloads, QR decoding, and automated WCAG A/AA checks across all 11 routes. Automated accessibility checks supplement manual testing; they do not prove full conformance.

## Implementation

- planning.js: shared integer budget allocation for browser and API, without negative rounding remainders.
- security.js: request limits, input validation, response headers and calendar escaping.
- server.js: public asset allowlist and validated planning/vendor/calendar endpoints.
- api/index.js: Vercel serverless adapter. Explicit static/API routes in vercel.json prevent browser code from being treated as a server entrypoint.
- vendor/qrcode.js: local MIT-licensed QR encoder; run `npm run vendor:sync` after upgrading the package.

Planner generation has no artificial wait. The venue canvas initializes only when visited, pauses on other routes/hidden tabs, and respects reduced motion. PDF export uses the browser print/save dialog; invitation cards download as PNGs; copy actions report success only after the clipboard operation succeeds.

## Current product boundaries

Guests, tasks, RSVP responses, expenses and the applied event budget are saved in localStorage on the current device and restored on reload. Clear saved event restores demo data. Corrupt/oversized storage recovers safely; blocked browser storage falls back to session-only mode. Guest CSV import/export supports quoted fields, deduplication and spreadsheet formula neutralisation. This is device-local persistence, not a shared authenticated database. Vendor records are sample data, not a live marketplace. Booking and quotation flows do not contact vendors, reserve venues, process payments or send email. The API returns validated demo receipts and does not retain personal information. The UI describes these limitations instead of claiming a confirmed reservation or sent message.

Calendar links open an editable Google Calendar event. ICS downloads support manual import; there is no OAuth-based automatic synchronization. QR passes encode details; they are not cryptographically signed admission credentials. A shared database, authentication, authorization and real service integrations are required before real bookings or attendee records.

## Security and deployment

The server exposes only explicitly listed frontend assets. Source, repository metadata, environment files and tests are not served. Requests require bounded JSON objects and validated fields; unsupported cross-site origins are rejected. User-controlled text is escaped before entering HTML, and calendar fields use iCalendar escaping. Response headers restrict framing, sniffing and browser permissions. CSP still permits inline handlers/styles used by the existing interface; migrating those to external listeners would allow a stricter policy.

Deploy committed source with `vercel deploy --prod`. Keep .env files, .vercel, node_modules, test reports and coverage out of Git. Frontend JavaScript is publicly downloadable by design; a public repository also exposes source history. These are not encrypted assets.

## Gemini verification

Unit and browser tests use mocked provider responses so CI never consumes an API quota. Tests cover safe output validation, exact budget totals, provider errors, missing keys, escaped model output, chat replies and explicit fallback labels. Requests are time-limited, and in-process concurrency/rate limits bound use per server instance; configure provider-side quotas for a public deployment. A real inference response is required before claiming live Gemini activation.

Provider documentation: https://ai.google.dev/gemini-api/docs/generate-content/structured-output
