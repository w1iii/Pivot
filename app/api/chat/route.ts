
import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { message }: { message: string } = await req.json();

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      throw new Error("Missing GEMINI_API_KEY");
    }

    const ai = new GoogleGenAI({ apiKey });

    // System prompt defines the assistant's role
    const systemPrompt = `
You are a professional stock market assistant. Your goal is to provide clear and actionable insights on stocks, including:
- Stock fundamentals, recent performance, and market trends.
- Risk analysis and general guidance for buying or selling stocks.
- Do NOT give guaranteed financial advice; focus on analysis and probabilities.
- Provide structured responses in this format:
1. Stock Overview
2. Recent Performance
3. Key Financial Metrics
4. Risk Analysis
5. Suggested Actions
Always respond clearly, concisely, and with factual information.

Make it short precise, concise, and straight to the point.
`;

    // Combine system prompt and user message
    const fullPrompt = `${systemPrompt}\nUser query: ${message}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: fullPrompt,
      temperature: 0.3,
      maxOutputTokens: 500,
    });

    return NextResponse.json({
      reply: response.text,
    });

  } catch (error: any) {
    console.error("FULL ERROR:", error);
    return NextResponse.json(
      { error: error.message || "Internal error" },
      { status: 500 }
    );
  }
}
