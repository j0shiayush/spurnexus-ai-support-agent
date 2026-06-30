import { Router } from "express";
import { handleChatMessage } from "../controllers/chatController";
import prisma from "../services/db";

const router = Router();

router.post("/message", handleChatMessage);

router.get("/history/:sessionId", async (req, res) => {
  try {
    const messages = await prisma.message.findMany({
      where: { conversationId: req.params.sessionId },
      orderBy: { timestamp: "asc" },
      select: { id: true, text: true, sender: true }
    });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch history" });
  }

});

router.post("/webhook/whatsapp", async (req, res) => {

    res.status(501).json({ 
      message: "WhatsApp webhook architecture is prepared but not yet implemented." 
    });
  });

export default router;