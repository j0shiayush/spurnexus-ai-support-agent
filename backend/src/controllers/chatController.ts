import { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";

import prisma from "../services/db";
import {
  getCachedConversationHistory,
  cacheConversationHistory,
  invalidateConversationCache,
  CachedMessage,
} from "../services/redisService";
import { generateAgentReply, LlmServiceError } from "../services/llmService";

interface ChatRequestBody {
  message: string;
  sessionId?: string | null;
}

interface ChatSuccessResponse {
  reply: string;
  sessionId: string;
}

interface ChatErrorResponse {
  error: string;
  code: string;
  details?: string; 
}

function toCache(msg: {
  id: string;
  text: string;
  sender: string;
  timestamp: Date;
  conversationId: string;
}): CachedMessage {
  return {
    id: msg.id,
    text: msg.text,
    sender: msg.sender as CachedMessage["sender"],
    timestamp: msg.timestamp.toISOString(),
    conversationId: msg.conversationId,
  };
}

export async function handleChatMessage(
  req: Request<unknown, ChatSuccessResponse | ChatErrorResponse, ChatRequestBody>,
  res: Response<ChatSuccessResponse | ChatErrorResponse>
): Promise<void> {
  console.log("\n--- [STEP 1] Request Received ---");
  
  const { message, sessionId: incomingSessionId } = req.body;

  if (!message || typeof message !== "string" || message.trim() === "") {
    res.status(400).json({
      error: "Request body must include a non-empty `message` string.",
      code: "VALIDATION_ERROR",
    });
    return;
  }

  if (message.length > 2000) {
    res.status(400).json({
      error: "Your message is too long. Please keep it under 2000 characters.",
      code: "VALIDATION_ERROR",
    });
    return;
  }

  const trimmedMessage = message.trim();

  try {
    console.log(`--- [STEP 2] Resolving Session (Incoming ID: ${incomingSessionId || "None"}) ---`);
    let sessionId: string;

    if (incomingSessionId) {
      const existing = await prisma.conversation.findUnique({
        where: { id: incomingSessionId },
        select: { id: true },
      });

      if (!existing) {
        console.log("--- [STEP 2 ERROR] Invalid Session ID ---");
        res.status(400).json({
          error: `Conversation with sessionId "${incomingSessionId}" does not exist.`,
          code: "VALIDATION_ERROR",
        });
        return;
      }
      sessionId = existing.id;
    } else {
      const conversation = await prisma.conversation.create({ data: {} });
      sessionId = conversation.id;
      console.log(`--- [STEP 2 SUCCESS] Created new conversation "${sessionId}" ---`);
    }

    console.log("--- [STEP 3] Persisting User Message to DB ---");
    await prisma.message.create({
      data: {
        id: uuidv4(),
        text: trimmedMessage,
        sender: "user",
        conversationId: sessionId,
      },
    });
    console.log("--- [STEP 3 SUCCESS] User message saved ---");

    console.log("--- [STEP 4] Hydrating History (Redis -> DB Fallback) ---");
    let history: CachedMessage[];
    const cached = await getCachedConversationHistory(sessionId);

    if (cached !== null) {
      history = [
        ...cached,
        {
          id: uuidv4(),
          text: trimmedMessage,
          sender: "user",
          timestamp: new Date().toISOString(),
          conversationId: sessionId,
        },
      ];
      console.log(`--- [STEP 4 SUCCESS] Hydrated from Redis ---`);
    } else {
      console.log("--- [STEP 4A] Cache miss, querying DB... ---");
      const dbMessages = await prisma.message.findMany({
        where: { conversationId: sessionId },
        orderBy: { timestamp: "asc" },
      });
      history = dbMessages.map(toCache);
      
      console.log("--- [STEP 4B] Caching fresh DB history... ---");
      await cacheConversationHistory(sessionId, history);
      console.log(`--- [STEP 4 SUCCESS] Hydrated from DB ---`);
    }

    console.log("--- [STEP 5] Calling Gemini API ---");
    const priorHistory = history.slice(0, -1);
    
    const aiReplyText = await generateAgentReply(priorHistory, trimmedMessage);
    console.log("--- [STEP 5 SUCCESS] Gemini API Responded ---");

    console.log("--- [STEP 6] Persisting AI Reply to DB ---");
    await prisma.message.create({
      data: {
        id: uuidv4(),
        text: aiReplyText,
        sender: "ai",
        conversationId: sessionId,
      },
    });
    console.log("--- [STEP 6 SUCCESS] AI reply saved ---");

    console.log("--- [STEP 7] Invalidating Stale Cache ---");
    await invalidateConversationCache(sessionId);
    console.log("--- [STEP 7 SUCCESS] Cache invalidated ---");

    console.log("--- [STEP 8] Sending 200 Response ---");
    res.status(200).json({ reply: aiReplyText, sessionId });

  } catch (err: any) {
    console.error("\n[FATAL CONTROLLER ERROR DETECTED]:", err.message || err);

    if (err instanceof LlmServiceError) {
      res.status(500).json({
        error: "Our AI assistant is temporarily unavailable. Please try again in a moment.",
        code: "LLM_ERROR",
        details: err.message
      });
      return;
    }

    res.status(500).json({
      error: "An unexpected error occurred while processing your message. Please try again.",
      code: "INTERNAL_ERROR",
      details: err.message
    });
  }
}