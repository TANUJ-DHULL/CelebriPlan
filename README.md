# CelebriPlan

A celebration and event planning prototype built with HTML, CSS and JavaScript, plus a Node.js HTTP API. Production: https://celebri-plan.vercel.app/

## Run locally

Requires Node.js 24 or later.

```sh
npm ci
npm start
```

Open http://localhost:3000. Set PORT to use another port. No API key is required: planning and chatbot suggestions use deterministic rules and templates, not a generative AI service.

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

Guests, tasks, RSVP responses and expenses live in the current browser session and reset on reload. Vendor records are sample data, not a live marketplace. Booking and quotation flows do not contact vendors, reserve venues, process payments or send email. The API returns validated demo receipts and does not retain personal information. The UI describes these limitations instead of claiming a confirmed reservation or sent message.

Calendar links open an editable Google Calendar event. ICS downloads support manual import; there is no OAuth-based automatic synchronization. QR passes encode details; they are not cryptographically signed admission credentials. A shared database, authentication, authorization and real service integrations are required before real bookings or attendee records.

## Security and deployment

The server exposes only explicitly listed frontend assets. Source, repository metadata, environment files and tests are not served. Requests require bounded JSON objects and validated fields; unsupported cross-site origins are rejected. User-controlled text is escaped before entering HTML, and calendar fields use iCalendar escaping. Response headers restrict framing, sniffing and browser permissions. CSP still permits inline handlers/styles used by the existing interface; migrating those to external listeners would allow a stricter policy.

Deploy committed source with `vercel deploy --prod`. Keep .env files, .vercel, node_modules, test reports and coverage out of Git. Frontend JavaScript is publicly downloadable by design; a public repository also exposes source history. These are not encrypted assets.
