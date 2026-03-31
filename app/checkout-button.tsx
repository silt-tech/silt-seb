"use client";

import { useState } from "react";

interface CheckoutButtonProps {
  planId: string;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}

export function CheckoutButton({ planId, className, style, children }: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Something went wrong");
        setLoading(false);
      }
    } catch {
      alert("Failed to start checkout");
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={className}
      style={{
        ...style,
        cursor: loading ? "wait" : "pointer",
        opacity: loading ? 0.7 : 1,
        border: "none",
        background: "none",
        font: "inherit",
        padding: 0,
        textDecoration: "none",
        display: "block",
        width: "100%",
      }}
    >
      <span
        className={className}
        style={{
          ...style,
          display: "block",
          width: "100%",
          pointerEvents: "none",
        }}
      >
        {loading ? "Redirecting..." : children}
      </span>
    </button>
  );
}
