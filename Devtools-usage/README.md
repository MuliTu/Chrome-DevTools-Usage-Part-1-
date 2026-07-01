# DevTools Playground

A Vite + React app that teaches Chrome DevTools and React DevTools skills through a fake e-commerce checkout flow ("TechGear"). Buying a $49 pair of headphones is gated behind a sequence of DevTools challenges that must be solved in order, plus a set of standalone React DevTools exercises.

## Running it

```bash
npm install
npm run dev
```

This starts both the Express API (`server/index.js`, port 3001) and the Vite dev server (port 5174) together via `concurrently`. The Vite dev server proxies `/api/*` and `/analytics/*` requests to the API server.

Other scripts:

```bash
npm run server   # API server only
npm run client   # Vite dev server only
npm run build    # production build
npm run lint     # oxlint
```

## Checkout challenges (Network panel)

1. **Override JSON Response** — `/api/product` returns `price: 999` instead of `49`. Fix it with Local Overrides.
2. **Block Tracker Script** — `/analytics/tracker.js` sets `window.__techGearAds.blocking = true` and disables Buy Now. Block the request URL.
3. **Per-Request Throttling** — checkout measures the RTT of `/api/ping` server-side and rejects anything under 1000ms. Use Chrome's per-request throttling (right-click a request → **Throttle request**, Chrome 144+) to slow down *only* `/api/ping`, instead of throttling the whole page.
4. **Override Response Headers** — `/api/checkout` is missing the `test-header-value: 1` response header the client expects. Inject it with Override headers.
5. **Copy as cURL** — `/api/checkout-broken` always returns 422 with a body the UI never surfaces. Replay it in a terminal to read the real error.
6. **Logpoint** — add a Logpoint in Sources to trace the discount calculation without editing code.

Scenarios 1–4 auto-complete in the UI the moment the app detects the condition is met (correct price loaded, tracker blocked, RTT gate cleared, order placed). Scenarios 5 and 6 are manual since they can't be detected from JS.

## React DevTools challenges (Debug Lab)

Scenarios 7–12 cover Suspense fallbacks, Error Boundaries, live state editing, the "highlight updates on render" overlay, the Profiler, and Strict Mode's double-invoke behavior — exercised via a separate set of components in the same app.

## Project structure

```
server/index.js          Express API — all the bugs/gates live here
src/api/client.js         fetch wrappers, including the Scenario 3/4 gate checks
src/data/scenarios.js     scenario copy, hints, and tool descriptions
src/components/           ProductSection, Challenge, and the React DevTools exercises
```
