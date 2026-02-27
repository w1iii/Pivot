import { NextResponse } from "next/server";

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

  try {
    const API_KEY = process.env.ALPHA_VANTAGE_KEY;

    // Always fetch fresh data from Alpha Vantage (skip Redis cache)
    const fetchPromises = uniqueSymbols.map(async (symbol) => {
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
      } catch (error) {
        console.log(`Error fetching ${symbol}:`, error);
        results[symbol] = { error: "Failed to fetch", price: "0", change: "0", changePercent: "0" };
      }
    });

    await Promise.all(fetchPromises);

    return NextResponse.json(results);
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { error: "Failed to fetch stock data" },
      { status: 500 }
    );
  }
}
