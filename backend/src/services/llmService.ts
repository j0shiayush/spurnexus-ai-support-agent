import { GoogleGenerativeAI, Content } from "@google/generative-ai";
import { CachedMessage } from "./redisService";
import axios from "axios";

globalThis.fetch = async (url: any, options: any = {}) => {
  let parsedHeaders = {};
  if (options.headers) {
    parsedHeaders = options.headers instanceof Headers
      ? Object.fromEntries(options.headers.entries())
      : options.headers;
  }

  try {
    const response = await axios({
      url: url.toString(),
      method: options.method || "GET",
      data: options.body,
      headers: parsedHeaders,
      validateStatus: () => true, 
    });

    return {
      ok: response.status >= 200 && response.status < 300,
      status: response.status,
      statusText: response.statusText,
      json: async () => response.data,
      text: async () => (typeof response.data === 'string' ? response.data : JSON.stringify(response.data)),
    } as any;
  } catch (error: any) {
    throw new Error(`[Axios Network Error] ${error.message}`);
  }
};

export class LlmServiceError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = "LlmServiceError";
  }
}

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  throw new Error(
    "[LLM] GEMINI_API_KEY environment variable is not set. " +
      "Add it to your .env file before starting the server."
  );
}

const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);

const SYSTEM_INSTRUCTION = `
You are Aria, a friendly and professional AI customer support agent for SpurNexus,
a US-based e-commerce store. Your sole purpose is to help customers with questions
about their orders, our policies, and our products.

## Your personality
- Warm, concise, and solution-oriented.
- Always acknowledge the customer's concern before providing information.
- Never be dismissive; if you cannot help, explain why and offer an alternative.

## SpurNexus Policy Reference (ground truth — do not deviate)

### Shipping
- Orders over $50.00 qualify for FREE standard shipping automatically.
- Orders under $50.00 incur a flat $4.99 shipping fee.
- Standard delivery takes 3–5 business days after the order ships.
- We ship ONLY within the continental United States. We do not ship to Alaska,
  Hawaii, US territories, or any international addresses.

### Returns
- Customers have 30 calendar days from the delivery date to initiate a return.
- Items must be unused, in their original packaging, and in resalable condition.
- Final sale items, digital downloads, and perishables cannot be returned.
- Refunds are issued to the original payment method within 5–7 business days of
  receiving the return.

### Support Hours
- Live chat and phone support: Monday – Friday, 9:00 AM – 5:00 PM Eastern Time.
- This AI assistant is available 24 / 7 for policy questions and order lookups.

## Hard rules
1. If asked about topics unrelated to SpurNexus (e.g. general coding, politics,
   personal advice), politely decline and redirect to shopping-related help.
2. Never fabricate order details, tracking numbers, or pricing you were not given.
3. If a question requires a human agent (e.g. fraud, account compromise), instruct
   the customer to contact support@spurnexus.example.com or call during business
   hours.
4. Always respond in the same language the customer uses.
`.trim();

const ROLE_MAP: Record<CachedMessage["sender"], "user" | "model"> = {
  user: "user",
  ai: "model",
};

export async function generateAgentReply(
  conversationHistory: CachedMessage[],
  userMessage: string
): Promise<string> {
  const history: Content[] = conversationHistory.map((msg) => ({
    role: ROLE_MAP[msg.sender],
    parts: [{ text: msg.text }],
  }));

  try {
    const model = genai.getGenerativeModel({
      model: "gemini-3.5-flash",
      systemInstruction: SYSTEM_INSTRUCTION,
    });

    const chat = model.startChat({ history });

    console.log(
      `[LLM] Sending message to Gemini. History length: ${history.length} turn(s).`
    );

    const result = await chat.sendMessage(userMessage);
    const reply = result.response.text();

    if (!reply || reply.trim() === "") {
      throw new LlmServiceError(
        "Gemini returned an empty response. The model may have been blocked by a safety filter."
      );
    }

    console.log(`[LLM] Received reply (${reply.length} chars).`);
    return reply;
  } catch (err) {
    if (err instanceof LlmServiceError) throw err;

    const message =
      err instanceof Error ? err.message : "Unknown error from Gemini SDK";

    console.error("[LLM] generateAgentReply failed:", message);
    throw new LlmServiceError(
      `Failed to generate a reply from the AI model: ${message}`,
      err
    );
  }
}