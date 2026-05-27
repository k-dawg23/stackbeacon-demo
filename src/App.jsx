import React, { useEffect, useState } from "react";
import {
  buildDiagnosticDetails,
  formatAbsoluteDate,
  buildMetricCards,
  buildRefreshState,
  buildStatusSummary,
  formatRelativeTime,
  getStatusTone,
  parseLogLine,
} from "./dashboardState";
import { mockLogsByTarget, mockOverview, mockSummaryByTarget } from "./mockData";

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", href: "#dashboard", mark: "DB", current: true },
  { id: "servers", label: "Servers", href: "#metrics", mark: "SR" },
  { id: "containers", label: "Containers", href: "#containers", mark: "CT" },
  { id: "services", label: "Services", href: "#services", mark: "SV" },
  { id: "domains", label: "Domains", href: "#domains", mark: "DN" },
  { id: "logs", label: "Logs", href: "#logs", mark: "LG" },
  { id: "ai-assistant", label: "AI Assistant", href: "#ai", mark: "AI" },
  { id: "settings", label: "Settings", href: "#settings", mark: "CF" },
];

function App() {
  const [overview, setOverview] = useState(mockOverview);
  const [selectedTarget, setSelectedTarget] = useState(mockOverview.services[0]?.target ?? mockOverview.containers[0]?.target ?? "");
  const [summary, setSummary] = useState(mockSummaryByTarget[mockOverview.services[0]?.target] ?? null);
  const [loading, setLoading] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [, setClock] = useState(Date.now());

  useEffect(() => {
    const refreshTimer = window.setInterval(() => {
      setOverview({ ...mockOverview, errors: [...mockOverview.errors] });
      setLastUpdated(new Date());
    }, 15000);

    const clockTimer = window.setInterval(() => setClock(Date.now()), 5000);

    return () => {
      window.clearInterval(refreshTimer);
      window.clearInterval(clockTimer);
    };
  }, []);

  useEffect(() => {
    if (!selectedTarget) {
      return;
    }
    setSummary(mockSummaryByTarget[selectedTarget] ?? null);
  }, [selectedTarget]);

  const logs = mockLogsByTarget[selectedTarget] ?? [];
  const summaryBar = buildStatusSummary(overview, lastUpdated);
  const metricCards = buildMetricCards(overview.health, lastUpdated);
  const attentionItems = buildAttentionItems(overview);
  const parsedLogs = logs.map((line, index) => parseLogLine(line, index));
  const refreshState = buildRefreshState(lastUpdated);
  const diagnosticDetails = buildDiagnosticDetails(summary, selectedTarget, overview, parsedLogs);

  function handleSummary() {
    setLoading(true);
    window.setTimeout(() => {
      setSummary(mockSummaryByTarget[selectedTarget] ?? null);
      setLoading(false);
    }, 450);
  }

  return (
    <main className="app-shell" id="dashboard">
      <button className="nav-toggle" onClick={() => setNavOpen((open) => !open)} aria-expanded={navOpen}>
        {navOpen ? "Close" : "Menu"}
      </button>

      <aside className={`sidebar ${navOpen ? "open" : ""}`}>
        <div className="sidebar-brand">
          <p className="eyebrow">StackBeacon Demo</p>
          <h1>Operations</h1>
          <p>Mock telemetry and AI triage for portfolio-safe review.</p>
        </div>

        <nav className="sidebar-nav" aria-label="Primary">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.id}
              href={item.href}
              className={`nav-link ${item.current ? "current" : ""}`}
              onClick={() => setNavOpen(false)}
            >
              <span className="nav-mark" aria-hidden="true">{item.mark}</span>
              <span>{item.label}</span>
            </a>
          ))}
        </nav>

        <div className="sidebar-footer">
          <p className="small-label">Mode</p>
          <strong>Public demo</strong>
          <p className="muted">Updated {formatRelativeTime(lastUpdated)}</p>
        </div>
      </aside>

      <div className="page-shell">
        <header className="hero-panel section-hero">
          <div>
            <p className="eyebrow">Public MVP</p>
            <h2>VPS monitoring cockpit</h2>
            <p className="lede">
              A safe demo of the StackBeacon interface with sample infrastructure status, mock logs, and AI-assisted
              triage output.
            </p>
          </div>
          <div className="hero-actions">
            <div className={`refresh-note tone-${refreshState.tone}`}>
              <span className="small-label">Last updated</span>
              <strong>{refreshState.label}</strong>
              <p>{refreshState.detail}</p>
            </div>
          </div>
        </header>

        {overview.errors?.length ? <div className="banner warn">{overview.errors.join(" | ")}</div> : null}

        <section className="status-bar section-status">
          <StatusChip label="Critical issues" value={summaryBar.critical} tone="critical" />
          <StatusChip label="Warnings" value={summaryBar.warning} tone="warning" />
          <StatusChip label="Healthy checks" value={summaryBar.healthy} tone="healthy" />
          <StatusChip label="Unknown" value={summaryBar.unknown} tone="unknown" />
          <StatusChip
            label="Last checked"
            value={summaryBar.lastCheckedLabel}
            tone={refreshState.tone === "stale" ? "warning" : "neutral"}
            pulse={refreshState.pulseLabel}
          />
        </section>

        <section className="metric-grid section-metrics" id="metrics">
          {metricCards.map((card) => (
            <MetricCard key={card.id} card={card} />
          ))}
        </section>

        <section className="primary-grid section-primary">
          <Panel
            id="attention"
            title="Attention board"
            icon="AT"
            subtitle="Highest priority issues gathered into one fast-scanning list."
            meta={`${attentionItems.length} highlighted items`}
          >
            <AttentionBoard items={attentionItems} />
          </Panel>

          <Panel
            id="services"
            title="Services"
            icon="SV"
            subtitle="System services with stronger severity hierarchy and denser status cues."
            meta={`Tracking ${overview.services.length} services`}
          >
            <StatusList items={overview.services} onSelect={setSelectedTarget} selected={selectedTarget} />
          </Panel>

          <Panel
            id="containers"
            title="Containers"
            icon="CT"
            subtitle="Runtime status, recent restarts, and selected target context."
            meta={`Tracking ${overview.containers.length} targets`}
          >
            <StatusList items={overview.containers} onSelect={setSelectedTarget} selected={selectedTarget} />
          </Panel>

          <Panel
            id="domains"
            title="Domains"
            icon="DN"
            subtitle="Certificate recency, response codes, and routing targets."
            meta={`Monitoring ${overview.domains.length} domains`}
          >
            <div className="domain-list">
              {overview.domains.map((domain) => (
                <DomainCard key={domain.host} domain={domain} />
              ))}
            </div>
          </Panel>
        </section>

        <section className="bottom-grid section-bottom">
          <Panel
            id="ai"
            title="AI diagnostics"
            icon="AI"
            subtitle="Differentiated triage guidance with structured output."
            meta={`Provider mode: ${import.meta.env.VITE_AI_PROVIDER ?? "mock"}`}
            variant="ai"
          >
            <div className="ai-hero">
              <div>
                <span className="small-label">Analysis target</span>
                <strong>{selectedTarget || "Unavailable"}</strong>
                <p className="muted">This demo uses local sample logs and prebuilt triage responses.</p>
              </div>
              <button onClick={handleSummary} disabled={loading || !selectedTarget}>
                {loading ? "Analysing..." : "Summarise recent logs"}
              </button>
            </div>
            {summary ? (
              <div className={`summary-card tone-${diagnosticDetails?.tone ?? "healthy"}`}>
                <div className="summary-head">
                  <div>
                    <span className="small-label">Potential issue detected</span>
                    <h3>{summary.summary}</h3>
                  </div>
                  <span className={`severity-badge ${summary.severity}`}>Priority: {summary.severity}</span>
                </div>

                <div className="ai-fact-grid">
                  <FactCard label="Probable cause" value={diagnosticDetails?.probableCause} />
                  <FactCard label="Confidence" value={diagnosticDetails?.confidence} />
                  <FactCard label="Affected scope" value={diagnosticDetails?.affectedScope} />
                  <FactCard label="Primary action" value={diagnosticDetails?.operatorAction} />
                </div>

                <div className="ai-signal-strip">
                  <span className="small-label">Key signal</span>
                  <strong>{diagnosticDetails?.strongestSignal}</strong>
                  <p>
                    {diagnosticDetails?.signalCount ?? 0} evidence lines captured, generated{" "}
                    {diagnosticDetails?.createdLabel ?? "just now"}.
                  </p>
                </div>

                <section>
                  <h4>Evidence</h4>
                  <ul className="evidence-list">
                    {summary.evidence?.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                </section>

                <section>
                  <h4>Suggested action</h4>
                  <ol className="next-step-list">
                    {summary.nextSteps?.map((step) => (
                      <li key={step}>{step}</li>
                    ))}
                  </ol>
                </section>
              </div>
            ) : (
              <div className="summary-empty">
                <span className="small-label">AI analysis</span>
                <p>
                  Select a target and run a summary to inspect the mock triage flow used in the public StackBeacon
                  demo.
                </p>
              </div>
            )}
          </Panel>

          <Panel
            id="logs"
            title={`Operational logs: ${selectedTarget}`}
            icon="LG"
            subtitle="Severity-aware formatting with a live retrieval stamp."
            meta={`Updated ${formatRelativeTime(lastUpdated)}`}
          >
            <div className="log-toolbar">
              <div>
                <span className="small-label">Target</span>
                <strong>{selectedTarget}</strong>
              </div>
              <div>
                <span className="small-label">Mode</span>
                <strong>Sample playback</strong>
              </div>
              <div>
                <span className="small-label">Entries</span>
                <strong>{parsedLogs.length}</strong>
              </div>
            </div>
            <div className="log-view">
              {parsedLogs.length ? (
                parsedLogs.map((entry) => (
                  <article key={entry.key} className={`log-line ${entry.severity}`}>
                    <span className="log-gutter">{entry.lineNumber}</span>
                    <span className="log-time">{entry.timeLabel}</span>
                    <span className={`log-level ${entry.severity}`}>{entry.label}</span>
                    <code>{entry.message}</code>
                  </article>
                ))
              ) : (
                <p className="muted">No logs loaded.</p>
              )}
            </div>
          </Panel>
        </section>

        <section className="settings-panel" id="settings">
          <Panel
            title="Settings preview"
            icon="CF"
            subtitle="Reserved for future operator controls, deployment settings, and provider configuration."
            meta="Placeholder section"
          >
            <p className="muted">
              The full private repository contains the live backend, deployment workflows, and authenticated operator
              paths.
            </p>
          </Panel>
        </section>
      </div>
    </main>
  );
}

