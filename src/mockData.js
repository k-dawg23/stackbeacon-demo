const now = Date.now();

export const mockOverview = {
  health: {
    cpuUsagePercent: 38.2,
    memoryUsageMB: 2314,
    memoryTotalMB: 4096,
    diskUsagePct: 71.4,
    loadAverage: "0.82 0.76 0.71",
    uptimeHuman: "12 days",
    status: "healthy",
  },
  containers: [
    {
      kind: "container",
      name: "stackbeacon-web",
      target: "stackbeacon-web",
      isHealthy: true,
      status: "healthy",
      details: "Serving the public dashboard on the edge node.",
    },
    {
      kind: "container",
      name: "queue-worker",
      target: "queue-worker",
      isHealthy: false,
      status: "warning",
      details: "Retry backlog increased after the last deploy window.",
    },
  ],
  services: [
    {
      kind: "service",
      name: "Caddy",
      target: "caddy",
      isHealthy: true,
      status: "running",
      details: "TLS termination active and upstreams reachable.",
    },
    {
      kind: "service",
      name: "PostgreSQL",
      target: "postgresql",
      isHealthy: true,
      status: "running",
      details: "Primary database accepting connections normally.",
    },
    {
      kind: "service",
      name: "Background jobs",
      target: "jobs",
      isHealthy: false,
      status: "warning",
      details: "Worker queue depth is above the preferred threshold.",
    },
  ],
  domains: [
    {
      host: "demo.stackbeacon.app",
      proxyTarget: "127.0.0.1:8080",
      responseCode: 200,
      certificateAt: new Date(now + 1000 * 60 * 60 * 24 * 46).toISOString(),
      status: "healthy",
    },
    {
      host: "status.stackbeacon.app",
      proxyTarget: "127.0.0.1:3000",
      responseCode: 200,
      certificateAt: new Date(now + 1000 * 60 * 60 * 24 * 14).toISOString(),
      status: "warning",
    },
  ],
  errors: ["Demo mode: values refresh from local sample data every 15 seconds."],
};

export const mockLogsByTarget = {
  "stackbeacon-web": [
    "2026-05-27T11:18:04Z INFO started edge listener on :8080",
    "2026-05-27T11:19:10Z INFO handled GET /dashboard in 42ms",
    "2026-05-27T11:20:31Z WARN upstream latency reached 840ms for /api/summary",
    "2026-05-27T11:20:49Z ERROR 502 bad gateway from summary-worker",
  ],
  "queue-worker": [
    "2026-05-27T11:17:11Z INFO batch scheduler tick started",
    "2026-05-27T11:18:28Z WARN retry queue depth exceeded soft limit",
    "2026-05-27T11:19:09Z WARN timeout while contacting cache warmer",
    "2026-05-27T11:20:43Z ERROR job runner failed after 3 retries",
  ],
  caddy: [
    "2026-05-27T11:16:44Z INFO certificate cache warm",
    "2026-05-27T11:18:52Z INFO reverse proxy upstream healthy",
    "2026-05-27T11:19:38Z WARN backend response time approaching threshold",
  ],
  postgresql: [
    "2026-05-27T11:14:21Z INFO checkpoint complete",
    "2026-05-27T11:16:03Z INFO autovacuum finished on public.sessions",
    "2026-05-27T11:19:11Z INFO replication lag stable",
  ],
  jobs: [
    "2026-05-27T11:15:31Z INFO worker pool online",
    "2026-05-27T11:18:59Z WARN queue depth climbed above target",
    "2026-05-27T11:20:12Z WARN timeout while pushing webhook batch",
  ],
};

export const mockSummaryByTarget = {
  "stackbeacon-web": {
    target: "stackbeacon-web",
    summary: "Requests are intermittently failing because the summary worker is unhealthy.",
    severity: "high",
    evidence: ["502 bad gateway from summary-worker", "upstream latency reached 840ms for /api/summary"],
    nextSteps: [
      "Restart the summary worker and confirm the upstream health checks recover.",
      "Inspect recent deployment changes for the summary pipeline.",
    ],
    createdAt: new Date(now - 1000 * 60 * 2).toISOString(),
  },
  "queue-worker": {
    target: "queue-worker",
    summary: "Background processing is degraded by repeated retries and timeout pressure.",
    severity: "medium",
    evidence: ["retry queue depth exceeded soft limit", "job runner failed after 3 retries"],
    nextSteps: [
      "Reduce queue pressure or temporarily scale worker concurrency.",
      "Review the downstream dependency causing repeated timeouts.",
    ],
    createdAt: new Date(now - 1000 * 60 * 4).toISOString(),
  },
  caddy: {
    target: "caddy",
    summary: "The reverse proxy remains healthy with early signs of slower upstream responses.",
    severity: "low",
    evidence: ["backend response time approaching threshold"],
    nextSteps: ["Continue monitoring latency trends during the next refresh window."],
    createdAt: new Date(now - 1000 * 60 * 3).toISOString(),
  },
  postgresql: {
    target: "postgresql",
    summary: "Database telemetry is stable and no actionable error pattern is visible.",
    severity: "info",
    evidence: ["checkpoint complete", "replication lag stable"],
    nextSteps: ["No immediate action required."],
    createdAt: new Date(now - 1000 * 60 * 5).toISOString(),
  },
  jobs: {
    target: "jobs",
    summary: "Job throughput is under pressure because outbound work is timing out.",
    severity: "medium",
    evidence: ["queue depth climbed above target", "timeout while pushing webhook batch"],
    nextSteps: [
      "Inspect the outbound integration health before increasing worker concurrency.",
      "Reprocess the oldest queued jobs once dependency latency normalises.",
    ],
    createdAt: new Date(now - 1000 * 60 * 6).toISOString(),
  },
};
