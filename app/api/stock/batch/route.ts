import { NextResponse } from "next/server";
import { redis } from "../../../lib/redis";

const DEFAULT_EXPIRATION = 3600;

export async function POST(req: Request) {
  const { symbols } = await req.json();

  if (!symbols || !Array.isArray(symbols)) {
    return NextResponse.json(
      { error: "Symbols array is required" },
      { status: 400 }
    );
  }

  const uniqueSymbols = [...new Set(symbols.map((s: string) => s.toUpperCase()))];
  const results: Record<string, any> = {};
  const uncached: string[] = [];

  try {
    // Check cache for all symbols in parallel
    const cachePromises = uniqueSymbols.map(async (symbol) => {
      const cacheKey = `stock:${symbol}`;
      const cached = await redis.get(cacheKey);
      if (cached) {
        results[symbol] = JSON.parse(cached);
      } else {
        uncached.push(symbol);
      }
    });

    await Promise.all(cachePromises);

    // Fetch uncached symbols in parallel
    if (uncached.length > 0) {
      const API_KEY = process.env.ALPHA_VANTAGE_KEY;

      const fetchPromises = uncached.map(async (symbol) => {
        try {
          const response = await fetch(
            `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${API_KEY}`
          );
          const data = await response.json();

          if (data.Information) {
            results[symbol] = { error: data.Information };
            return;
          }

          const formattedData = {
            symbol: data["Global Quote"]["01. symbol"],
            open: data["Global Quote"]["02. open"],
            high: data["Global Quote"]["03. high"],
            low: data["Global Quote"]["04. low"],
            price: data["Global Quote"]["05. price"],
            volume: data["Global Quote"]["06. volume"],
            change: data["Global Quote"]["09. change"],
            changePercent: data["Global Quote"]["10. change percent"],
          };

          results[symbol] = formattedData;

          // Cache the result
          const cacheKey = `stock:${symbol}`;
          await redis.set(cacheKey, JSON.stringify(formattedData), {
            EX: DEFAULT_EXPIRATION,
          });
        } catch (error) {
          results[symbol] = { error: "Failed to fetch" };
        }
      });

      await Promise.all(fetchPromises);
    }

    return NextResponse.json(results);
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { error: "Failed to fetch stock data" },
      { status: 500 }
    );
  }
}
