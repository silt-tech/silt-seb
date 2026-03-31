export default function CancelPage() {
  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "linear-gradient(180deg, #faf5ff 0%, #fafbfc 100%)",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    }}>
      <div style={{
        background: "#fff", borderRadius: 16, padding: "48px 40px", maxWidth: 520,
        textAlign: "center", boxShadow: "0 8px 30px rgba(0,0,0,0.08)",
        border: "1px solid #e2e8f0",
      }}>
        <div style={{ fontSize: "48pt", marginBottom: 16 }}>🔙</div>
        <h1 style={{ fontSize: "24pt", fontWeight: 900, marginBottom: 8, color: "#1a1a2e" }}>
          Checkout Cancelled
        </h1>
        <p style={{ fontSize: "13pt", color: "#64748b", marginBottom: 24, lineHeight: 1.6 }}>
          No worries — your checkout was cancelled and you haven&apos;t been charged.
          Come back anytime when you&apos;re ready.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <a
            href="/#pricing"
            style={{
              background: "linear-gradient(135deg, #9333ea, #2563eb)", color: "white",
              padding: "14px 32px", borderRadius: 8, fontWeight: 700, fontSize: "12pt",
              textDecoration: "none", display: "inline-block",
            }}
          >
            View Plans
          </a>
          <a
            href="mailto:info@siltcloud.com?subject=S.E.B. Question"
            style={{ color: "#9333ea", fontWeight: 600, fontSize: "11pt", textDecoration: "none" }}
          >
            Have questions? Contact us
          </a>
        </div>
      </div>
    </div>
  );
}
