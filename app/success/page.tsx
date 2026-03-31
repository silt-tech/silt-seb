"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function SuccessContent() {
  const params = useSearchParams();
  const sessionId = params.get("session_id");

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "linear-gradient(180deg, #faf5ff 0%, #fafbfc 100%)",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    }}>
      <div style={{
        background: "#fff", borderRadius: 16, padding: "48px 40px", maxWidth: 520,
        textAlign: "center", boxShadow: "0 8px 30px rgba(0,0,0,0.08)",
        border: "1px solid #e2e8f0", borderTop: "4px solid #059669",
      }}>
        <div style={{ fontSize: "48pt", marginBottom: 16 }}>✅</div>
        <h1 style={{ fontSize: "24pt", fontWeight: 900, marginBottom: 8, color: "#1a1a2e" }}>
          Subscription Active
        </h1>
        <p style={{ fontSize: "13pt", color: "#64748b", marginBottom: 24, lineHeight: 1.6 }}>
          Your S.E.B. subscription is now active. Check your email for login credentials
          to access the client portal.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <a
            href="https://sentienceevaluationbattery.com/client"
            style={{
              background: "linear-gradient(135deg, #9333ea, #2563eb)", color: "white",
              padding: "14px 32px", borderRadius: 8, fontWeight: 700, fontSize: "12pt",
              textDecoration: "none", display: "inline-block",
              transition: "transform 0.2s, box-shadow 0.2s",
            }}
          >
            Go to Client Portal →
          </a>
          <a
            href="/"
            style={{ color: "#9333ea", fontWeight: 600, fontSize: "11pt", textDecoration: "none" }}
          >
            ← Back to silt-seb.com
          </a>
        </div>
        {sessionId && (
          <p style={{ fontSize: "8pt", color: "#cbd5e1", marginTop: 24, fontFamily: "monospace" }}>
            Session: {sessionId.slice(0, 20)}...
          </p>
        )}
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}>
        Loading...
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
