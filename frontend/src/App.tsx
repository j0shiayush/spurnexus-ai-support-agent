import React, { useState, useRef, useEffect, useCallback } from "react";
import { sendMessage } from "./lib/api";
import { ChatMessage, Message } from "./components/ChatMessage";
import { TypingIndicator } from "./components/TypingIndicator";
import { ChevronDown, RefreshCw, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

let _idCounter = 0;
function nextId() {
  return `msg-${Date.now()}-${++_idCounter}`;
}

const WELCOME_MESSAGE: Message = {
  id: "welcome",
  sender: "ai",
  text: "Hi there! 👋 I'm Aria, your SpurNexus support assistant. What can I do for you today?",
};

function SendIcon({ disabled }: { disabled: boolean }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      style={{ transition: "opacity 0.2s", opacity: disabled ? 0.4 : 1 }}
      aria-hidden="true"
    >
      <path
        d="M22 2L11 13"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M22 2L15 22L11 13L2 9L22 2Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function App() {
    const [sessionId, setSessionId] = useState<string | null>(() => localStorage.getItem("spur_session_id"));
    const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
    const [inputText, setInputText] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [pinnedNotes, setPinnedNotes] = useState<string[]>([]);
    const [showScrollButton, setShowScrollButton] = useState(false);
  
    const listRef = useRef<HTMLDivElement>(null);
    const bottomRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
  
    useEffect(() => {
      if (sessionId) {
        fetch(`http://localhost:3000/chat/history/${sessionId}`)
          .then(res => res.json())
          .then(data => {
            if (Array.isArray(data) && data.length > 0) {
              setMessages([WELCOME_MESSAGE, ...data]);
            }
          })
          .catch(err => console.error("Failed to load history", err));
      }
    }, [sessionId]);
  
    const scrollToBottom = () => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    };
  
    useEffect(() => {
      scrollToBottom();
    }, [messages, isLoading]);
  
    const handleScroll = () => {
      if (!listRef.current) return;
      const { scrollTop, scrollHeight, clientHeight } = listRef.current;
      const isScrolledUp = scrollHeight - scrollTop - clientHeight > 100;
      setShowScrollButton(isScrolledUp);
    };
  
    const handleClearChat = () => {
      setMessages([WELCOME_MESSAGE]);
      setSessionId(null);
      setPinnedNotes([]);
      localStorage.removeItem("spur_session_id"); 
    };
  
    const handleSend = useCallback(async () => {
      const text = inputText.trim();
      if (!text || isLoading) return;
  
      const userMsg: Message = { id: nextId(), sender: "user", text };
      setMessages((prev) => [...prev, userMsg]);
      setInputText("");
      setIsLoading(true);
  
      setTimeout(() => inputRef.current?.focus(), 0);
  
      const result = await sendMessage(text, sessionId);
      setIsLoading(false);
  
      if (result.ok) {
        setSessionId(result.sessionId);
        localStorage.setItem("spur_session_id", result.sessionId); // Save to storage!
        setMessages((prev) => [...prev, { id: nextId(), sender: "ai", text: result.reply }]);
      } else {
        setMessages((prev) => [...prev, { id: nextId(), sender: "error", text: result.error }]);
      }
    }, [inputText, isLoading, sessionId]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  return (
    <div style={styles.page}>
      
      <motion.div 
        layout 
        style={{ ...styles.container, maxWidth: pinnedNotes.length > 0 ? 840 : 480 }}
      >
        
        <div style={styles.shell}>
          <header style={styles.header}>
            <div style={styles.headerAvatar}>A</div>
            <div style={{ flex: 1 }}>
              <div style={styles.headerName}>Aria</div>
              <div style={styles.headerStatus}>
                <span style={styles.statusDot} /> SpurNexus Support
              </div>
            </div>
            <button onClick={handleClearChat} style={styles.iconButton} title="Clear Chat">
              <RefreshCw size={16} />
            </button>
          </header>

          <main 
            ref={listRef} 
            onScroll={handleScroll} 
            style={styles.messageList}
            className="spur-msg-list"
          >
            {messages.map((msg) => (
              <ChatMessage 
                key={msg.id} 
                message={msg} 
                onPin={(text) => setPinnedNotes(prev => [...prev, text])} 
              />
            ))}
            {isLoading && <TypingIndicator />}
            <div ref={bottomRef} style={{ height: 1 }} />
          </main>

          <AnimatePresence>
            {showScrollButton && (
              <motion.button
                initial={{ opacity: 0, y: 10, x: "-50%" }}
                animate={{ opacity: 1, y: 0, x: "-50%" }}
                exit={{ opacity: 0, y: 10, x: "-50%" }}
                onClick={scrollToBottom}
                style={styles.floatingScroll}
                aria-label="Scroll to bottom"
              >
                <ChevronDown size={20} />
              </motion.button>
            )}
          </AnimatePresence>

          <footer style={styles.inputBar}>
            <div style={styles.inputWrapper}>
              <textarea
                ref={inputRef}
                value={inputText}
                onChange={handleInput}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
                placeholder="Type a message…"
                rows={1}
                maxLength={2000}
                aria-label="Message input"
                style={{
                  ...styles.textarea,
                  opacity: isLoading ? 0.5 : 1,
                  cursor: isLoading ? "not-allowed" : "text",
                }}
              />
              <button
                onClick={handleSend}
                disabled={isLoading || !inputText.trim()}
                aria-label="Send message"
                style={{
                  ...styles.sendButton,
                  opacity: isLoading || !inputText.trim() ? 0.45 : 1,
                  cursor: isLoading || !inputText.trim() ? "not-allowed" : "pointer",
                  transform: isLoading || !inputText.trim() ? "scale(0.98)" : "scale(1)",
                }}
              >
                <SendIcon disabled={isLoading || !inputText.trim()} />
              </button>
            </div>
            <p style={styles.hint}>
              Press <kbd style={styles.kbd}>Enter</kbd> to send ·{" "}
              <kbd style={styles.kbd}>Shift + Enter</kbd> for new line
            </p>
          </footer>
        </div>

        <AnimatePresence>
          {pinnedNotes.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, width: 0, marginLeft: 0 }}
              animate={{ opacity: 1, width: 340, marginLeft: 20 }}
              exit={{ opacity: 0, width: 0, marginLeft: 0 }}
              style={styles.scratchpad}
            >
              <div style={styles.scratchpadHeader}>
                <h3 style={{ fontSize: 15, color: "#f1f5f9", fontWeight: 600 }}>Pinned Notes</h3>
                <button onClick={() => setPinnedNotes([])} style={styles.iconButton} title="Clear all pins">
                  <Trash2 size={16} />
                </button>
              </div>
              <div style={styles.scratchpadContent}>
                {pinnedNotes.map((note, idx) => (
                  <motion.div 
                    key={idx} 
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    style={styles.stickyNote}
                  >
                    <p style={{ fontSize: 13, color: "#1e293b", lineHeight: 1.5, wordBreak: "break-word" }}>
                      {note}
                    </p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </motion.div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(145deg, #070B18 0%, #0F1629 60%, #0D1A3A 100%)",
    fontFamily: "-apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    padding: 16,
    boxSizing: "border-box" as const,
  },
  container: {
    display: "flex",
    width: "100%",
    height: "min(680px, 92vh)",
    transition: "max-width 0.3s ease-out",
  },
  shell: {
    flex: 1,
    display: "flex",
    flexDirection: "column" as const,
    borderRadius: 20,
    overflow: "hidden",
    background: "#111827",
    position: "relative" as const,
    boxShadow: "0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06)",
  },

  header: {
    position: "absolute" as const,
    top: 0, left: 0, right: 0, zIndex: 10,
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "14px 18px",
    background: "rgba(26, 36, 68, 0.75)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    borderBottom: "1px solid rgba(255,255,255,0.07)",
  },
  headerAvatar: {
    width: 38,
    height: 38,
    borderRadius: "50%",
    background: "linear-gradient(135deg, #5B6EF5, #8B5CF6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 16,
    fontWeight: 700,
    color: "#fff",
    boxShadow: "0 0 0 3px rgba(91,110,245,0.25)",
  },
  headerName: {
    fontSize: 15,
    fontWeight: 600,
    color: "#f1f5f9",
    lineHeight: 1.3,
  },
  headerStatus: {
    fontSize: 11,
    color: "#64748b",
    display: "flex",
    alignItems: "center",
    gap: 5,
    marginTop: 1,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: "#22c55e",
    display: "inline-block",
    boxShadow: "0 0 0 2px rgba(34,197,94,0.3)",
  },
  iconButton: {
    background: "transparent",
    border: "none",
    color: "#94a3b8",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 6,
    borderRadius: 6,
    transition: "color 0.2s, background 0.2s",
  },

  messageList: {
    flex: 1,
    overflowY: "auto" as const,
    padding: "80px 16px 110px", 
    display: "flex",
    flexDirection: "column" as const,
    gap: 10,
    scrollbarWidth: "none" as const,
  },

  floatingScroll: {
    position: "absolute" as const,
    bottom: 100, 
    left: "50%",
    zIndex: 20,
    background: "rgba(91,110,245,0.9)",
    color: "#fff",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "50%",
    width: 36,
    height: 36,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
    backdropFilter: "blur(4px)",
  },

  inputBar: {
    position: "absolute" as const,
    bottom: 0, left: 0, right: 0, zIndex: 10,
    padding: "12px 14px 10px",
    background: "rgba(15, 22, 41, 0.8)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    borderTop: "1px solid rgba(255,255,255,0.07)",
  },
  inputWrapper: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 14,
    padding: "6px 8px 6px 14px",
    transition: "border-color 0.2s",
  },
  textarea: {
    flex: 1,
    background: "transparent",
    border: "none",
    outline: "none",
    resize: "none" as const,
    color: "#e2e8f0",
    fontSize: 14,
    lineHeight: 1.55,
    fontFamily: "inherit",
    minHeight: 22,
    maxHeight: 120,
    overflowY: "auto" as const,
    padding: 0,
    marginTop: "2px",
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    background: "linear-gradient(135deg, #5B6EF5, #7C3AED)",
    border: "none",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    transition: "opacity 0.2s, transform 0.1s",
    boxShadow: "0 2px 8px rgba(91,110,245,0.4)",
  },
  hint: {
    fontSize: 10,
    color: "#64748b",
    marginTop: 8,
    marginBottom: 0,
    textAlign: "center" as const,
  },
  kbd: {
    background: "rgba(255,255,255,0.08)",
    borderRadius: 3,
    padding: "2px 5px",
    fontFamily: "inherit",
    fontSize: 10,
    color: "#94a3b8",
  },

  scratchpad: {
    display: "flex",
    flexDirection: "column" as const,
    background: "#1e293b",
    borderRadius: 20,
    overflow: "hidden",
    border: "1px solid rgba(255,255,255,0.1)",
    boxShadow: "0 32px 80px rgba(0,0,0,0.4)",
  },
  scratchpadHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 20px",
    borderBottom: "1px solid rgba(255,255,255,0.05)",
    background: "rgba(15, 23, 42, 0.5)",
  },
  scratchpadContent: {
    flex: 1,
    padding: 20,
    overflowY: "auto" as const,
    display: "flex",
    flexDirection: "column" as const,
    gap: 12,
  },
  stickyNote: {
    background: "linear-gradient(135deg, #fef08a, #fde047)",
    padding: 14,
    borderRadius: 8,
    boxShadow: "2px 4px 12px rgba(0,0,0,0.15)",
    borderLeft: "4px solid #eab308",
  }
} satisfies Record<string, React.CSSProperties>;

(function injectGlobalStyles() {
  const id = "spur-nexus-global-styles";
  if (typeof document === "undefined" || document.getElementById(id)) return;

  const style = document.createElement("style");
  style.id = id;
  style.textContent = `
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #070B18; }

    /* Textarea placeholder */
    textarea::placeholder { color: #64748b; }
    textarea:disabled::placeholder { color: #475569; }

    /* Hide webkit scrollbar for sleek glass look */
    .spur-msg-list::-webkit-scrollbar { display: none; }
  `;
  document.head.appendChild(style);
})();