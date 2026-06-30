import React from "react";
import { motion } from "framer-motion";

export function TypingIndicator() {
  const dotStyle = {
    width: 6,
    height: 6,
    backgroundColor: "#94a3b8",
    borderRadius: "50%",
  };

  const bounceTransition = (delay: number) => ({
    repeat: Infinity,
    repeatType: "loop" as const,
    duration: 0.8,
    delay: delay,
    ease: "easeInOut",
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      style={{
        display: "flex",
        alignItems: "flex-end",
        gap: 8,
        padding: "4px 0",
      }}
      role="status"
      aria-label="Aria is typing"
    >
      
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: "8px", 
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 2px 8px rgba(91,110,245,0.4)",
          userSelect: "none",
          overflow: "hidden",
        }}
        aria-hidden="true"
      >
        <img
          src="/avatar.png"
          alt="Aria"
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </div>

      
      <div
        style={{
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "18px 18px 18px 4px",
          padding: "14px 16px",
          display: "flex",
          gap: 5,
          alignItems: "center",
          height: 42,
          boxSizing: "border-box",
        }}
      >
        <motion.div style={dotStyle} animate={{ y: [0, -5, 0] }} transition={bounceTransition(0)} />
        <motion.div style={dotStyle} animate={{ y: [0, -5, 0] }} transition={bounceTransition(0.15)} />
        <motion.div style={dotStyle} animate={{ y: [0, -5, 0] }} transition={bounceTransition(0.3)} />
      </div>
    </motion.div>
  );
}