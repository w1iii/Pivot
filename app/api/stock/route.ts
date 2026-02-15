import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const symbol = searchParams.get("symbol");

  if (!symbol) {
    return NextResponse.json(
      { error: "Symbol is required" },
      { status: 400 }
    );
  }

  const API_KEY = process.env.ALPHA_VANTAGE_KEY;

  try {
    const response = await fetch(
      `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${API_KEY}`
    );

    const data = await response.json();

    // return NextResponse.json(data["Global Quote"]);

    return NextResponse.json({
      symbol: data["Global Quote"]["01. symbol"],
      open: data["Global Quote"]["02. open"],
      high: data["Global Quote"]["03. high"],
      low: data["Global Quote"]["04. low"],
      price: data["Global Quote"]["05. price"],
      volume: data["Global Quote"]["06. volume"],
      change: data["Global Quote"]["09. change"],
      changePercent: data["Global Quote"]["10. change percent"],


    });

  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch stock data" },
      { status: 500 }
    );
  }
}
