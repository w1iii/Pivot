# Pivot — Needs & Issues

## Mock / Hardcoded Data

- [ ] Chart data uses `Array.from` ASCII-based fake prices (`dashboard/page.tsx:67`, `watchlist/[symbol]/page.tsx:39`)
- [ ] SVG chart path points are hardcoded, not from API (`watchlist/[symbol]/page.tsx:246`)
- [ ] Financial figures hardcoded: +2.4% growth, 84% buy pressure, 62% sentiment, 14.2 VIX, allocation %s, $2.8M portfolio value (`dashboard/page.tsx:266-490`)
- [ ] Analyst ratings hardcoded: 82% score, $195 target, 78.4% institutional holding (`watchlist/[symbol]/page.tsx:359-374`)
- [ ] Two "Strategic Intelligence" news articles are static text (`dashboard/page.tsx:410-431`)
- [ ] Company names — static map of 12 tickers in detail page; market page appends "Inc." to every symbol
- [ ] All images are `aida-public` Google AI placeholder URLs (5 files)
- [ ] Market sentiment blurb is static text ("cautiously bullish")
- [ ] Last update timestamp hardcoded (`14:23:45 EST — JUL 24`)

## Unimplemented Features

- [ ] **News page** — sidebar nav link is `href="#"` with `match: () => false` (`layout.tsx:29`)
- [ ] **Portfolio page** — sidebar nav link is `href="#"` with `match: () => false` (`layout.tsx:30`)
- [ ] **Settings page** — exists but is empty `<h1>Settings</h1>` stub (`settings/page.tsx`)
- [ ] **Search bar** — no onChange/onKeyDown, purely decorative (`layout.tsx:82`)
- [ ] **Notifications** bell — no onClick handler (`layout.tsx:86`)
- [ ] **Forgot password** — `href="#"` on login page (`page.tsx:80`)
- [ ] **SSO button** — no onClick (`page.tsx:120`)
- [ ] **Passkey button** — no onClick (`page.tsx:129`)
- [ ] **Chart toolbar** — show_chart / fullscreen buttons, no onClick (`watchlist/[symbol]/page.tsx:227-228`)
- [ ] **"Explore All News"** — `href="#"` (`dashboard/page.tsx:405`)
- [ ] **Legal / Privacy / Security** — all `href="#"` in login and signup footers

## Missing Pages

- [ ] `/dashboard/news` — linked from sidebar but does not exist
- [ ] `/dashboard/portfolio` — linked from sidebar but does not exist
- [ ] `/support` — linked from sidebar but does not exist

## API / Backend Issues

- [ ] **Alpha Vantage rate limit** — free tier = 5 req/min; batch route uses 1.2s delay (~50 req/min), will 429 quickly
- [ ] **Missing cache invalidation** — `removeStockMutation` on market page has no `onSuccess` handler to invalidate watchlist query (`market/page.tsx:88`)
- [ ] **Fire-and-forget mutation** — market page uses `mutate()` not `mutateAsync()`, errors silently swallowed (`market/page.tsx:238`)
- [ ] **Redis error propagation** — `redis.set()` in stock route has no try/catch, will crash if Redis is down (`stock/route.ts:58`)
- [ ] **Empty catch blocks** — silent failures in dashboard chat, rate-limit fallback, health check (`dashboard/page.tsx:187`, `rate-limit.ts:31`, `health/route.ts:12`)

## Code Quality

- [ ] **Duplicate `buildStockDetail`** — identical function in `dashboard/page.tsx:45` and `watchlist/[symbol]/page.tsx:17`
- [ ] **Duplicate `getLogoColor`** — identical function in 3 files (dashboard, market, watchlist detail)
- [ ] **Undefined CSS classes** — `font-data-mono` / `text-data-mono` used 11 times but not defined in `globals.css` theme
- [ ] **Hardcoded year** — `© 2024` in login and signup footers, not dynamic (`page.tsx:150`, `signup/page.tsx:213`)
- [ ] **Market page row click** — navigates to `/dashboard` instead of `/dashboard/watchlist/[symbol]` (`market/page.tsx:208`)
- [ ] **Watchlist label** — every item shows "Market" instead of actual exchange (`dashboard/page.tsx:367`)

## Security

- [ ] **Exposed API keys** — `.env` file header warns "Previous keys were exposed in git history". Current keys `ALPHA_VANTAGE_KEY` and `GROQ_API_KEY` should be considered compromised.
