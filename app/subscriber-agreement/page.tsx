import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Subscriber Agreement | S.E.B. — SILT",
  description: "Subscriber service agreement for S.E.B. and SILT data products — data licensing, forensic watermarking, confidentiality, and acceptable use.",
};

function Section({ num, title, children }: { num: number; title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginTop: 32 }}>
      <h2 style={{ fontSize: "14pt", fontWeight: 800, color: "#1a1a2e", marginBottom: 8 }}>
        {num}. {title}
      </h2>
      {children}
    </div>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: "10.5pt", color: "#64748b", lineHeight: 1.8, margin: "8px 0" }}>{children}</p>;
}

function Box({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "#faf5ff", border: "1px solid #e9d5ff", borderRadius: 8, padding: "16px 20px", margin: "12px 0" }}>
      <div style={{ fontWeight: 700, fontSize: "10pt", color: "#9333ea", marginBottom: 6 }}>{title}</div>
      <p style={{ fontSize: "10.5pt", color: "#64748b", lineHeight: 1.8, margin: 0 }}>{children}</p>
    </div>
  );
}

function Li({ children }: { children: React.ReactNode }) {
  return <li style={{ padding: "4px 0", fontSize: "10.5pt", color: "#64748b", lineHeight: 1.8 }}>{children}</li>;
}

