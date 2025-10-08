import { GoogleGenerativeAI } from "@google/generative-ai";

// 1. Validate the API key safely
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  throw new Error("GEMINI_API_KEY is not set in the environment variables.");
}

const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

/**
 * Generates a response from the Gemini model.
 * @param system - The system instruction to guide the model's behavior.
 * @param user - The user's prompt.
 * @returns A promise that resolves to the model's response text.
 */
export async function chat(system: string, user: string): Promise<string> {
  try {
    // 2. Use the dedicated systemInstruction property for better results
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: user }] }],
      systemInstruction: {
        role: "system",
        parts: [{ text: system }],
      },
    });

    const text = result.response.text();
    return text || "{}"; // Fallback if the response is empty
  } catch (err) {
    // 3. Log the full error object for more detailed debugging
    console.error("Gemini chat error:", err);
    return "{}"; // Return a default value on error
  }
}