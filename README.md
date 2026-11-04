# Kasatria 3D Data Visualization

Interactive periodic-table-style visualization built with React, Vite, Three.js CSS3DRenderer, TWEEN, Hono, and Google Identity Services.

The app loads the supplied Google Sheet through a protected Cloudflare Worker endpoint and renders up to 200 records as 3D cards. Access is gated behind Google sign-in.

## Features

- Google sign-in with a verified server-side session cookie
- Protected data endpoint backed by the Google Sheets API
- Cards show country, age, photo, name, and interest
- Net worth determines the card color and remains available in the card tooltip:
  - Red: below $100K
  - Yellow-green: above $100K
  - Green: above $200K
- Four animated arrangements:
  - Table: 20 columns x 10 rows
  - Sphere
  - Double helix
  - Grid: 5 x 4 x 10
- Trackball camera controls
- Account controls in the scene header with avatar fallback, session state, and sign out
- Loading, error, and retry states
- Graceful photo fallback with initials
- Responsive controls

## Run locally

```bash
npm install
npm run dev
```

Open the local URL printed by Vite, normally `http://localhost:5173`.

## Build and test

```bash
npm test
npm run lint
npm run build
npm run preview
```

## Environment

Client-side variables live in `.env`:

```text
VITE_GOOGLE_CLIENT_ID=...
```

Worker secrets live in `.dev.vars` for local development and in Cloudflare for deployment:

```text
GOOGLE_CLIENT_ID=...
SESSION_SECRET=...
GOOGLE_SHEET_ID=...
GOOGLE_SHEET_NAME=...
GOOGLE_SERVICE_ACCOUNT_JSON_BASE64=...
```

`.env` and `.dev.vars*` are ignored by git. Never commit the service account key or the OAuth client secret.

## API

| Method | Route | Description |
| --- | --- | --- |
| `GET` | `/api/health` | Worker health check |
| `POST` | `/api/auth/google` | Verify a Google ID token and create a session |
| `GET` | `/api/auth/me` | Return the current session user |
| `POST` | `/api/auth/logout` | Clear the session cookie |
| `GET` | `/api/people` | Return normalized Google Sheet records (protected) |

All mutating/authenticated routes use the `kasatria_session` HttpOnly cookie.

## Data source

The worker reads the sheet configured by `GOOGLE_SHEET_ID` and `GOOGLE_SHEET_NAME` through the Google Sheets API using a service account.

The expected columns are:

```text
Name, Photo, Age, Country, Interest, Net Worth
```

## Project structure

```text
src/
  App.jsx                     Session/data loading and application states
  config.js                   Thresholds, camera, and layout constants
  components/
    PeriodicTable.jsx         Three.js scene, controls, header, and layout nav
    GoogleLogin.jsx           Google Identity Services sign-in
    UserAccount.jsx           Avatar, user meta, and sign out control
  lib/
    api.js                    Backend request helpers
    sheet.js                  CSV parsing, currency, and tier logic
    layouts.js                Table, sphere, double-helix, and grid positions
    tile.js                   DOM card creation and initials helper
worker/
  index.js                    Hono app, auth routes, and session handling
  services/googleSheets.js    Service-account auth and Sheets API access
```

## Deployment

```bash
npm run deploy
```

This builds the client and deploys the worker with `wrangler`. Configure the worker secrets with `wrangler secret put` before deploying.