function Panel({ id, title, subtitle, meta, variant = "default", icon, children }) {
  return (
    <section id={id} className={`panel panel-${variant}`}>
      <div className="panel-heading">
        <div>
          <p className="small-label">{meta}</p>
          <div className="panel-title-row">
            {icon ? <span className="section-icon">{icon}</span> : null}
            <h3>{title}</h3>
          </div>
          {subtitle ? <p className="panel-subtitle">{subtitle}</p> : null}
        </div>
      </div>
      {children}
    </section>
  );
}

function MetricCard({ card }) {
  return (
    <article className={`metric-card tone-${card.tone}`}>
      <div className="metric-head">
        <div>
          <span className="metric-icon">{card.icon}</span>
          <span className="small-label">{card.label}</span>
          <strong>{card.value}</strong>
        </div>
        <span className={`severity-badge ${card.tone}`}>{card.badge}</span>
      </div>
      <div className={`trend-chip tone-${card.trend.tone}`}>
        <span className="trend-mark" aria-hidden="true">{trendSymbol(card.trend.direction)}</span>
        <span>{card.trend.label}</span>
      </div>
      <div className="metric-bar" aria-hidden="true">
        <span style={{ width: `${card.progress}%` }} />
      </div>
      <div className="metric-meta">
        <span>{card.metaLeft}</span>
        <span>{card.metaRight}</span>
      </div>
    </article>
  );
}

