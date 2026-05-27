export function getStatusTone(item) {
  const normalized = String(item?.status ?? "").toLowerCase();
  if (item?.isHealthy === true || normalized === "running" || normalized === "healthy") {
    return "healthy";
  }
  if (normalized.includes("warn") || normalized === "warning") {
    return "warning";
  }
  if (normalized === "failed" || normalized === "critical" || normalized === "down" || normalized === "inactive") {
    return "critical";
  }
  if (normalized === "unknown" || normalized === "pending" || normalized === "") {
    return "unknown";
  }
  return "warning";
}

export function buildStatusSummary(overview, lastUpdated) {
  const statuses = [
    ...(overview?.containers ?? []),
    ...(overview?.services ?? []),
    ...(overview?.domains ?? []),
  ].map((item) => getStatusTone(item));

  if (overview?.health) {
    statuses.push(getHealthTone(overview.health));
  }

  if (overview?.errors?.length) {
    for (const _error of overview.errors) {
      statuses.push("warning");
    }
  }

  return {
    critical: statuses.filter((status) => status === "critical").length,
    warning: statuses.filter((status) => status === "warning").length,
    healthy: statuses.filter((status) => status === "healthy").length,
    unknown: statuses.filter((status) => status === "unknown").length,
    lastCheckedLabel: formatRelativeTime(lastUpdated),
  };
}

export function buildMetricCards(health, lastUpdated) {
  const safeHealth = health ?? {};
  const memoryTotal = safeHealth.memoryTotalMB || 1;
  const memoryUsed = safeHealth.memoryUsageMB || 0;
  const memoryPercent = clampPercent((memoryUsed / memoryTotal) * 100);
  const diskPercent = clampPercent(safeHealth.diskUsagePct ?? 0);
  const cpuPercent = clampPercent(safeHealth.cpuUsagePercent ?? 0);

  return [
    {
      id: "cpu",
      icon: "CPU",
      label: "CPU load",
      value: `${cpuPercent.toFixed(1)}%`,
      tone: percentTone(cpuPercent),
      badge: percentTone(cpuPercent),
      progress: cpuPercent,
      trend: buildMetricTrend(cpuPercent, 65, "load band"),
      metaLeft: safeHealth.loadAverage ? `Load ${safeHealth.loadAverage}` : "Load unavailable",
      metaRight: `Updated ${formatRelativeTime(lastUpdated)}`,
    },
    {
      id: "memory",
      icon: "MEM",
      label: "Memory",
      value: `${memoryUsed} / ${memoryTotal} MB`,
      tone: percentTone(memoryPercent),
      badge: `${memoryPercent.toFixed(0)}%`,
      progress: memoryPercent,
      trend: buildMetricTrend(memoryPercent, 72, "capacity"),
      metaLeft: "Usage bar",
      metaRight: `Uptime ${safeHealth.uptimeHuman ?? "Unavailable"}`,
    },
    {
      id: "disk",
      icon: "DSK",
      label: "Disk usage",
      value: `${diskPercent.toFixed(1)}%`,
      tone: percentTone(diskPercent),
      badge: diskPercent >= 85 ? "critical" : diskPercent >= 70 ? "warning" : "healthy",
      progress: diskPercent,
      trend: buildMetricTrend(diskPercent, 75, "headroom"),
      metaLeft: diskPercent >= 85 ? "Threshold exceeded" : "Within threshold",
      metaRight: safeHealth.status ?? "unknown",
    },
    {
      id: "uptime",
      icon: "UP",
      label: "Uptime",
      value: safeHealth.uptimeHuman ?? "Unavailable",
      tone: getUptimeTone(safeHealth),
      badge: getUptimeBadge(safeHealth),
      progress: clampPercent(Math.min(cpuPercent * 0.55 + memoryPercent * 0.45, 100)),
      trend: buildUptimeTrend(safeHealth),
      metaLeft: safeHealth.error || "Operational state",
      metaRight: `Last checked ${formatRelativeTime(lastUpdated)}`,
    },
  ];
}

export function buildRefreshState(value) {
  if (!value) {
    return {
      tone: "live",
      label: "Sync pending",
      detail: "Waiting for the first dashboard refresh.",
      pulseLabel: "Standby",
    };
  }

  const date = value instanceof Date ? value : new Date(value);
  const diffSeconds = Math.max(0, Math.round((Date.now() - date.getTime()) / 1000));

  if (diffSeconds < 20) {
    return {
      tone: "live",
      label: "Live polling",
      detail: `${formatRelativeTime(date)} via 15s refresh`,
      pulseLabel: "Fresh",
    };
  }

  if (diffSeconds < 90) {
    return {
      tone: "recent",
      label: "Recent snapshot",
      detail: `${formatRelativeTime(date)} from the last successful poll`,
      pulseLabel: "Recent",
    };
  }

  return {
    tone: "stale",
    label: "Refresh lag",
    detail: `Last successful sync ${formatRelativeTime(date)}`,
    pulseLabel: "Stale",
  };
}

