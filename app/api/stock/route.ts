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
    const cachedData = await redis.get(cacheKey);

    if (cachedData) {
      return NextResponse.json(JSON.parse(cachedData));
    }

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

    try {
      await redis.set(cacheKey, JSON.stringify(formattedData), {
        EX: DEFAULT_EXPIRATION,
      });
    } catch {
      // Redis unavailable, skip cache write
    }

    return NextResponse.json(formattedData);

  } catch {
    return NextResponse.json(
      { error: "Failed to fetch stock data" },
      { status: 500 }
    );
  }
}
