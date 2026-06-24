import { NextResponse } from "next/server";
import { redis } from "../../lib/redis";

const DEFAULT_EXPIRATION = 1800;

const API_KEY = process.env.FREE_NEWS_API_KEY;

async function fetchAPI(url: string) {
  const res = await fetch(url, { headers: { "x-api-key": API_KEY! } });
  if (!res.ok) {
    const text = await res.text();
    console.error("FreeNewsApi error:", res.status, text);
    return null;
  }
  return res.json();
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const topic = searchParams.get("topic") || "";
  const country = searchParams.get("country") || "us";
  const language = searchParams.get("language") || "en";
  const limit = parseInt(searchParams.get("limit") || "10");
  const q = searchParams.get("q") || "";
  const inTitle = searchParams.get("in_title") || "";

  const cacheKey = `news:${topic}:${country}:${language}:${limit}:${q}:${inTitle}`;

  if (!API_KEY) {
    return NextResponse.json(
      { error: "News API key not configured" },
      { status: 503 }
    );
  }

  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      return NextResponse.json(JSON.parse(cached));
    }
  } catch {
    // Redis unavailable, serve fresh data
  }

  let url = `https://api.freenewsapi.io/v1/news?language=${language}&country=${country}&order_by=archive&page_size=${limit}`;
  if (topic) url += `&topic=${topic}`;
  if (q) url += `&q=${encodeURIComponent(q)}`;
  if (inTitle) url += `&in_title=${encodeURIComponent(inTitle)}`;

  const listing = await fetchAPI(url);
  if (!listing) {
    return NextResponse.json({ error: "Failed to fetch news" }, { status: 502 });
  }

  const articles = listing.data || [];

  const enriched = await Promise.all(
    articles.map(async (article: { uuid: string }) => {
      try {
        const detail = await fetchAPI(
          `https://api.freenewsapi.io/v1/details?uuid=${article.uuid}`
        );
        return { ...article, url: detail?.data?.url || "", description: detail?.data?.body || "" };
      } catch {
        return { ...article, url: "", description: "" };
      }
    })
  );

  const result = { data: enriched, meta: listing.meta };

  try {
    await redis.set(cacheKey, JSON.stringify(result), { EX: DEFAULT_EXPIRATION });
  } catch {
    // Redis unavailable, skip cache
  }

  return NextResponse.json(result);
}