export function buildDiagnosticDetails(summary, target, overview, parsedLogs = []) {
  if (!summary) {
    return null;
  }

  const lowerEvidence = (summary.evidence ?? []).join(" ").toLowerCase();
  const lowerLogs = parsedLogs.map((entry) => entry.message).join(" ").toLowerCase();
  const combined = `${lowerEvidence} ${lowerLogs}`;
  const scope = findTargetScope(target, overview);
  const normalizedSeverity = summary.severity === "high" ? "critical" : summary.severity === "medium" ? "warning" : "healthy";

  let probableCause = "Transient service instability";
  if (combined.includes("502") || combined.includes("bad gateway")) {
    probableCause = "Reverse proxy requests are reaching an unhealthy upstream.";
  } else if (combined.includes("timeout")) {
    probableCause = "Upstream latency or dependency timeouts are increasing.";
  } else if (combined.includes("panic") || combined.includes("fatal")) {
    probableCause = "The target is emitting crash-level failures.";
  } else if (combined.includes("error")) {
    probableCause = "Application errors are recurring in the captured window.";
  } else if (summary.severity === "info") {
    probableCause = "No material failure pattern was detected in the sampled lines.";
  }

  const confidence = summary.severity === "high" ? "High" : summary.severity === "medium" ? "Medium" : "Moderate";
  const affectedScope = scope ? `${scope.kind}: ${scope.name}` : target || "Current target";
  const operatorAction = summary.nextSteps?.[0] ?? "Continue monitoring the target.";
  const strongestSignal =
    parsedLogs.find((entry) => entry.severity === "error" || entry.severity === "warning")?.message ??
    summary.evidence?.[0] ??
    "No strong signal captured in the current sample.";

  return {
    tone: normalizedSeverity,
    confidence,
    probableCause,
    affectedScope,
    operatorAction,
    signalCount: summary.evidence?.length ?? 0,
    strongestSignal,
    createdLabel: formatRelativeTime(summary.createdAt),
  };
}

export function parseLogLine(line, index) {
  const text = String(line ?? "");
  const severity = inferLogSeverity(text);
  const timestampMatch = text.match(/^(\d{4}-\d{2}-\d{2}[T ][0-9:.+-Z]+|\[[0-9:.:-]+\]|[A-Z][a-z]{2}\s+\d+\s+\d{2}:\d{2}:\d{2})/);
  const timeLabel = timestampMatch ? timestampMatch[1].replace(/^\[|\]$/g, "") : `recent-${String(index + 1).padStart(3, "0")}`;
  const message = text
    .replace(/^(\d{4}-\d{2}-\d{2}[T ][0-9:.+-Z]+|\[[0-9:.:-]+\]|[A-Z][a-z]{2}\s+\d+\s+\d{2}:\d{2}:\d{2})\s*/, "")
    .replace(/^(INFO|WARN|WARNING|ERROR|FATAL|PANIC)\s+/i, "")
    .trim();

  return {
    key: `${index}-${text}`,
    lineNumber: String(index + 1).padStart(3, "0"),
    timeLabel,
    severity,
    label: severity === "unknown" ? "info" : severity,
    message: message || text,
    raw: text,
  };
}

export function formatRelativeTime(value) {
  if (!value) {
    return "just now";
  }

  const date = value instanceof Date ? value : new Date(value);
  const diffSeconds = Math.max(0, Math.round((Date.now() - date.getTime()) / 1000));
  if (diffSeconds < 10) {
    return "just now";
  }
  if (diffSeconds < 60) {
    return `${diffSeconds}s ago`;
  }
  if (diffSeconds < 3600) {
    return `${Math.round(diffSeconds / 60)}m ago`;
  }
  return `${Math.round(diffSeconds / 3600)}h ago`;
}

function inferLogSeverity(line) {
  const normalized = line.toLowerCase();
  if (normalized.includes("error") || normalized.includes("fatal") || normalized.includes("panic")) {
    return "error";
  }
  if (normalized.includes("warn") || normalized.includes("timeout")) {
    return "warning";
  }
  if (normalized.includes("info") || normalized.includes("started") || normalized.includes("running")) {
    return "info";
  }
  return "unknown";
}

function getHealthTone(health) {
  if (!health || health.status === "unknown") {
    return "unknown";
  }
  if (health.status === "degraded" || (health.diskUsagePct ?? 0) >= 85) {
    return "critical";
  }
  if ((health.diskUsagePct ?? 0) >= 70 || (health.cpuUsagePercent ?? 0) >= 75) {
    return "warning";
  }
  return "healthy";
}

function percentTone(value) {
  if (value >= 85) {
    return "critical";
  }
  if (value >= 70) {
    return "warning";
  }
  return "healthy";
}

function clampPercent(value) {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.min(100, value));
}

function getUptimeTone(health) {
  if (!health || !health.uptimeHuman) {
    return "unknown";
  }
  if (health.error && !health.uptimeHuman) {
    return "critical";
  }
  return "healthy";
}

function getUptimeBadge(health) {
  if (!health || !health.uptimeHuman) {
    return "unknown";
  }
  return "healthy";
}

function buildMetricTrend(value, warningThreshold, label) {
  if (value >= warningThreshold + 12) {
    return {
      direction: "up",
      tone: "critical",
      label: `Above normal ${label}`,
    };
  }
  if (value >= warningThreshold) {
    return {
      direction: "up",
      tone: "warning",
      label: `Watching ${label}`,
    };
  }
  if (value <= 35) {
    return {
      direction: "down",
      tone: "healthy",
      label: `Comfortable ${label}`,
    };
  }
  return {
    direction: "steady",
    tone: "healthy",
    label: `Stable ${label}`,
  };
}

function buildUptimeTrend(health) {
  if (!health || !health.uptimeHuman) {
    return {
      direction: "up",
      tone: "unknown",
      label: "Uptime unavailable",
    };
  }

  return {
    direction: "steady",
    tone: "healthy",
    label: "Runtime holding steady",
  };
}

function findTargetScope(target, overview) {
  if (!target) {
    return null;
  }

  const container = (overview?.containers ?? []).find((item) => item.target === target);
  if (container) {
    return { kind: "Container", name: container.name };
  }

  const service = (overview?.services ?? []).find((item) => item.target === target);
  if (service) {
    return { kind: "Service", name: service.name };
  }

  const domain = (overview?.domains ?? []).find((item) => item.proxyTarget === target || item.host === target);
  if (domain) {
    return { kind: "Domain", name: domain.host };
  }

  return null;
}
