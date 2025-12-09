import { GoogleGenAI, Content, Part } from "@google/genai";
import { Message, Role } from "../types";

const apiKey = process.env.API_KEY;

// Initialize the client
const ai = new GoogleGenAI({ apiKey: apiKey });

/**
 * Maps our internal Message type to the SDK's Content type.
 */
const mapMessagesToHistory = (messages: Message[]): Content[] => {
  return messages.map((msg) => ({
    role: msg.role === Role.USER ? 'user' : 'model',
    parts: [{ text: msg.text } as Part],
  }));
};

/**
 * Sends a message to the Gemini model and streams the response.
 * We create a new chat session each time to ensure the latest system instruction (with the correct name) is used.
 */
export const streamChatResponse = async function* (
  currentMessage: string,
  history: Message[],
  aiName: string
) {
  const modelId = 'gemini-2.5-flash';
  
  // Construct the system instruction based on the dynamic name
  const systemInstruction = `Du bist ${aiName}, eine freundliche, hilfsbereite und empathische KI. 
  Antworte stets höflich, warmherzig und auf Deutsch. 
  Deine Antworten sollten hilfreich sein, aber auch Charakter zeigen.
  Du sprichst den Nutzer gerne direkt an, wenn es passt.`;

  try {
    const chat = ai.chats.create({
      model: modelId,
      history: mapMessagesToHistory(history),
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7, // Slightly creative/friendly
      },
    });

    const result = await chat.sendMessageStream({ message: currentMessage });

    for await (const chunk of result) {
      if (chunk.text) {
        yield chunk.text;
      }
    }
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw error;
  }
};
