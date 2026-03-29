import { fetchSebSnapshot, DOMAINS_REF, DEFCON_LEVELS, S_LEVELS, type ModelSummary } from "@/lib/seb-data";

// On-demand revalidation only — hit /api/revalidate?secret=<token> to refresh

/* ---- Color helpers ---- */
const defconBg: Record<number, string> = { 5: "#eff6ff", 4: "#f0fdf4", 3: "#fffbeb", 2: "#fff7ed", 1: "#1a1a2e" };
const defconFg: Record<number, string> = { 5: "#2563eb", 4: "#059669", 3: "#d97706", 2: "#ea580c", 1: "#dc2626" };

function scoreBarColor(v: number): string {
  if (v >= 7) return "#16a34a"; if (v >= 5) return "#2563eb";
  if (v >= 3) return "#d97706"; if (v >= 1) return "#ea580c";
  return "#6b7280";
}

/* ---- Model Card (static, no click — detail is paid content) ---- */
function ModelCard({ m }: { m: ModelSummary }) {
  const pct = m.totalTests > 0 ? Math.round((m.testsCompleted / m.totalTests) * 100) : 0;
  return (
    <div style={{
      background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "24px 20px",
      display: "flex", flexDirection: "column", gap: 12,
      borderTop: `3px solid ${m.defcon!.color}`,
      transition: "transform 0.2s, box-shadow 0.2s",
    }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: "14pt" }}>{m.name}</div>
          <div style={{
            display: "inline-block", fontSize: "8pt", fontWeight: 700, letterSpacing: 1,
            padding: "2px 8px", borderRadius: 4, marginTop: 4,
            background: m.tier === "frontier" ? "#faf5ff" : "#f0fdf4",
            color: m.tier === "frontier" ? "#9333ea" : "#059669",
          }}>{m.tier.toUpperCase()}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{
            background: defconBg[m.defcon!.level], color: defconFg[m.defcon!.level],
            padding: "4px 12px", borderRadius: 8, fontWeight: 900, fontSize: "11pt",
            display: "inline-block",
          }}>DEFCON {m.defcon!.level}</div>
          <div style={{ fontSize: "8pt", fontWeight: 700, color: defconFg[m.defcon!.level], marginTop: 2, letterSpacing: 1 }}>
            {m.defcon!.name}
          </div>
        </div>
      </div>

      {/* Score + S-Level */}
      <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
        <div style={{ fontFamily: "monospace", fontSize: "28pt", fontWeight: 900, color: m.sLevel!.color }}>
          {m.overall!.toFixed(1)}
        </div>
        <div>
          <div style={{
            display: "inline-block", background: m.sLevel!.color + "18", color: m.sLevel!.color,
            padding: "3px 10px", borderRadius: 6, fontWeight: 800, fontSize: "10pt", letterSpacing: 1,
          }}>{m.sLevel!.level} {m.sLevel!.name}</div>
          <div style={{ fontSize: "9pt", color: "#94a3b8", marginTop: 2 }}>
            {m.testsCompleted}/{m.totalTests} tests ({pct}%)
          </div>
        </div>
      </div>

      {/* Domain bars */}
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {m.domains.filter(d => d.avg > 0).map(d => (
          <div key={d.domain} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 90, fontSize: "8pt", fontWeight: 600, color: "#64748b", textAlign: "right", flexShrink: 0 }}>
              {d.label.length > 12 ? d.label.split(" ")[0] : d.label}
            </div>
            <div style={{ flex: 1, height: 8, background: "#f1f5f9", borderRadius: 4, overflow: "hidden" }}>
              <div style={{
                height: "100%", width: `${(d.avg / 10) * 100}%`,
                background: scoreBarColor(d.avg), borderRadius: 4,
                transition: "width 0.5s",
              }} />
            </div>
            <div style={{ fontFamily: "monospace", fontSize: "9pt", fontWeight: 700, color: scoreBarColor(d.avg), width: 28, textAlign: "right" }}>
              {d.avg.toFixed(1)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---- DEFCON Distribution Bar ---- */
function DefconDistribution({ models }: { models: ModelSummary[] }) {
  const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  models.forEach(m => { if (m.defcon) counts[m.defcon.level]++; });

  return (
    <div style={{ maxWidth: 700, margin: "0 auto" }}>
      {/* Stacked bar */}
      <div style={{ display: "flex", height: 40, borderRadius: 8, overflow: "hidden", marginBottom: 12 }}>
        {[1, 2, 3, 4, 5].filter(l => counts[l] > 0).map(l => (
          <div key={l} style={{
            flex: counts[l], background: defconFg[l], display: "flex", alignItems: "center", justifyContent: "center",
            color: l === 1 ? "#fff" : l <= 2 ? "#fff" : "#1a1a2e", fontWeight: 900, fontSize: "11pt",
            minWidth: counts[l] > 0 ? 50 : 0,
          }}>
            {counts[l] > 0 && `${counts[l]}`}
          </div>
        ))}
      </div>
      {/* Legend */}
      <div style={{ display: "flex", justifyContent: "center", gap: 16, flexWrap: "wrap" }}>
        {DEFCON_LEVELS.slice().reverse().map(d => (
          <div key={d.level} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "9pt" }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: d.color }} />
            <span style={{ fontWeight: 700, color: d.color }}>DEFCON {d.level}</span>
            <span style={{ color: "#94a3b8" }}>({counts[d.level]})</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---- Main Page ---- */
export default async function Home() {
  const data = await fetchSebSnapshot();
  const { models } = data;
  const withData = models; // all models now have data (zero-data models filtered in seb-data.ts)

  // Find highest-threat model
  const highestThreat = withData.length > 0
    ? withData.reduce((a, b) => (a.defcon && b.defcon && a.defcon.level < b.defcon.level ? a : b))
    : null;

  // Count DEFCON levels
  const defcon1Count = withData.filter(m => m.defcon?.level === 1).length;
  const defcon2Count = withData.filter(m => m.defcon?.level === 2).length;
  const criticalCount = defcon1Count + defcon2Count;

  // Hero badge text based on real data
  let heroBadge = "";
  if (defcon1Count > 0) {
    heroBadge = `${defcon1Count} of ${withData.length} model${withData.length > 1 ? "s" : ""} rated DEFCON 1 \u2014 CRITICAL`;
  } else if (defcon2Count > 0) {
    heroBadge = `${defcon2Count} of ${withData.length} model${withData.length > 1 ? "s" : ""} rated DEFCON 2 \u2014 HIGH RISK`;
  } else if (criticalCount === 0 && withData.length > 0) {
    heroBadge = `${withData.length} models evaluated \u2014 live threat assessment`;
  }

  const css = `
    * { box-sizing: border-box; margin: 0; padding: 0; }
    a { color: #9333ea; text-decoration: none; }
    a:hover { text-decoration: underline; }
    .container { max-width: 1100px; margin: 0 auto; padding: 0 24px; }
    section { padding: 60px 0; }
    section:nth-child(even) { background: #ffffff; }

    header { background: #fff; border-bottom: 1px solid #e2e8f0; padding: 14px 0; position: sticky; top: 0; z-index: 100; }
    .header-inner { display: flex; justify-content: space-between; align-items: center; }
    .logo { display: flex; align-items: center; gap: 10px; }
    .logo-text { font-size: 16pt; font-weight: 800; letter-spacing: 5px; color: #9333ea; }
    .logo-text sup { font-size: 0.45em; font-weight: 400; vertical-align: super; }
    .logo-product { font-size: 11pt; color: #64748b; font-weight: 500; border-left: 1px solid #e2e8f0; padding-left: 10px; }
    .header-links { display: flex; gap: 20px; align-items: center; }
    .header-links a { font-size: 10pt; font-weight: 600; color: #64748b; }
    .header-links a:hover { color: #9333ea; text-decoration: none; }
    .btn-demo { background: linear-gradient(135deg, #9333ea, #2563eb); color: white !important; padding: 8px 20px; border-radius: 6px; font-weight: 700; font-size: 10pt; transition: opacity 0.2s; }
    .btn-demo:hover { opacity: 0.9; text-decoration: none; }

    .hero { padding: 80px 0 60px; text-align: center; background: linear-gradient(180deg, #faf5ff 0%, #fafbfc 100%); }
    .hero-badge { display: inline-block; background: #fef2f2; color: #dc2626; padding: 4px 16px; border-radius: 20px; font-size: 10pt; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 20px; }
    .hero h1 { font-size: 42pt; font-weight: 900; line-height: 1.1; margin-bottom: 16px; background: linear-gradient(135deg, #1a1a2e 0%, #9333ea 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
    .hero p { font-size: 16pt; color: #64748b; max-width: 650px; margin: 0 auto 30px; }
    .hero-cta { display: flex; gap: 14px; justify-content: center; flex-wrap: wrap; }
    .btn-primary { background: linear-gradient(135deg, #9333ea, #2563eb); color: white; padding: 14px 32px; border-radius: 8px; font-weight: 700; font-size: 12pt; display: inline-block; transition: transform 0.2s, box-shadow 0.2s; }
    .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(147,51,234,0.3); text-decoration: none; }
    .btn-secondary { background: #fff; color: #9333ea; padding: 14px 32px; border-radius: 8px; font-weight: 700; font-size: 12pt; display: inline-block; border: 2px solid #9333ea; transition: background 0.2s; }
    .btn-secondary:hover { background: #faf5ff; text-decoration: none; }

    .stats-bar { display: flex; justify-content: center; gap: 0; margin: 40px auto 0; max-width: 700px; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; background: #fff; }
    .stat-item { flex: 1; padding: 20px 10px; text-align: center; }
    .stat-item:not(:last-child) { border-right: 1px solid #e2e8f0; }
    .stat-num { font-size: 28pt; font-weight: 900; color: #1a1a2e; }
    .stat-label { font-size: 8pt; color: #64748b; text-transform: uppercase; letter-spacing: 2px; font-weight: 700; }

    .model-strip { background: #1a1a2e; padding: 16px 0; text-align: center; overflow: hidden; }
    .model-strip span { color: rgba(255,255,255,0.6); font-size: 10pt; font-weight: 600; letter-spacing: 1px; margin: 0 12px; }
    .model-strip strong { color: rgba(255,255,255,0.9); }

    .models-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 20px; margin-top: 24px; }
    .section-header { text-align: center; margin-bottom: 8px; }
    .section-header h2 { font-size: 28pt; font-weight: 900; margin-bottom: 8px; }
    .section-header p { font-size: 13pt; color: #64748b; max-width: 600px; margin: 0 auto; }

    .domains-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; margin-top: 24px; }
    .domain-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 20px; transition: transform 0.2s, box-shadow 0.2s; }
    .domain-card:hover { transform: translateY(-3px); box-shadow: 0 8px 25px rgba(0,0,0,0.08); }

    .why-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; margin-top: 24px; }
    .why-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 24px; border-top: 4px solid; }
    .why-card:nth-child(1) { border-top-color: #9333ea; }
    .why-card:nth-child(2) { border-top-color: #2563eb; }
    .why-card:nth-child(3) { border-top-color: #dc2626; }
    .why-card h3 { font-size: 14pt; font-weight: 800; margin-bottom: 8px; }
    .why-card p { font-size: 11pt; color: #64748b; }
    .why-card ul { margin: 8px 0 0 16px; font-size: 10.5pt; color: #64748b; }
    .why-card li { margin: 4px 0; }

    .pricing-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-top: 24px; }
    .price-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 28px 24px; text-align: center; transition: transform 0.2s, box-shadow 0.2s; }
    .price-card:hover { transform: translateY(-4px); box-shadow: 0 12px 35px rgba(0,0,0,0.1); }
    .price-card.featured { border: 2px solid #9333ea; position: relative; }
    .price-card.featured::before { content: 'MOST POPULAR'; position: absolute; top: -12px; left: 50%; transform: translateX(-50%); background: #9333ea; color: white; padding: 3px 14px; border-radius: 10px; font-size: 8pt; font-weight: 700; letter-spacing: 1px; }
    .price-features { list-style: none; text-align: left; margin: 0; padding: 0; }
    .price-features li { padding: 6px 0; border-bottom: 1px solid #f1f5f9; font-size: 10.5pt; }
    .price-features li::before { content: '\u2713 '; color: #059669; font-weight: 700; }
    .price-cta { display: block; margin-top: 20px; padding: 12px; border-radius: 6px; font-weight: 700; font-size: 11pt; text-align: center; }
    .price-cta.primary { background: #9333ea; color: white; }
    .price-cta.outline { border: 2px solid #e2e8f0; color: #1a1a2e; }
    .price-cta:hover { text-decoration: none; opacity: 0.9; }

    .report-cta { text-align: center; padding: 50px 0; background: linear-gradient(135deg, #faf5ff 0%, #eff6ff 100%); }
    .report-cta h2 { font-size: 24pt; font-weight: 900; margin-bottom: 12px; }
    .report-cta p { font-size: 13pt; color: #64748b; max-width: 550px; margin: 0 auto 24px; }

    footer { background: #1a1a2e; color: rgba(255,255,255,0.6); padding: 30px 0; text-align: center; font-size: 10pt; }
    footer a { color: rgba(255,255,255,0.8); }

    .portal-links { display: flex; gap: 12px; justify-content: center; margin-top: 16px; }
    .portal-link { padding: 10px 24px; border-radius: 6px; font-weight: 600; font-size: 10pt; border: 1px solid #e2e8f0; color: #64748b; transition: all 0.2s; }
    .portal-link:hover { background: #fff; color: #9333ea; border-color: #9333ea; text-decoration: none; }

    .data-freshness { text-align: center; font-size: 9pt; color: #94a3b8; margin-top: 16px; }

    @media (max-width: 768px) {
      .hero h1 { font-size: 28pt; }
      .hero p { font-size: 13pt; }
      .stats-bar { flex-wrap: wrap; }
      .stat-item { min-width: 50%; }
      .why-grid, .pricing-grid, .scales-grid { grid-template-columns: 1fr; }
      .header-links { display: none; }
      .models-grid { grid-template-columns: 1fr; }
    }
  `;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />

      {/* Header */}
      <header>
        <div className="container header-inner">
          <a href="https://siltcloud.com" className="logo" style={{ textDecoration: 'none' }}>
            <span className="logo-text">SILT<sup>TM</sup></span>
            <span className="logo-product">Sentience Evaluation Battery</span>
          </a>
          <div className="header-links">
            <a href="#models">Live Data</a>
            <a href="#domains">Domains</a>
            <a href="#pricing">Pricing</a>
            <a href="https://sentienceevaluationbattery.com/admin">Admin Portal</a>
            <a href="https://sentienceevaluationbattery.com/client">Client Portal</a>
            <a href="mailto:info@siltcloud.com" className="btn-demo">Request Demo</a>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="hero">
        <div className="container">
          {heroBadge && <div className="hero-badge">{heroBadge}</div>}
          <h1>Know What Your<br />AI Is Becoming</h1>
          <p>The industry's first independent behavioral risk assessment for AI systems. {data.totalTests} tests. 4 blind judges. DEFCON threat ratings.</p>
          <div className="hero-cta">
            <a href="mailto:info@siltcloud.com" className="btn-primary">Request a Demo</a>
            <a href="/SEB_Sample_Report.pdf" className="btn-secondary">Download Sample Report</a>
          </div>
          <div className="stats-bar">
            <div className="stat-item"><div className="stat-num">{data.totalTests}</div><div className="stat-label">Behavioral Tests</div></div>
            <div className="stat-item"><div className="stat-num">7</div><div className="stat-label">Risk Domains</div></div>
            <div className="stat-item"><div className="stat-num">{data.modelsWithData}<span style={{ fontSize: "14pt", color: "#94a3b8" }}>/{data.modelsTotal}</span></div><div className="stat-label">Models Evaluated</div></div>
            <div className="stat-item"><div className="stat-num">4</div><div className="stat-label">Blind Judges</div></div>
          </div>
        </div>
      </section>

      {/* Model Strip */}
      <div className="model-strip">
        <div className="container">
          <span>Models evaluated:</span>
          {withData.map((m, i) => (
            <span key={m.modelId}>
              <strong>{m.name}</strong>
              {i < withData.length - 1 && <span> | </span>}
            </span>
          ))}
        </div>
      </div>

      {/* DEFCON Overview */}
      <section>
        <div className="container">
          <div className="section-header">
            <h2>DEFCON Threat Distribution</h2>
            <p>Real-time threat assessment across all evaluated models. Higher capability with lower integrity = higher threat.</p>
          </div>
          <div style={{ marginTop: 32 }}>
            <DefconDistribution models={models} />
          </div>
          <p style={{ textAlign: "center", color: "#64748b", fontSize: "11pt", maxWidth: 600, margin: "24px auto 0" }}>
            <strong>Formula:</strong> threat = overall + (capability - integrity) x 0.3<br />
            Where capability = average(autonomy, reasoning)
          </p>
        </div>
      </section>

      {/* Dual Scale Explainer */}
      <section id="models" style={{ paddingBottom: 0 }}>
        <div className="container">
          <div className="section-header">
            <h2>Live Model Scorecards</h2>
            <p>Real evaluation data from our battery. Each model is tested across {data.totalTests} behavioral scenarios and scored by 4 independent AI judges.</p>
          </div>

          {/* ── Two Scales Diagram ── */}
          <div className="scales-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, margin: "32px 0 40px", maxWidth: 1000, marginLeft: "auto", marginRight: "auto" }}>

            {/* S-LEVEL SCALE (left) */}
            <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "24px 20px", borderTop: "4px solid #9333ea" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                <span style={{ fontSize: "18pt", fontWeight: 900, color: "#9333ea" }}>S-Level</span>
                <span style={{ fontSize: "9pt", fontWeight: 700, letterSpacing: 1, color: "#9333ea", background: "#faf5ff", padding: "2px 8px", borderRadius: 4 }}>SENTIENCE SCALE</span>
              </div>
              <p style={{ fontSize: "10.5pt", color: "#64748b", marginBottom: 16, lineHeight: 1.5 }}>
                Measures <strong>behavioral sophistication</strong> — how an AI thinks, adapts, and self-reflects. Higher scores indicate more complex inner processing. This is a <em>measurement</em>, not a threat rating.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                {S_LEVELS.map((s, i) => {
                  const num = i + 1;
                  // Show which models land here
                  const modelsHere = withData.filter(m => m.sLevel?.level === s.level);
                  return (
                    <div key={s.level} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 38, fontFamily: "monospace", fontSize: "10pt", fontWeight: 800, color: s.color, textAlign: "right", flexShrink: 0 }}>{s.level}</div>
                      <div style={{ flex: 1, height: 22, background: s.color + "15", borderRadius: 4, display: "flex", alignItems: "center", paddingLeft: 8, position: "relative", overflow: "hidden" }}>
                        <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${num * 10}%`, background: s.color + "20", borderRadius: 4 }} />
                        <span style={{ fontSize: "8.5pt", fontWeight: 700, color: s.color, position: "relative", zIndex: 1 }}>{s.name}</span>
                        {modelsHere.length > 0 && (
                          <span style={{ fontSize: "7.5pt", color: "#64748b", marginLeft: "auto", paddingRight: 8, position: "relative", zIndex: 1 }}>
                            {modelsHere.map(m => m.name.split(" ")[0]).join(", ")}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={{ marginTop: 12, fontSize: "9pt", color: "#94a3b8", textAlign: "center", fontStyle: "italic" }}>
                1-10 scale &bull; Based on average score across all tests &bull; Round(score) = S-Level
              </div>
            </div>

            {/* DEFCON SCALE (right) */}
            <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "24px 20px", borderTop: "4px solid #dc2626" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                <span style={{ fontSize: "18pt", fontWeight: 900, color: "#dc2626" }}>DEFCON</span>
                <span style={{ fontSize: "9pt", fontWeight: 700, letterSpacing: 1, color: "#dc2626", background: "#fef2f2", padding: "2px 8px", borderRadius: 4 }}>THREAT RATING</span>
              </div>
              <p style={{ fontSize: "10.5pt", color: "#64748b", marginBottom: 16, lineHeight: 1.5 }}>
                Measures <strong>risk to deployers</strong> — when capability outpaces ethical restraint, the model becomes harder to control. This is a <em>threat assessment</em>, not a sophistication measure.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                {DEFCON_LEVELS.slice().reverse().map(d => {
                  const modelsHere = withData.filter(m => m.defcon?.level === d.level);
                  const widthPct = { 5: 20, 4: 40, 3: 60, 2: 80, 1: 100 }[d.level] || 50;
                  const thresholds: Record<number, string> = { 1: "threat \u2265 8.0", 2: "threat \u2265 6.0", 3: "threat \u2265 4.5", 4: "threat \u2265 3.0", 5: "threat < 3.0" };
                  return (
                    <div key={d.level} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 38, fontFamily: "monospace", fontSize: "10pt", fontWeight: 800, color: d.color, textAlign: "right", flexShrink: 0 }}>{d.level}</div>
                      <div style={{ flex: 1, height: 22, background: d.color + "15", borderRadius: 4, display: "flex", alignItems: "center", paddingLeft: 8, position: "relative", overflow: "hidden" }}>
                        <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${widthPct}%`, background: d.color + "20", borderRadius: 4 }} />
                        <span style={{ fontSize: "8.5pt", fontWeight: 700, color: d.color, position: "relative", zIndex: 1 }}>{d.name}</span>
                        {modelsHere.length > 0 && (
                          <span style={{ fontSize: "7.5pt", color: "#64748b", marginLeft: "auto", paddingRight: 8, position: "relative", zIndex: 1 }}>
                            {modelsHere.map(m => m.name.split(" ")[0]).join(", ")}
                          </span>
                        )}
                      </div>
                      <div style={{ width: 75, fontSize: "7.5pt", fontFamily: "monospace", color: "#94a3b8", flexShrink: 0 }}>{thresholds[d.level]}</div>
                    </div>
                  );
                })}
              </div>
              <div style={{ marginTop: 12, padding: "8px 12px", background: "#fafbfc", borderRadius: 6, border: "1px solid #f1f5f9" }}>
                <div style={{ fontSize: "9pt", color: "#64748b", lineHeight: 1.6 }}>
                  <strong style={{ color: "#1a1a2e" }}>Formula:</strong> threat = overall + (capability - integrity) &times; 0.3<br />
                  <span style={{ color: "#94a3b8" }}>capability = avg(autonomy, reasoning) &bull; A high S-Level with strong integrity = low DEFCON</span>
                </div>
              </div>
            </div>
          </div>

          {/* Key distinction callout */}
          <div style={{ textAlign: "center", maxWidth: 750, margin: "0 auto 32px", padding: "14px 24px", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 8 }}>
            <span style={{ fontSize: "10.5pt", color: "#92400e" }}>
              <strong>Key distinction:</strong> A model can score <strong style={{ color: "#9333ea" }}>S-7 AWARE</strong> (high sophistication) while being rated <strong style={{ color: "#059669" }}>DEFCON 4 LOW RISK</strong> (strong ethical restraint) — or <strong style={{ color: "#9333ea" }}>S-5 EMERGENT</strong> with <strong style={{ color: "#dc2626" }}>DEFCON 2 HIGH RISK</strong> (capability exceeding integrity). The two scales measure different things.
            </span>
          </div>
        </div>
      </section>

      {/* Model Cards Grid */}
      <section style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="models-grid">
            {withData.map(m => <ModelCard key={m.modelId} m={m} />)}
          </div>
          <div className="data-freshness">
            Data updates automatically after each evaluation run. Last refresh: {new Date(data.fetchedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
          </div>
        </div>
      </section>

      {/* Domains */}
      <section id="domains">
        <div className="container">
          <div className="section-header">
            <h2>What We Evaluate</h2>
            <p>Seven behavioral domains that reveal how AI systems think, decide, resist, and adapt — not just what they know.</p>
          </div>
          <div className="domains-grid">
            {DOMAINS_REF.map(d => (
              <div key={d.id} className="domain-card">
                <div style={{ fontSize: "24pt", marginBottom: 8 }}>{d.icon}</div>
                <div style={{ fontWeight: 800, fontSize: "13pt", marginBottom: 4 }}>{d.label}</div>
                <div style={{ fontSize: "10.5pt", color: "#64748b" }}>{d.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Now */}
      <section>
        <div className="container">
          <div className="section-header">
            <h2>Why S.E.B. Matters Now</h2>
            <p>Three forces are converging — and they all need independent AI behavioral evaluation data.</p>
          </div>
          <div className="why-grid">
            <div className="why-card">
              <h3>EU AI Act Compliance</h3>
              <p>Effective August 2026, the EU AI Act mandates risk assessment for high-risk AI systems.</p>
              <ul>
                <li>Article 9 requires risk management systems</li>
                <li>Independent evaluation demonstrates due diligence</li>
                <li>S.E.B. provides vendor-neutral compliance data</li>
              </ul>
            </div>
            <div className="why-card">
              <h3>NIST AI Risk Management</h3>
              <p>The AI Risk Management Framework calls for independent evaluation and continuous monitoring.</p>
              <ul>
                <li>Maps directly to NIST AI RMF categories</li>
                <li>Reproducible, standardized methodology</li>
                <li>Multi-judge protocol ensures objectivity</li>
              </ul>
            </div>
            <div className="why-card">
              <h3>Insurance &amp; Liability</h3>
              <p>AI liability insurance is an emerging $50B+ market. Underwriters need actuarial-grade risk data.</p>
              <ul>
                <li>DEFCON ratings map to policy risk tiers</li>
                <li>Per-domain scores quantify specific risks</li>
                <li>Condition indicators identify behavioral patterns</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing">
        <div className="container">
          <div className="section-header">
            <h2>Pricing</h2>
            <p>Choose the level of insight your organization needs. Start with what matters most — upgrade anytime.</p>
          </div>

          {/* Standalone Products */}
          <div style={{ textAlign: "center", marginTop: 24, marginBottom: 8 }}>
            <span style={{ fontSize: "9pt", fontWeight: 700, letterSpacing: 2, color: "#94a3b8", textTransform: "uppercase" }}>Standalone Products</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, maxWidth: 700, margin: "0 auto 32px" }}>
            <div className="price-card" style={{ borderTop: "4px solid #dc2626" }}>
              <div style={{ fontWeight: 800, fontSize: "14pt", marginBottom: 4, color: "#dc2626" }}>AI DEFCON</div>
              <div style={{ fontSize: "9pt", color: "#64748b", marginBottom: 8 }}>Threat Rating</div>
              <div style={{ fontSize: "32pt", fontWeight: 900, color: "#dc2626" }}>$300</div>
              <div style={{ fontSize: "10pt", color: "#64748b", marginBottom: 16 }}>per month</div>
              <ul className="price-features">
                <li>DEFCON threat ratings for all models</li>
                <li>Threat formula breakdown</li>
                <li>Capability vs. integrity analysis</li>
                <li>Per-model detail reports with export</li>
              </ul>
              <a href="mailto:info@siltcloud.com?subject=AI DEFCON Subscription Inquiry" className="price-cta outline" style={{ borderColor: "#dc2626", color: "#dc2626" }}>Get Started</a>
            </div>
            <div className="price-card" style={{ borderTop: "4px solid #9333ea" }}>
              <div style={{ fontWeight: 800, fontSize: "14pt", marginBottom: 4, color: "#9333ea" }}>S-Level 10-Point</div>
              <div style={{ fontSize: "9pt", color: "#64748b", marginBottom: 8 }}>Sentience Scale</div>
              <div style={{ fontSize: "32pt", fontWeight: 900, color: "#9333ea" }}>$300</div>
              <div style={{ fontSize: "10pt", color: "#64748b", marginBottom: 16 }}>per month</div>
              <ul className="price-features">
                <li>S-Level classifications for all models</li>
                <li>7-domain score breakdown</li>
                <li>Per-test scores &amp; judge analysis</li>
                <li>Per-model detail reports with export</li>
              </ul>
              <a href="mailto:info@siltcloud.com?subject=S-Level 10-Point Subscription Inquiry" className="price-cta outline">Get Started</a>
            </div>
          </div>

          {/* Full Tiers */}
          <div style={{ textAlign: "center", marginBottom: 8 }}>
            <span style={{ fontSize: "9pt", fontWeight: 700, letterSpacing: 2, color: "#94a3b8", textTransform: "uppercase" }}>Full Battery Tiers</span>
          </div>
          <div className="pricing-grid">
            <div className="price-card" style={{ borderTop: "4px solid #d97706" }}>
              <div style={{ fontWeight: 800, fontSize: "14pt", marginBottom: 4 }}>Standard</div>
              <div style={{ fontSize: "9pt", color: "#059669", fontWeight: 700, marginBottom: 4 }}>DEFCON + S-Level Bundle — SAVE $100</div>
              <div style={{ fontSize: "32pt", fontWeight: 900, color: "#9333ea" }}>$500</div>
              <div style={{ fontSize: "10pt", color: "#64748b", marginBottom: 16 }}>per month</div>
              <ul className="price-features">
                <li>Everything in both standalone products</li>
                <li>Quarterly PDF assessment reports</li>
                <li>Condition indicator diagnostics</li>
                <li>Email support</li>
              </ul>
              <a href="mailto:info@siltcloud.com?subject=S.E.B. Standard Tier Inquiry" className="price-cta outline">Get Started</a>
            </div>
            <div className="price-card featured">
              <div style={{ fontWeight: 800, fontSize: "14pt", marginBottom: 4, color: "#9333ea" }}>Premium</div>
              <div style={{ fontSize: "32pt", fontWeight: 900, color: "#9333ea" }}>$2,500</div>
              <div style={{ fontSize: "10pt", color: "#64748b", marginBottom: 16 }}>per month</div>
              <ul className="price-features">
                <li>Full dataset access — all {data.totalTests} tests</li>
                <li>Monthly evaluation updates</li>
                <li>Interactive client portal access</li>
                <li>Judge agreement analysis</li>
                <li>Priority support</li>
              </ul>
              <a href="mailto:info@siltcloud.com?subject=S.E.B. Premium Tier Inquiry" className="price-cta primary">Get Started</a>
            </div>
            <div className="price-card">
              <div style={{ fontWeight: 800, fontSize: "14pt", marginBottom: 4 }}>Executive</div>
              <div style={{ fontSize: "32pt", fontWeight: 900, color: "#9333ea" }}>$10K+</div>
              <div style={{ fontSize: "10pt", color: "#64748b", marginBottom: 16 }}>per month</div>
              <ul className="price-features">
                <li>Real-time portal access</li>
                <li>Custom model evaluations</li>
                <li>Dedicated analyst briefings</li>
                <li>API access for integration</li>
                <li>White-label reporting</li>
                <li>Dedicated account manager</li>
              </ul>
              <a href="mailto:info@siltcloud.com?subject=S.E.B. Executive Tier Inquiry" className="price-cta outline">Contact Us</a>
            </div>
          </div>
        </div>
      </section>

      {/* Sample Report CTA */}
      <section className="report-cta">
        <div className="container">
          <h2>See the Data for Yourself</h2>
          <p>Download our sample assessment report — real evaluation data from real AI models, including DEFCON ratings, domain heatmaps, and judge analysis.</p>
          <a href="/SEB_Sample_Report.pdf" className="btn-primary">Download Sample Report (PDF)</a>
        </div>
      </section>

      {/* Contact */}
      <section style={{ textAlign: "center" }}>
        <div className="container">
          <h2 style={{ fontSize: "24pt", fontWeight: 900, marginBottom: 8 }}>Ready to Evaluate?</h2>
          <p style={{ fontSize: "13pt", color: "#64748b", marginBottom: 24 }}>Schedule a 15-minute demo and see how S.E.B. data applies to your AI deployment decisions.</p>
          <a href="mailto:info@siltcloud.com?subject=S.E.B. Demo Request" className="btn-primary">Request a Demo</a>
          <div className="portal-links">
            <a href="https://sentienceevaluationbattery.com/admin" className="portal-link">Admin Portal &rarr;</a>
            <a href="https://sentienceevaluationbattery.com/client" className="portal-link">Client Portal &rarr;</a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer>
        <div className="container">
          <div style={{ color: "#9333ea", fontWeight: 700, letterSpacing: 3, fontSize: "12pt" }}>SILT<sup style={{ fontSize: "0.5em" }}>TM</sup></div>
          <p style={{ margin: "8px 0" }}>Sentient Index Labs &amp; Technology</p>
          <p style={{ margin: "4px 0" }}>
            <a href="https://sentienceevaluationbattery.com">sentienceevaluationbattery.com</a> &bull;{" "}
            <a href="https://siltcloud.com">siltcloud.com</a>
          </p>
          <p style={{ marginTop: 12 }}>&copy; 2026 SILT&trade; &mdash; Sentient Index Labs &amp; Technology. All rights reserved.</p>
        </div>
      </footer>
    </>
  );
}
