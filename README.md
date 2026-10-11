# LLLRouter

Personal, single-user build of 9router: a local AI gateway with a dashboard. It routes
OpenAI / Anthropic / Responses-style traffic to the providers, API keys and combos you
configure, and keeps the CLI tools on the same machine pointed at it.

Dashboard: Endpoint & Key · Providers · Combo & Vision Adapter · Usage · Quota Tracker ·
CLI Tools · Console Log · Translator (+ profile).

## Requirements

- Node.js 20+ (developed on Node 24)
- Windows, macOS or Linux

## Run (development)

```bash
npm install
npm run dev        # http://localhost:20227 with hot reload
```

## Build and run (production)

```bash
npm run build      # next build --webpack, then scripts/copy-standalone-assets.mjs
npm start          # node custom-server.js --port 20227
```

`npm start` and `npm run dev` both listen on **20227**; override with `PORT` or `--port`.
Deployed instances use **20228** by default (see `.env.example`).

## Build notes

- **Production builds use a throwaway profile.** Next's file tracer (@vercel/nft) resolves
  every config path the app discovers through `os.homedir()` / `APPDATA` / `LOCALAPPDATA`
  and then walks the matches. Against a real user profile that costs gigabytes of memory,
  drags your own config files into the standalone trace, and aborts on Windows as soon as
  one profile entry is unreadable (a stale temp dir owned by another account).
  `next.config.mjs` therefore points production builds at `%TEMP%\lllrouter-build-home`;
  the running app still reads the real profile.
- Runtime temp paths go through `open-sse/utils/tempDir.js`. Calling `os.tmpdir()` directly
  lets the tracer resolve the path at build time and walk the whole OS temp directory.

## Data and environment

- Data dir: `%APPDATA%\lllrouter` on Windows, `~/.lllrouter` elsewhere (`DATA_DIR` overrides).
- SQLite database: `<data dir>/db/data.sqlite`, created and migrated on first start.
- Copy `.env.example` to `.env`: `JWT_SECRET`, `PORT`, `API_KEY_SECRET`, `MACHINE_ID_SALT`,
  `ENABLE_REQUEST_LOGS`, `OBSERVABILITY_ENABLED`, `AUTH_COOKIE_SECURE`, `REQUIRE_API_KEY`,
  plus optional outbound proxy variables.

## Endpoints

- Gateway: `/v1/chat/completions`, `/v1/messages`, `/v1/responses`, `/v1/models` (and the
  `/api/v1/*` equivalents)
- Dashboard/API: `/api/*` — health at `/api/health`, model catalog at `/api/v1/models`

## Differences from upstream 9router

Removed: cloud sync, Cloudflare Tunnel + Tailscale, proxy pools, the updater/changelog/donate
flows, media-providers demo, skills page, OIDC/SAML and password login flows, the 9Remote /
9English links, and the Docker / docker-compose / CLI-tray packaging. API keys fall back to
the `sk_lllrouter` sentinel instead of `sk_9router`.
