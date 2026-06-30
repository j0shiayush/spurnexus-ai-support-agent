export interface ChatSuccessResponse {
    reply: string;
    sessionId: string;
  }
  
  export interface ChatErrorResponse {
    error: string;
    code: string;
  }

  export type ChatApiResult =
    | ({ ok: true } & ChatSuccessResponse)
    | ({ ok: false } & ChatErrorResponse);
  
  const API_BASE_URL =
    (import.meta.env.VITE_API_URL as string | undefined) ??
    "http://localhost:3000";
  
  const CHAT_ENDPOINT = `${API_BASE_URL}/chat/message`;
  
  export async function sendMessage(
    text: string,
    sessionId?: string | null
  ): Promise<ChatApiResult> {
    if (!text.trim()) {
      return {
        ok: false,
        error: "Message cannot be empty.",
        code: "VALIDATION_ERROR",
      };
    }
  
    try {
      const response = await fetch(CHAT_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text.trim(),
          
          sessionId: sessionId ?? null,
        }),
      });

      let body: unknown;
      try {
        body = await response.json();
      } catch {
        return {
          ok: false,
          error: "The server returned an unreadable response. Please try again.",
          code: "PARSE_ERROR",
        };
      }
  
      if (!response.ok) {
        const errBody = body as Partial<ChatErrorResponse>;
        return {
          ok: false,
          error:
            errBody.error ??
            `Server responded with status ${response.status}. Please try again.`,
          code: errBody.code ?? String(response.status),
        };
      }

      const data = body as Partial<ChatSuccessResponse>;
      if (typeof data.reply !== "string" || typeof data.sessionId !== "string") {
        return {
          ok: false,
          error: "Received an unexpected response format from the server.",
          code: "PARSE_ERROR",
        };
      }
  
      return { ok: true, reply: data.reply, sessionId: data.sessionId };
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unknown network error.";
  
      console.error("[API] sendMessage network error:", message);
  
      return {
        ok: false,
        error:
          "Could not reach the support service. Check your connection and try again.",
        code: "NETWORK_ERROR",
      };
    }
  }