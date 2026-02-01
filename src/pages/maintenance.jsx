import React from "react";

export default function Maintenance() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "#0b0f19",
        color: "#e6e8ee",
        padding: 24,
        fontFamily: "system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: 560,
          width: "100%",
          background: "#121a2a",
          border: "1px solid rgba(255,255,255,.08)",
          borderRadius: 16,
          padding: 28,
          boxShadow: "0 20px 60px rgba(0,0,0,.35)",
        }}
      >
        <h1 style={{ margin: "0 0 12px", fontSize: 28 }}>🛠️ Maintenance Mode</h1>
        <p style={{ margin: "0 0 8px", color: "#b8c0d6", lineHeight: 1.5 }}>
          We’re deploying updates right now.
        </p>
        <p style={{ margin: 0, color: "#b8c0d6", lineHeight: 1.5 }}>
          Please check back soon.
        </p>
      </div>
    </main>
  );
}