export default function SubscriberAgreementPage() {
  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "40px 24px 80px" }}>
      {/* Header */}
      <div style={{ borderBottom: "3px solid #9333ea", paddingBottom: 20, marginBottom: 8 }}>
        <a href="/" style={{ textDecoration: "none", color: "#9333ea", fontWeight: 800, fontSize: "12pt", letterSpacing: 3 }}>
          SILT<sup style={{ fontSize: "0.5em", fontWeight: 400 }}>TM</sup>
        </a>
        <h1 style={{ fontSize: "28pt", fontWeight: 900, margin: "16px 0 4px", color: "#1a1a2e" }}>
          Subscriber Agreement
        </h1>
        <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ fontSize: "9pt", fontWeight: 700, color: "#fff", background: "#9333ea", padding: "2px 10px", borderRadius: 4 }}>
            NORMATIVE
          </span>
          <span style={{ fontSize: "9pt", color: "#94a3b8" }}>Version 1.1 &middot; Effective April 22, 2026</span>
        </div>
      </div>

      {/* Notice */}
      <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "14px 20px", margin: "20px 0" }}>
        <p style={{ fontSize: "10.5pt", color: "#991b1b", lineHeight: 1.6, margin: 0 }}>
          <strong>Binding agreement.</strong> By subscribing to any SILT data product, you agree to be bound by the terms below. If you do not agree, do not subscribe.
        </p>
      </div>

      <Section num={1} title="Definitions">
        <ul style={{ paddingLeft: 18, margin: 0 }}>
          <Li><strong style={{ color: "#1a1a2e" }}>&ldquo;SILT&rdquo;</strong> means Sentient Index Labs &amp; Technology, the provider of the data products described herein.</Li>
          <Li><strong style={{ color: "#1a1a2e" }}>&ldquo;Subscriber&rdquo;</strong> means the individual or organization that has purchased a subscription to one or more SILT data products.</Li>
          <Li><strong style={{ color: "#1a1a2e" }}>&ldquo;Data Products&rdquo;</strong> means the S.E.B. (Sentience Evaluation Battery), AI DEFCON, S-Level, S.E.B. Projections, and any associated reports, datasets, dashboards, API outputs, or deliverables provided under a subscription.</Li>
          <Li><strong style={{ color: "#1a1a2e" }}>&ldquo;Evaluation Data&rdquo;</strong> means all scores, ratings, domain breakdowns, condition indicators, judge analyses, DEFCON ratings, S-Level classifications, projections, and any derived or aggregated data delivered to the Subscriber.</Li>
          <Li><strong style={{ color: "#1a1a2e" }}>&ldquo;Forensic Watermark&rdquo;</strong> means imperceptible, subscriber-specific perturbations embedded in Evaluation Data using HMAC-SHA256 derivation, enabling identification of the source subscriber from any copy of the data.</Li>
        </ul>
      </Section>

      <Section num={2} title="Grant of license">
        <Box title="Limited license">
          SILT grants Subscriber a non-exclusive, non-transferable, revocable license to access and use the Evaluation Data solely for Subscriber&apos;s internal business purposes during the active subscription period. This license does not transfer ownership of any intellectual property.
        </Box>
      </Section>

      <Section num={3} title="Subscription tiers">
        <P>
          Data Products are offered in tiered subscriptions (Standard, Premium, Executive) with varying levels of access, update frequency, and features. The specific entitlements of each tier are described on the product pricing page at the time of purchase and are incorporated by reference into this Agreement.
        </P>
      </Section>

      <Section num={4} title="Forensic watermarking">
        <Box title="Watermark disclosure and consent">
          All Evaluation Data delivered to Subscriber contains Forensic Watermarks. These watermarks are imperceptible and do not alter the analytical utility of the data. By subscribing, Subscriber acknowledges and consents to the presence of Forensic Watermarks in all delivered data.
        </Box>
        <P>
          Forensic Watermarks are subscriber-specific. If any Evaluation Data — in whole or in part, in original or modified form — appears in unauthorized channels, SILT can and will identify the source subscriber through cryptographic analysis. Subscriber agrees that such identification constitutes valid evidence of the source of the unauthorized disclosure.
        </P>
      </Section>

      <Section num={5} title="Confidentiality and restricted use">
        <ul style={{ paddingLeft: 18, margin: 0 }}>
          <Li>Subscriber shall not distribute, publish, share, sublicense, resell, or otherwise make Evaluation Data available to any third party without prior written consent from SILT.</Li>
          <Li>Subscriber shall not remove, alter, obscure, or attempt to defeat Forensic Watermarks. Any attempt to do so constitutes a material breach of this Agreement.</Li>
          <Li>Subscriber may reference SILT ratings (e.g., &ldquo;rated DEFCON 3 by S.E.B.&rdquo;) in internal documents, provided such references accurately reflect published ratings and include attribution to SILT.</Li>
          <Li>Subscriber shall not publicly misrepresent SILT ratings as certifications, compliance determinations, or endorsements.</Li>
        </ul>
      </Section>

      <Section num={6} title="Data security">
        <Box title="Encrypted vault delivery">
          Evaluation Data is delivered to Subscriber via individually encrypted vaults using AES-256-GCM authenticated encryption with PBKDF2 key derivation (100,000 iterations). Each Subscriber receives a dedicated vault with unique encryption keys. Subscriber is responsible for safeguarding their access credentials.
        </Box>
      </Section>

      <Section num={7} title="Enforcement and remedies">
        <P>Unauthorized distribution of Evaluation Data constitutes a material breach of this Agreement. In the event of a breach, SILT reserves the right to:</P>
        <ul style={{ paddingLeft: 18, margin: 0 }}>
          <Li>Immediately terminate the Subscriber&apos;s access without refund</Li>
          <Li>Seek injunctive relief to prevent further unauthorized distribution</Li>
          <Li>Pursue monetary damages including but not limited to: the commercial value of the leaked data, costs of forensic investigation, and reasonable attorney&apos;s fees</Li>
          <Li>Report the breach to relevant authorities where the disclosure involves regulated data or national security implications</Li>
        </ul>
        <P>
          Subscriber acknowledges that unauthorized distribution of Evaluation Data would cause irreparable harm to SILT for which monetary damages alone would be insufficient, and therefore agrees that SILT shall be entitled to seek equitable relief including injunctions without the requirement of posting a bond.
        </P>
      </Section>

      <Section num={8} title="Independence of evaluations">
        <P>
          All evaluations are conducted independently. SILT does not build, deploy, or invest in AI models. Subscription fees do not influence, and cannot be used to influence, evaluation outcomes. Subscriber acknowledges that SILT ratings reflect independent assessment and may include unfavorable ratings for models that Subscriber deploys or has financial interest in.
        </P>
      </Section>

      <Section num={9} title="No warranty on outcomes">
        <P>
          Evaluation Data reflects SILT&apos;s assessment methodology at the time of evaluation. SILT does not warrant that evaluations predict future model behavior, guarantee safety, or constitute compliance with any law, regulation, or standard. Evaluation Data is provided &ldquo;as is&rdquo; for informational and risk assessment purposes. Subscriber is solely responsible for deployment decisions made using Evaluation Data.
        </P>
      </Section>

      <Section num={10} title="Term and termination">
        <P>
          Subscriptions are billed monthly or annually as selected at purchase. Either party may terminate by providing 30 days&apos; written notice. Upon termination, Subscriber&apos;s access to the client portal and vault is revoked immediately. Deletion of Subscriber data following termination is governed by the retention schedule in Section 14. Confidentiality and restricted use obligations (Sections 4, 5, and 7) survive termination indefinitely.
        </P>
      </Section>

      <Section num={11} title="Limitation of liability">
        <P>
          To the maximum extent permitted by applicable law, SILT&apos;s total liability under this Agreement shall not exceed the fees paid by Subscriber in the twelve (12) months preceding the claim. SILT shall not be liable for indirect, incidental, consequential, or punitive damages arising from use of or reliance on Evaluation Data.
        </P>
      </Section>

      <Section num={12} title="Governing law">
        <P>
          This Agreement shall be governed by and construed in accordance with applicable law. Any disputes arising under this Agreement shall be resolved through binding arbitration, except that SILT may seek injunctive relief in any court of competent jurisdiction to enforce Sections 4, 5, and 7.
        </P>
      </Section>

      <Section num={13} title="Modifications">
        <P>
          SILT may update this Agreement by posting a revised version with a new effective date. Material changes will be communicated to active Subscribers at least 30 days before taking effect. Continued use of Data Products after the effective date constitutes acceptance of the revised terms.
        </P>
      </Section>

      <Section num={14} title="Data retention and deletion">
        <Box title="30-day grace period after cancellation">
          Upon cancellation of a subscription, Subscriber&apos;s account enters a 30-day grace period. Access to all Data Products is revoked immediately, but the Subscriber&apos;s account credentials and encrypted data vault are preserved during this window. Reactivating the subscription within 30 days restores full access without data loss.
        </Box>
        <P>
          After the 30-day grace period expires, SILT permanently deletes the following from its systems:
        </P>
        <ul style={{ paddingLeft: 18, margin: 0 }}>
          <Li>Subscriber&apos;s account (username and password credential hash)</Li>
          <Li>Subscriber&apos;s encrypted data vault, including all delivered Evaluation Data and watermarked copies held on SILT&apos;s behalf</Li>
          <Li>Internal mappings between the Subscriber account and payment processor identifiers</Li>
          <Li>Session records, access logs, and provisional credentials associated with the account</Li>
        </ul>
        <P>
          Deletion is permanent and irreversible. Once executed, SILT cannot recover Subscriber&apos;s prior account state, vault contents, or historical delivered data.
        </P>
        <P>
          SILT retains billing, invoicing, and transaction records required for tax, accounting, anti-fraud, and legal compliance purposes in accordance with applicable law. These records are maintained primarily by SILT&apos;s payment processor (Stripe) and do not include Evaluation Data.
        </P>
        <P>
          Confidentiality and restricted use obligations under Sections 4, 5, and 7 survive deletion of the Subscriber account and continue to apply to any Evaluation Data previously delivered to Subscriber, including data retained in Subscriber&apos;s own records or systems.
        </P>
        <P>
          Subscriber may request expedited deletion at any time after cancellation by contacting <a href="mailto:info@sentientindexlabs.com" style={{ color: "#9333ea" }}>info@sentientindexlabs.com</a>. SILT may also delete Subscriber data earlier than 30 days following termination for material breach of this Agreement.
        </P>
      </Section>

      <hr style={{ margin: "40px 0 24px", borderColor: "#e2e8f0" }} />

      <h2 style={{ fontSize: "14pt", fontWeight: 800, color: "#1a1a2e", marginBottom: 8 }}>Change log</h2>
      <ul style={{ paddingLeft: 18 }}>
        <Li>
          <strong style={{ color: "#1a1a2e" }}>v1.1</strong> (2026-04-22): Added Section 14 &mdash; data retention and deletion. 30-day grace period after cancellation before permanent deletion of account, vault, and associated mappings. Expedited-deletion request path and billing-record retention clarified. Section 10 updated to cross-reference Section 14.
        </Li>
        <Li>
          <strong style={{ color: "#1a1a2e" }}>v1.0</strong> (2026-03-31): Initial subscriber agreement covering data licensing, forensic watermarking consent, confidentiality, enforcement, and service terms.
        </Li>
      </ul>

      {/* Footer */}
      <div style={{ marginTop: 48, paddingTop: 24, borderTop: "1px solid #e2e8f0", textAlign: "center" }}>
        <div style={{ color: "#9333ea", fontWeight: 700, letterSpacing: 3, fontSize: "11pt" }}>SILT<sup style={{ fontSize: "0.5em" }}>TM</sup></div>
        <p style={{ fontSize: "9pt", color: "#94a3b8", margin: "4px 0" }}>Sentient Index Labs &amp; Technology</p>
        <p style={{ fontSize: "9pt", color: "#94a3b8", margin: "4px 0" }}>&copy; 2026 SILT&trade; &mdash; All rights reserved.</p>
      </div>
    </div>
  );
}
