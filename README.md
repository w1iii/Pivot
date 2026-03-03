# Pivot

Personal stock tracking dashboard with AI-powered analysis.

<img width="1440" height="810" alt="Screenshot 2026-03-03 at 9 31 37 PM" src="https://github.com/user-attachments/assets/caf76bce-e907-4fb6-a90e-03925e0f4373" />
<img width="1440" height="810" alt="Screenshot 2026-03-03 at 9 32 40 PM" src="https://github.com/user-attachments/assets/5566a9ac-e799-45a3-8226-86f46bc77a03" />
<img width="1439" height="811" alt="Screenshot 2026-03-03 at 9 32 08 PM" src="https://github.com/user-attachments/assets/e5ee8747-f72c-492b-a765-ec23e6050f09" />


[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-336791)](https://www.postgresql.org)

## Features

- **User Authentication** - Secure signup and login with JWT-based authentication
- **Personal Watchlist** - Create and manage your custom stock watchlist
- **Real-time Data** - Track stock prices, changes, and market statistics
- **Interactive Charts** - Visualize stock performance with dynamic price charts
- **AI Stock Analyst** - Get AI-powered insights and analysis for any stock (powered by Groq)

## Tech Stack

- **Frontend:** Next.js 16, React 19, TypeScript, Tailwind CSS
- **Backend:** Next.js API Routes
- **Database:** PostgreSQL
- **Cache:** Redis
- **Authentication:** JWT (jose)
- **AI:** Groq SDK

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL
- Redis

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
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/pivot

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-jwt-secret-key

# AI (Groq)
GROQ_API_KEY=your-groq-api-key
```

5. Initialize the database:
```bash
# Run database migrations/schema as per your setup
```

### Running the App

Start the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## API Endpoints

### Authentication
- `POST /api/signup` - Create a new account
- `POST /api/login` - Login and receive JWT
- `POST /api/logout` - Logout and clear session
- `GET /api/me` - Get current user info

### Stocks
- `GET /api/stock?symbol=<SYMBOL>` - Get stock data for a symbol
- `POST /api/stock/batch` - Get stock data for multiple symbols

### Watchlist
- `GET /api/watchlist` - Get user's watchlist
- `POST /api/watchlist` - Add stock to watchlist
- `DELETE /api/watchlist` - Remove stock from watchlist

### AI Chat
- `POST /api/chat` - Chat with AI stock analyst

## License

MIT License

## Author

Lui Franz Lomugdang - lomugdanglf.19@gmail.com
