import { NextResponse } from "next/server";
import { redis } from "../../../lib/redis";

const DEFAULT_EXPIRATION = 7200;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const symbol = searchParams.get("symbol");
  if (!symbol) {
    return NextResponse.json({ error: "Symbol is required" }, { status: 400 });
  }

  const cacheKey = `overview:${symbol.toUpperCase()}`;

  try {
    const cached = await redis.get(cacheKey);
    if (cached) return NextResponse.json(JSON.parse(cached));
  } catch {
    // redis unavailable
  }

  const API_KEY = process.env.ALPHA_VANTAGE_KEY;
  try {
    const res = await fetch(
      `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${symbol}&apikey=${API_KEY}`
    );
    const data = await res.json();

    if (data.Information || !data.Symbol) {
      return NextResponse.json(null);
    }

    const result = {
      analystTargetPrice: parseFloat(data.AnalystTargetPrice) || 0,
      analystRating: data.RecommendationKey || 'hold',
      percentInstitutions: parseFloat(data.PercentInsiders) || 0,
      analystCount: (parseInt(data.AnalystRatingStrongBuy || '0') +
        parseInt(data.AnalystRatingBuy || '0') +
        parseInt(data.AnalystRatingHold || '0') +
        parseInt(data.AnalystRatingSell || '0') +
        parseInt(data.AnalystRatingStrongSell || '0')),
    };

    try {
      await redis.set(cacheKey, JSON.stringify(result), { EX: DEFAULT_EXPIRATION });
    } catch {
      // skip cache
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Overview API error:", error);
    return NextResponse.json(null, { status: 502 });
  }
}
