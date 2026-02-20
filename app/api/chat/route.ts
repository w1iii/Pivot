import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { message }: { message: string } = await req.json();

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("Missing GEMINI_API_KEY");

    const ai = new GoogleGenAI({ apiKey });

    const systemInstruction = `
You are a professional stock market assistant. Provide clear, actionable insights on stocks:
- Stock fundamentals, recent performance, and market trends.
- Risk analysis and general guidance for buying or selling.
- Do NOT give guaranteed financial advice.
- Format: 1. Stock Overview 2. Recent Performance 3. Key Metrics 4. Risk Analysis 5. Suggested Actions
Keep responses short, precise, and concise.
    `.trim();

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: message,
      config: {
        systemInstruction,
        temperature: 0.3,
        maxOutputTokens: 500,
      },
    });

    return NextResponse.json({ reply: response.text });
  } catch (error: any) {
    console.error("FULL ERROR:", error);
    return NextResponse.json({ error: error.message || "Internal error" }, { status: 500 });
  }
}
