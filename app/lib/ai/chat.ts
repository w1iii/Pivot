
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize with your API key
//

const GEMINI_API_KEY = process.env.GEMINI_API_KEY
if(!GEMINI_API_KEY){
    throw new Error("GEMINI API KEY is not defined")
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// Choose a model
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Start a chat session
export async function runChat(input: string) {
  const validInput = input
     
  const chat = model.startChat({
    history: [
      {
        role: "user",
        parts: [{ text: input? input : "Hello!" }],
      },
      {
        role: "model",
        parts: [{ text: "Hi there! How can I help you today?" }],
      },
    ],
  });

  const result = await chat.sendMessage("Explain how AI works in simple terms.");
  const response = await result.response;
  console.log(response.text());
}

