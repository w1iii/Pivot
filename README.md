# Pivot

Stock tracking dashboard with AI analysis, market overview, news, and secure auth.

> **Mock data note:** Dashboard works fully with mock data — real data requires API keys for Alpha Vantage, Groq, and FreeNewsAPI. See [.env.example](.env.example).

## Features

### Core
- **Stock API** — Real-time quotes, history, overview, and batch lookup via Alpha Vantage. Interactive price charts per symbol.
- **AI Stock Analyst** — Chat with Groq-powered AI for stock insights, trends, and analysis.
- **Market Overview** — VIX, SPY tracking, aggregate portfolio growth, buy pressure, retail sentiment.
- **Real-time News** — Stock news feed with detail enrichment via FreeNewsAPI.
- **Watchlist** — Personalized stock watchlist with quick symbol lookup and removal.

### Platform
- **JWT Auth** — Secure signup/login, httpOnly cookies, rate-limited endpoints.
- **Dashboard** — Portfolio view, market page, news feed, settings — all behind auth gate.
- **Redis Cache** — Speeds up stock/news/market responses, falls back gracefully when unavailable.

## Tech Stack

- **Frontend:** Next.js 16, React 19, TypeScript, Tailwind CSS
- **Backend:** Next.js API Routes, PostgreSQL, Redis
- **Auth:** JWT (jose) + bcrypt
- **AI:** Groq SDK
- **News:** FreeNewsAPI

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL
- Redis (optional — app runs without it)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd pivot
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Configure your `.env.local` with the following variables:
```env
# Required
DATABASE_URL=postgresql://user:password@localhost:5432/pivot
JWT_SECRET=your-jwt-secret-key

# Required for live data (mock data used if unset)
ALPHA_VANTAGE_KEY=your-alpha-vantage-key
GROQ_API_KEY=your-groq-api-key

# Optional
REDIS_URL=redis://localhost:6379
FREE_NEWS_API_KEY=your-freenewsapi-key
```

5. Initialize the database:
```bash
psql "<DATABASE_URL>" < schema.sql
```

6. Start the dev server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## API Endpoints

### Authentication
- `POST /api/signup` — Create account
- `POST /api/login` — Login, get JWT cookie
- `POST /api/logout` — Clear session
- `GET /api/me` — Current user info

### Stocks
- `GET /api/stock?symbol=<SYMBOL>` — Real-time quote
- `POST /api/stock/batch` — Batch quotes
- `GET /api/stock/history?symbol=<SYMBOL>` — Price history
- `GET /api/stock/overview?symbol=<SYMBOL>` — Company overview

### Market
- `GET /api/market` — VIX, SPY, portfolio aggregate growth, sentiment

### Watchlist
- `GET /api/watchlist` — User's watchlist
- `POST /api/watchlist` — Add symbol
- `DELETE /api/watchlist` — Remove symbol

### AI
- `POST /api/chat` — Chat with stock analyst AI

### News
- `GET /api/news` — Stock news feed (topic, country, language filters)

## License

MIT

## Author

Lui Franz Lomugdang — lomugdanglf.19@gmail.com
