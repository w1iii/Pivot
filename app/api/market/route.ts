import { NextResponse } from "next/server";
import { redis } from "../../lib/redis";
import { getCurrentUser } from "../../lib/auth/jwt";
import pool from "../../lib/db";

const DEFAULT_EXPIRATION = 3600;

async function fetchQuote(symbol: string, apiKey: string) {
  const res = await fetch(
    `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`
  );
  const data = await res.json();
  const q = data["Global Quote"];
  if (!q) return null;
  return {
    price: parseFloat(q["05. price"]),
    change: parseFloat(q["09. change"]),
    changePercent: parseFloat(q["10. change percent"]),
  };
}

export async function GET(req: Request) {
  const user = await getCurrentUser();
  const apiKey = process.env.ALPHA_VANTAGE_KEY!;

  const cacheKey = user ? `market:${user.id}` : `market:anon`;

  try {
    const cached = await redis.get(cacheKey);
    if (cached) return NextResponse.json(JSON.parse(cached));
  } catch {
    // redis unavailable
  }

  try {
    // Fetch VIX, SPY, and DOW in parallel
    const [vix, spy] = await Promise.all([
      fetchQuote("VIX", apiKey),
      fetchQuote("SPY", apiKey),
    ]);

    if (!spy) {
      return NextResponse.json({ error: "Failed to fetch market data" }, { status: 502 });
    }

    // Compute aggregate growth from user's watchlist
    let aggregateGrowth = spy.changePercent;
    let advancing = 0;
    let declining = 0;
    let totalChange = 0;
    let totalStocks = 0;

    if (user) {
      try {
        const watchlist = await pool.query(
          "SELECT symbol FROM watchlist WHERE user_id = $1",
          [user.id]
        );

        if (watchlist.rows.length > 0) {
          const symbols = watchlist.rows.map((r: { symbol: string }) => r.symbol);
          let sumChangePct = 0;

          for (const symbol of symbols) {
            const quote = await fetchQuote(symbol, apiKey);
            if (quote) {
              totalStocks++;
              totalChange += quote.change;
              sumChangePct += quote.changePercent;
              if (quote.change >= 0) advancing++;
              else declining++;
            }
            // Rate limit: 1.2s between calls
            if (symbols.indexOf(symbol) < symbols.length - 1) {
              await new Promise(r => setTimeout(r, 1200));
            }
          }

          if (totalStocks > 0) {
            aggregateGrowth = parseFloat((sumChangePct / totalStocks).toFixed(1));
          }
        }
      } catch {
        // watchlist unavailable, use SPY fallback
      }
    }

    const total = advancing + declining || 1;
    const buyPressure = parseFloat(((advancing / total) * 100).toFixed(0));
    const retailSentiment = buyPressure > 50
      ? Math.min(95, buyPressure + 5 + Math.floor(Math.random() * 8))
      : Math.max(30, buyPressure - 5 - Math.floor(Math.random() * 8));

    const result = {
      vix: vix ? parseFloat(vix.price.toFixed(1)) : 15.0,
      vixChange: vix ? vix.change / vix.price * 100 : 0,
      spyPrice: spy.price,
      spyChange: spy.changePercent,
      aggregateGrowth: aggregateGrowth,
      buyPressure,
      retailSentiment,
    };

    try {
      await redis.set(cacheKey, JSON.stringify(result), { EX: DEFAULT_EXPIRATION });
    } catch {
      // skip cache
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Market API error:", error);
    return NextResponse.json({ error: "Failed to fetch market data" }, { status: 500 });
  }
}
