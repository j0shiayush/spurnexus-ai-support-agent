import React, { useState } from "react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { Pin } from "lucide-react";

export type MessageSender = "user" | "ai" | "error";

export interface Message {
  id: string;
  text: string;
  sender: MessageSender;
}

interface ChatMessageProps {
  message: Message;
  onPin?: (text: string) => void;
}

function AgentAvatar({ isError }: { isError: boolean }) {
  return (
    <div
      style={{
        width: 32,
        height: 32,
        borderRadius: "50%",
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 14,
        fontWeight: 700,
        background: isError
          ? "linear-gradient(135deg, #ef4444, #b91c1c)"
          : "linear-gradient(135deg, #5B6EF5, #8B5CF6)",
        color: "#fff",
        boxShadow: isError
          ? "0 0 0 3px rgba(239,68,68,0.2)"
          : "0 0 0 3px rgba(91,110,245,0.2)",
        userSelect: "none",
      }}
      aria-hidden="true"
    >
      {isError ? "!" : "A"}
    </div>
  );
}

export function ChatMessage({ message, onPin }: ChatMessageProps) {
  const [isHovered, setIsHovered] = useState(false);
  const isUser = message.sender === "user";
  const isError = message.sender === "error";

  const messageVariants = {
    hidden: { opacity: 0, y: 15, scale: 0.95 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { type: "spring", stiffness: 250, damping: 20 } 
    }
  };

  if (isUser) {
    return (
      <motion.div
        variants={messageVariants}
        initial="hidden"
        animate="visible"
        style={{ display: "flex", justifyContent: "flex-end", padding: "4px 0" }}
        role="listitem"
      >
        <div
          style={{
            maxWidth: "72%",
            background: "linear-gradient(135deg, #5B6EF5, #7C3AED)",
            color: "#fff",
            borderRadius: "18px 18px 4px 18px",
            padding: "10px 15px",
            fontSize: 14,
            lineHeight: 1.55,
            boxShadow: "0 2px 8px rgba(91,110,245,0.35)",
            wordBreak: "break-word",
          }}
        >
          {message.text}
        </div>
      </motion.div>
    );
  }
  
  return (
    <motion.div
      variants={messageVariants}
      initial="hidden"
      animate="visible"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ display: "flex", alignItems: "flex-end", gap: 8, padding: "4px 0", position: "relative" }}
      role="listitem"
    >
      <AgentAvatar isError={isError} />

      <div
        style={{
          maxWidth: "72%",
          background: isError ? "rgba(239,68,68,0.12)" : "rgba(255,255,255,0.06)",
          color: isError ? "#fca5a5" : "#e2e8f0",
          border: isError ? "1px solid rgba(239,68,68,0.25)" : "1px solid rgba(255,255,255,0.08)",
          borderRadius: "18px 18px 18px 4px",
          padding: "10px 15px",
          fontSize: 14,
          lineHeight: 1.55,
          wordBreak: "break-word",
          position: "relative"
        }}
      >
        <ReactMarkdown
          components={{
            p: ({ node, ...props }) => <p style={{ margin: "0 0 8px 0" }} {...props} />,
            a: ({ node, ...props }) => <a style={{ color: "#5B6EF5", textDecoration: "underline" }} {...props} />,
            strong: ({ node, ...props }) => <strong style={{ fontWeight: 600, color: "#fff" }} {...props} />,
          }}
        >
          {message.text}
        </ReactMarkdown>

        {!isError && onPin && isHovered && (
          <button
            onClick={() => onPin(message.text)}
            style={{
              position: "absolute",
              top: -12,
              right: -12,
              background: "#1A2444",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "50%",
              width: 28,
              height: 28,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "#5B6EF5",
              boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
              zIndex: 10
            }}
            title="Pin to Scratchpad"
          >
            <Pin size={14} />
          </button>
        )}
      </div>
    </motion.div>
  );
}