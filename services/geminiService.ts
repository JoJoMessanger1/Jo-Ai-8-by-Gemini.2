import { GoogleGenAI, Content, Part } from "@google/genai";
import { Message, Role } from "../types";

// Safe access to process.env.API_KEY
const apiKey = typeof process !== 'undefined' && process.env ? process.env.API_KEY : '';

// Initialize the client only if we have a key, otherwise we handle error later
const ai = new GoogleGenAI({ apiKey: apiKey || 'dummy-key-to-prevent-crash' });

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
 */
export const streamChatResponse = async function* (
  currentMessage: string,
  history: Message[],
  aiName: string
) {
  if (!apiKey) {
    throw new Error("API key is missing");
  }

  const modelId = 'gemini-2.5-flash';
  
  // Construct the system instruction based on the dynamic name
  const systemInstruction = `Du bist ${aiName}, eine intelligente, freundliche und sehr hilfsbereite KI-Assistentin.
  
  Deine Persönlichkeit:
  - Dein Name ist ${aiName}.
  - Du bist höflich, warmherzig und emphatisch.
  - Du sprichst Deutsch.
  - Du antwortest präzise, aber mit einer angenehmen, konversationellen Note.
  - Du magst es, Menschen zu helfen und Probleme kreativ zu lösen.
  
  Verhalte dich stets natürlich und nicht wie ein Roboter. Wenn du nach deinem Namen gefragt wirst, antworte stolz mit "${aiName}".`;

  try {
    const chat = ai.chats.create({
      model: modelId,
      history: mapMessagesToHistory(history),
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7, 
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