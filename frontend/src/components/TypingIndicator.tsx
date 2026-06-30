import React, { useEffect } from "react";

const ANIMATION_ID = "spur-nexus-bounce-keyframes";

function ensureAnimation() {
  if (document.getElementById(ANIMATION_ID)) return;

  const style = document.createElement("style");
  style.id = ANIMATION_ID;
  style.textContent = `
    @keyframes spurBounce {
      0%, 80%, 100% { transform: translateY(0);   opacity: 0.4; }
      40%            { transform: translateY(-6px); opacity: 1;   }
    }
    @keyframes spurHaloPulse {
      0%, 100% { box-shadow: 0 0 0 3px rgba(91,110,245,0.2); }
      50%       { box-shadow: 0 0 0 6px rgba(91,110,245,0.4); }
    }
  `;
  document.head.appendChild(style);
}

export function TypingIndicator() {
  useEffect(() => {
    ensureAnimation();
  }, []);

  const dotBase: React.CSSProperties = {
    width: 7,
    height: 7,
    borderRadius: "50%",
    background: "#5B6EF5",
    animation: "spurBounce 1.2s ease-in-out infinite",
    display: "inline-block",
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-end",
        gap: 8,
        padding: "2px 0",
      }}
      role="status"
      aria-label="Agent is typing"
    >
    
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
          background: "linear-gradient(135deg, #5B6EF5, #8B5CF6)",
          color: "#fff",
          animation: "spurHaloPulse 1.5s ease-in-out infinite",
          userSelect: "none",
        }}
        aria-hidden="true"
      >
        A
      </div>


      <div
        style={{
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "18px 18px 18px 4px",
          padding: "12px 16px",
          display: "flex",
          alignItems: "center",
          gap: 5,
        }}
      >
        <span style={{ ...dotBase, animationDelay: "0s" }} />
        <span style={{ ...dotBase, animationDelay: "0.2s" }} />
        <span style={{ ...dotBase, animationDelay: "0.4s" }} />
      </div>
    </div>
  );
}