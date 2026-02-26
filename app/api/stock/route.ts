import { NextResponse } from "next/server";
import { redis } from "../../lib/redis";

const DEFAULT_EXPIRATION = 3600;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const symbol = searchParams.get("symbol");

  if (!symbol) {
    return NextResponse.json(
      { error: "Symbol is required" },
      { status: 400 }
    );
  }

  const cacheKey = `stock:${symbol.toUpperCase()}`;

  try {
    // 🔥 1️⃣ Check Redis Cache First
    const cachedData = await redis.get(cacheKey);

    if (cachedData) {
      console.log("Serving from Redis cache");
      return NextResponse.json(JSON.parse(cachedData));
    }

    console.log("Fetching from Alpha Vantage API");

    const API_KEY = process.env.ALPHA_VANTAGE_KEY;

    const response = await fetch(
      `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${API_KEY}`
    );

    const data = await response.json();

    if (data.Information) {
      return NextResponse.json({ message: data.Information });
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

    // 🔥 2️⃣ Store in Redis (stringify!)
    await redis.set(cacheKey, JSON.stringify(formattedData), {
      EX: DEFAULT_EXPIRATION,
    });

    return NextResponse.json(formattedData);

  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { error: "Failed to fetch stock data" },
      { status: 500 }
    );
  }
}
