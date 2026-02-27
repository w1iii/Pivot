// import { GoogleGenAI } from "@google/genai";
import Groq from "groq-sdk";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { message }: { message: string } = await req.json();

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("Missing GEMINI_API_KEY");

    // const ai = new GoogleGenAI({ apiKey });
    const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const systemInstruction = `
    You are a friendly financial advisor. If the user greets you, greet them back warmly and ask what stock they'd like to know about. If they ask about a specific stock, give a honest 2-3 sentence take — what it's doing and whether it's worth buying, holding, or avoiding. No headers, no bullet points, no formatting. Warm, confident, and straight to the point.
    `.trim();

    const response = await client.chat.completions.create({
      model: "llama-3.1-8b-instant", // free & fast
      messages: [
        { role: "system", content: systemInstruction },
        { role: "user", content: message }
      ],
      max_tokens: 200,
      temperature: 0.4,
    });

    const text = response.choices[0]?.message?.content ?? "No response";

    return NextResponse.json({ reply: text });
  } catch (error) {
    console.error("FULL ERROR:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Internal error" }, { status: 500 });
  }
}
