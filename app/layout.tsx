import type { Metadata, Viewport } from "next";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "S.E.B. — Sentience Evaluation Battery | SILT",
  description: "The first independent AI behavioral risk assessment. 58 tests, 4 blind judges, DEFCON threat ratings. Know what your AI is becoming.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif", background: "#fafbfc", color: "#1a1a2e", lineHeight: 1.6 }}>
        {children}
      </body>
    </html>
  );
}
