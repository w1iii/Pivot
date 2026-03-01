import { NextResponse } from "next/server";
import { redis } from "../../../lib/redis";
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const DEFAULT_EXPIRATION = 3600;

async function getUserId(): Promise<string | null>{
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value;
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { user: { id: string }};
    return decoded.user.id;
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  const userId = getUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { symbols } = await req.json();

  if (!symbols || !Array.isArray(symbols)) {
    return NextResponse.json(
      { error: "Symbols array is required" },
      { status: 400 }
    );
  }
  const cacheKey = `batch:${userId}`;

  const uniqueSymbols = [...new Set(symbols.map((s: string) => s.toUpperCase()))];
  const results: Record<string, Record<string, string | number>> = {};

  try {
    const cachedData = await redis.get(cacheKey);
    if(cachedData){
      console.log("Serving from Redis cache (batch): ");
      return NextResponse.json(JSON.parse(cachedData));
    }
    const API_KEY = process.env.ALPHA_VANTAGE_KEY;

    // Fetch sequentially with delay to respect Alpha Vantage rate limit (5 requests/min, 500/day)
    // TODO: Uncomment this for premium API (supports concurrent requests)
    // const fetchPromises = uniqueSymbols.map(async (symbol) => {
    //   try {
    //     const response = await fetch(
    //       `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${API_KEY}`
    //     );
    //     const data = await response.json();

    //     // Check for API errors or rate limits
    //     if (!data["Global Quote"] || data["Global Quote"]["05. price"] === undefined) {
    //       console.log(`Alpha Vantage error for ${symbol}:`, data);
    //       results[symbol] = { 
    //         error: data.Information || "No data available",
    //         price: 0,
    //         change: 0,
    //         changePercent: 0
    //       };
    //       return;
    //     }

    //     const formattedData = {
    //       symbol: data["Global Quote"]["01. symbol"],
    //       open: data["Global Quote"]["02. open"],
    //       high: data["Global Quote"]["03. high"],
    //       low: data["Global Quote"]["04. low"],
    //       price: data["Global Quote"]["05. price"],
    //       volume: data["Global Quote"]["06. volume"],
    //       change: data["Global Quote"]["09. change"],
    //       changePercent: data["Global Quote"]["10. change percent"],
    //     };

    //     results[symbol] = formattedData;
    //   } catch (error) {
    //     console.log(`Error fetching ${symbol}:`, error);
    //     results[symbol] = { error: "Failed to fetch", price: "0", change: "0", changePercent: "0" };
    //   }
    // });
    // await Promise.all(fetchPromises);

    for (const symbol of uniqueSymbols) {
      try {
        const response = await fetch(
          `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${API_KEY}`
        );
        const data = await response.json();

        // Check for API errors or rate limits
        if (!data["Global Quote"] || data["Global Quote"]["05. price"] === undefined) {
          console.log(`Alpha Vantage error for ${symbol}:`, data);
          results[symbol] = { 
            error: data.Information || "No data available",
            price: 0,
            change: 0,
            changePercent: 0
          };
        } else {
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
        }
      } catch (error) {
        console.log(`Error fetching ${symbol}:`, error);
        results[symbol] = { error: "Failed to fetch", price: "0", change: "0", changePercent: "0" };
      }

      // Delay between requests (1.2 seconds to stay within rate limit)
      if (uniqueSymbols.indexOf(symbol) < uniqueSymbols.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1200));
      }
    }

    console.log(results);
    await redis.set(cacheKey, JSON.stringify(results),{
      EX: DEFAULT_EXPIRATION,
    });

    return NextResponse.json(results);
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { error: "Failed to fetch stock data" },
      { status: 500 }
    );
  }
}