function StatusChip({ label, value, tone, pulse }) {
  return (
    <article className={`status-chip ${tone}`}>
      <span className="small-label">{label}</span>
      <strong>{value}</strong>
      {pulse ? <span className="small-inline">{pulse}</span> : null}
    </article>
  );
}

function StatusList({ items, onSelect, selected }) {
  return (
    <div className="status-list">
      {items.map((item) => {
        const tone = getStatusTone(item);
        const detailBits = [item.details || item.target, "Live status focus"];
        return (
          <button
            key={`${item.kind}-${item.target}`}
            className={`status-row tone-${tone} ${selected === item.target ? "selected" : ""}`}
            onClick={() => onSelect(item.target)}
          >
            <div className="status-row-copy">
              <div className="status-row-title">
                <span className="row-icon">{item.kind === "container" ? "CT" : "SV"}</span>
                <strong>{item.name}</strong>
              </div>
              <p>{detailBits.join(" | ")}</p>
            </div>
            <div className="status-row-meta">
              <span className={`severity-badge ${tone}`}>{item.status}</span>
              <span className="small-inline">Inspect logs</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function DomainCard({ domain }) {
  const tone = getStatusTone(domain);
  const expires = domain.certificateAt ? formatAbsoluteDate(domain.certificateAt) : "No cert data";
  return (
    <article className={`domain-card tone-${tone}`}>
      <div>
        <span className="row-icon">DN</span>
        <span className="small-label">Domain</span>
        <strong>{domain.host}</strong>
        <p>{domain.proxyTarget || "Target unknown"}</p>
      </div>
      <div className="domain-meta">
        <span className={`severity-badge ${tone}`}>{domain.status}</span>
        <p>HTTP {domain.responseCode || "n/a"}</p>
        <p>Expires {expires}</p>
      </div>
    </article>
  );
}

function AttentionBoard({ items }) {
  if (!items.length) {
    return <p className="muted">No immediate attention items. All visible signals are currently stable.</p>;
  }

  return (
    <div className="attention-list">
      {items.map((item) => (
        <article key={item.key} className={`attention-item tone-${item.tone}`}>
          <div>
            <div className="status-row-title">
              <span className="row-icon">AT</span>
              <strong>{item.title}</strong>
            </div>
            <p>{item.description}</p>
          </div>
          <span className={`severity-badge ${item.tone}`}>{item.badge}</span>
        </article>
      ))}
    </div>
  );
}

function FactCard({ label, value }) {
  return (
    <article className="fact-card">
      <span className="small-label">{label}</span>
      <strong>{value || "Unavailable"}</strong>
    </article>
  );
}

function trendSymbol(direction) {
  if (direction === "up") {
    return "^";
  }
  if (direction === "down") {
    return "v";
  }
  return "~";
}

function buildAttentionItems(overview) {
  const items = [];

  if (overview.health?.diskUsagePct >= 85) {
    items.push({
      key: "disk",
      title: "Disk capacity is elevated",
      description: `Disk usage is ${overview.health.diskUsagePct.toFixed(1)}%. Review logs and remove stale artifacts if growth continues.`,
      tone: "critical",
      badge: "Critical",
    });
  }

  if (overview.errors?.length) {
    items.push({
      key: "demo-mode",
      title: "Demo mode is active",
      description: overview.errors.join(" | "),
      tone: "warning",
      badge: "Sample",
    });
  }

  overview.services
    .filter((service) => !service.isHealthy)
    .slice(0, 2)
    .forEach((service) => {
      items.push({
        key: `service-${service.target}`,
        title: `${service.name} requires review`,
        description: service.details || `Current state: ${service.status}`,
        tone: getStatusTone(service),
        badge: service.status,
      });
    });

  return items;
}

export default App;
