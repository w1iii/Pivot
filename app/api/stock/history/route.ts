import { NextResponse } from "next/server";
import { redis } from "../../../lib/redis";

const DEFAULT_EXPIRATION = 7200;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const symbol = searchParams.get("symbol");
  if (!symbol) {
    return NextResponse.json({ error: "Symbol is required" }, { status: 400 });
  }

  const cacheKey = `history:${symbol.toUpperCase()}`;

  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      return NextResponse.json(JSON.parse(cached));
    }
  } catch {
    // redis unavailable
  }

  const API_KEY = process.env.ALPHA_VANTAGE_KEY;
  try {
    const res = await fetch(
      `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&outputsize=compact&apikey=${API_KEY}`
    );
    const data = await res.json();

    if (data.Information) {
      return NextResponse.json({ error: data.Information }, { status: 429 });
    }

    const timeSeries = data["Time Series (Daily)"];
    if (!timeSeries) {
      return NextResponse.json({ error: "No data available" }, { status: 404 });
    }

    const entries = Object.entries(timeSeries).sort(
      (a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime()
    );

    const chartData = entries.map(([date, vals]) => ({
      date,
      close: parseFloat((vals as Record<string, string>)["4. close"]),
    }));

    const prices = chartData.map(d => d.close);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const range = max - min || 1;

    // Normalize to 0-200 range for SVG
    const normalized = chartData.map(d => ({
      date: d.date,
      close: d.close,
      y: 200 - ((d.close - min) / range) * 200,
    }));

    const result = { symbol: symbol.toUpperCase(), prices: normalized, min, max };

    try {
      await redis.set(cacheKey, JSON.stringify(result), { EX: DEFAULT_EXPIRATION });
    } catch {
      // skip cache
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("History API error:", error);
    return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 });
  }
}
