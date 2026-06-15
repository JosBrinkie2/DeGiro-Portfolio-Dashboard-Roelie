# Cloudflare Worker proxy

A tiny, always-on HTTPS proxy that lets the browser-only dashboard reach
Yahoo Finance and Stooq (neither sends CORS headers). It replaces the flaky
public CORS proxies as the dashboard's **primary** price source; the public
proxies remain as automatic fallback.

It is **not** an open relay — it only forwards to an allowlist of upstream
hosts and only answers requests from the dashboard's origin.

## One-time setup

1. Create a free Cloudflare account: https://dash.cloudflare.com/sign-up
2. Install Wrangler and log in:
   ```sh
   npm install -g wrangler
   wrangler login
   ```
3. Edit `src/worker.js` and set `GH_PAGES_ORIGIN` to your GitHub Pages origin
   (scheme + host only), e.g. `https://josbrinkie2.github.io`.

## Deploy

```sh
cd cloudflare-proxy
wrangler deploy
```

Wrangler prints the Worker URL, e.g.:

```
https://degiro-dashboard-proxy.<your-account>.workers.dev
```

## Wire it into the dashboard

Set that URL as the build-time env var `VITE_PROXY_BASE`:

- **Local dev** — create `degiro-dashboard/.env.local`:
  ```
  VITE_PROXY_BASE=https://degiro-dashboard-proxy.<your-account>.workers.dev
  ```
- **GitHub Pages build** — it is already wired into `.github/workflows/deploy.yml`
  via a repository variable named `VITE_PROXY_BASE`. Set it under
  **Settings → Secrets and variables → Actions → Variables**. If unset, the
  dashboard simply falls back to the public proxies.

## Test

```sh
# Local
wrangler dev
curl "http://localhost:8787/yahoo/v8/finance/chart/AAPL?interval=1d&range=1d"

# Deployed
curl "https://degiro-dashboard-proxy.<your-account>.workers.dev/yahoo/v8/finance/chart/AAPL?interval=1d&range=1d"
```

You should get Yahoo's JSON back with an `Access-Control-Allow-Origin` header.
